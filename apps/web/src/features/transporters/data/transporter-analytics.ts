import { curated } from '@lpg/mock-data'
import type { Vehicle, DeliveryTour } from '@lpg/types'

export interface FleetUtilizationPoint {
  period: string
  active: number
  total: number
  utilizationPct: number
}

export interface TourStatusDist {
  status: string
  count: number
  label: string
}

export interface TourTypeDist {
  type: string
  count: number
}

export interface CapacityUtilization {
  period: string
  totalCapacity: number
  loadedVolume: number
  utilizationPct: number
}

export interface AckPipelinePoint {
  stage: string
  count: number
}

export interface VolumeTrendPoint {
  period: string
  vrac: number
  bouteilles: number
}

export interface TransporterDashboardData {
  fleetUtilization: FleetUtilizationPoint[]
  tourStatusDist: TourStatusDist[]
  tourTypeDist: TourTypeDist[]
  capacityUtilization: CapacityUtilization[]
  ackPipeline: AckPipelinePoint[]
  volumeTrends: VolumeTrendPoint[]
  fleetStats: {
    total: number
    active: number
    totalCapacity: number
  }
  tourStats: {
    total: number
    inProgress: number
    pendingAck: number
    completed: number
  }
}

const TOUR_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planifiées',
  INPROGRESS: 'En cours',
  CHECKPOINTACTIVE: 'Point actif',
  ACKNOWLEDGED: 'Accusée',
  PENDINGTRANSPORTERACK: 'Attente transporteur',
  CLOSED: 'Clôturées',
  CANCELLED: 'Annulées',
}

function getLastNMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }))
  }
  return months
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getTransporterFleetUtilization(transporterId: string, months = 6): FleetUtilizationPoint[] {
  const vehicles = (curated.vehicles as Vehicle[]).filter(
    (v) => v.org_id === transporterId && v.deleted_at === null
  )
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.transporter_org_id === transporterId && t.deleted_at === null
  )

  const monthLabels = getLastNMonths(months)
  const monthKeys = monthLabels.map((label) => {
    const parts = label.split(' ')
    const m = parts[0]!
    const y = parts[1]!
    const monthIdx = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'].indexOf(m)
    return `${y}-${String(Math.max(monthIdx, 0) + 1).padStart(2, '0')}`
  })

  // Count active vehicles per month (vehicles that had tours in that month)
  const activeByMonth: Record<string, number> = {}
  for (const tour of tours) {
    if (!tour.started_at) continue
    const key = getMonthKey(tour.started_at)
    if (tour.vehicle_id) {
      activeByMonth[key] = (activeByMonth[key] ?? 0) + 1
    }
  }

  const totalVehicles = vehicles.length
  return monthKeys.map((key, idx) => ({
    period: monthLabels[idx]!,
    active: activeByMonth[key] ?? 0,
    total: totalVehicles,
    utilizationPct: totalVehicles > 0 ? Math.round(((activeByMonth[key] ?? 0) / totalVehicles) * 10000) / 100 : 0,
  }))
}

export function getTransporterTourStatusDist(transporterId: string): TourStatusDist[] {
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.transporter_org_id === transporterId && t.deleted_at === null
  )

  const counts: Record<string, number> = {}
  for (const tour of tours) {
    counts[tour.status] = (counts[tour.status] ?? 0) + 1
  }

  return Object.entries(counts).map(([status, count]) => ({
    status,
    count,
    label: TOUR_STATUS_LABELS[status] ?? status,
  }))
}

export function getTransporterTourTypeDist(transporterId: string): TourTypeDist[] {
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.transporter_org_id === transporterId && t.deleted_at === null
  )

  const counts: Record<string, number> = {}
  for (const tour of tours) {
    counts[tour.type] = (counts[tour.type] ?? 0) + 1
  }

  return Object.entries(counts).map(([type, count]) => ({
    type,
    count,
  }))
}

export function getTransporterCapacityUtilization(transporterId: string, months = 6): CapacityUtilization[] {
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.transporter_org_id === transporterId && t.deleted_at === null && t.status === 'CLOSED'
  )

  const vehicles = (curated.vehicles as Vehicle[]).filter(
    (v) => v.org_id === transporterId && v.deleted_at === null
  )
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.max_volume ?? 0), 0)

  const monthLabels = getLastNMonths(months)
  const monthKeys = monthLabels.map((label) => {
    const parts = label.split(' ')
    const m = parts[0]!
    const y = parts[1]!
    const monthIdx = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'].indexOf(m)
    return `${y}-${String(Math.max(monthIdx, 0) + 1).padStart(2, '0')}`
  })

  const loadedByMonth: Record<string, number> = {}
  for (const tour of tours) {
    if (!tour.closed_at || !tour.loaded_quantity) continue
    const key = getMonthKey(tour.closed_at)
    loadedByMonth[key] = (loadedByMonth[key] ?? 0) + (tour.loaded_quantity ?? 0)
  }

  return monthKeys.map((key, idx) => ({
    period: monthLabels[idx]!,
    totalCapacity,
    loadedVolume: loadedByMonth[key] ?? 0,
    utilizationPct: totalCapacity > 0 ? Math.round(((loadedByMonth[key] ?? 0) / totalCapacity) * 10000) / 100 : 0,
  }))
}

export function getTransporterAckPipeline(transporterId: string): AckPipelinePoint[] {
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.transporter_org_id === transporterId && t.deleted_at === null
  )

  const created = tours.length
  const assigned = tours.filter((t) => t.assigned_by_transporter_user_id).length
  const acknowledged = tours.filter((t) => t.transporter_assigned_at).length
  const completed = tours.filter((t) => t.status === 'CLOSED').length

  return [
    { stage: 'Créées', count: created },
    { stage: 'Assignées', count: assigned },
    { stage: 'Accusées', count: acknowledged },
    { stage: 'Clôturées', count: completed },
  ]
}

export function getTransporterVolumeTrends(transporterId: string, months = 6): VolumeTrendPoint[] {
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.transporter_org_id === transporterId && t.deleted_at === null && t.status === 'CLOSED'
  )

  const monthLabels = getLastNMonths(months)
  const monthKeys = monthLabels.map((label) => {
    const parts = label.split(' ')
    const m = parts[0]!
    const y = parts[1]!
    const monthIdx = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'].indexOf(m)
    return `${y}-${String(Math.max(monthIdx, 0) + 1).padStart(2, '0')}`
  })

  const vracByMonth: Record<string, number> = {}
  const btlByMonth: Record<string, number> = {}

  for (const tour of tours) {
    if (!tour.closed_at || !tour.delivered_quantity) continue
    const key = getMonthKey(tour.closed_at)
    if (tour.type === 'VRAC') {
      vracByMonth[key] = (vracByMonth[key] ?? 0) + tour.delivered_quantity
    } else if (tour.type === 'BOUTEILLES50KG') {
      btlByMonth[key] = (btlByMonth[key] ?? 0) + tour.delivered_quantity
    }
  }

  return monthKeys.map((key, idx) => ({
    period: monthLabels[idx]!,
    vrac: Math.round((vracByMonth[key] ?? 0) * 100) / 100,
    bouteilles: Math.round((btlByMonth[key] ?? 0) * 100) / 100,
  }))
}

export function getTransporterDashboardData(transporterId: string): TransporterDashboardData {
  const vehicles = (curated.vehicles as Vehicle[]).filter(
    (v) => v.org_id === transporterId && v.deleted_at === null
  )
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.transporter_org_id === transporterId && t.deleted_at === null
  )

  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.max_volume ?? 0), 0)
  const inProgress = tours.filter((t) => t.status === 'INPROGRESS' || t.status === 'CHECKPOINTACTIVE' || t.status === 'ACKNOWLEDGED').length
  const pendingAck = tours.filter((t) => t.status === 'PENDINGTRANSPORTERACK').length
  const completed = tours.filter((t) => t.status === 'CLOSED').length

  return {
    fleetUtilization: getTransporterFleetUtilization(transporterId),
    tourStatusDist: getTransporterTourStatusDist(transporterId),
    tourTypeDist: getTransporterTourTypeDist(transporterId),
    capacityUtilization: getTransporterCapacityUtilization(transporterId),
    ackPipeline: getTransporterAckPipeline(transporterId),
    volumeTrends: getTransporterVolumeTrends(transporterId),
    fleetStats: {
      total: vehicles.length,
      active: vehicles.filter((v) => v.is_active).length,
      totalCapacity,
    },
    tourStats: {
      total: tours.length,
      inProgress,
      pendingAck,
      completed,
    },
  }
}