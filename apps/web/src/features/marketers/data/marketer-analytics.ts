import { curated } from '@lpg/mock-data'
import type { ClientSite, DeliveryTour, Reconciliation } from '@lpg/types'

export interface VolumeTrendPoint {
  period: string
  vrac: number
  bouteilles: number
}

export interface TourStatusDist {
  status: string
  count: number
  label: string
}

export interface ExecutionModeDist {
  mode: string
  count: number
}

export interface CompletionRate {
  period: string
  requested: number
  delivered: number
  rate: number
}

export interface ReconciliationGap {
  period: string
  declared: number
  tracked: number
  gap: number
  gapPct: number
}

export interface ClientSiteCoverage {
  total: number
  active: number
  verified: number
}

export interface MarketerDashboardData {
  volumeTrends: VolumeTrendPoint[]
  tourStatusDist: TourStatusDist[]
  executionModeDist: ExecutionModeDist[]
  completionRates: CompletionRate[]
  reconciliationGaps: ReconciliationGap[]
  clientSiteCoverage: ClientSiteCoverage
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

export function getMarketerVolumeTrends(marketerId: string, months = 6): VolumeTrendPoint[] {
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.marketeur_org_id === marketerId && t.deleted_at === null
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

export function getMarketerTourStatusDist(marketerId: string): TourStatusDist[] {
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.marketeur_org_id === marketerId && t.deleted_at === null
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

export function getMarketerExecutionModeDist(marketerId: string): ExecutionModeDist[] {
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.marketeur_org_id === marketerId && t.deleted_at === null
  )

  const counts: Record<string, number> = {}
  for (const tour of tours) {
    counts[tour.execution_mode] = (counts[tour.execution_mode] ?? 0) + 1
  }

  return Object.entries(counts).map(([mode, count]) => ({
    mode,
    count,
  }))
}

export function getMarketerCompletionRates(marketerId: string, months = 6): CompletionRate[] {
  const tours = (curated.delivery_tours as DeliveryTour[]).filter(
    (t) => t.marketeur_org_id === marketerId && t.deleted_at === null && t.status === 'CLOSED'
  )

  const monthLabels = getLastNMonths(months)
  const monthKeys = monthLabels.map((label) => {
    const parts = label.split(' ')
    const m = parts[0]!
    const y = parts[1]!
    const monthIdx = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'].indexOf(m)
    return `${y}-${String(Math.max(monthIdx, 0) + 1).padStart(2, '0')}`
  })

  const reqByMonth: Record<string, number> = {}
  const delByMonth: Record<string, number> = {}

  for (const tour of tours) {
    if (!tour.closed_at) continue
    const key = getMonthKey(tour.closed_at)
    reqByMonth[key] = (reqByMonth[key] ?? 0) + (tour.requested_quantity ?? 0)
    delByMonth[key] = (delByMonth[key] ?? 0) + (tour.delivered_quantity ?? 0)
  }

  return monthKeys.map((key, idx) => ({
    period: monthLabels[idx]!,
    requested: Math.round((reqByMonth[key] ?? 0) * 100) / 100,
    delivered: Math.round((delByMonth[key] ?? 0) * 100) / 100,
    rate: reqByMonth[key] ? Math.round((delByMonth[key] ?? 0) / reqByMonth[key] * 10000) / 100 : 0,
  }))
}

export function getMarketerReconciliationGaps(marketerId: string, months = 6): ReconciliationGap[] {
  const recs = (curated.reconciliations as Reconciliation[]).filter(
    (r) => {
      const decl = curated.declarations.find((d) => d.id === r.declaration_id)
      return decl?.marketeur_org_id === marketerId && r.deleted_at === null
    }
  )

  const monthLabels = getLastNMonths(months)
  const monthKeys = monthLabels.map((label) => {
    const parts = label.split(' ')
    const m = parts[0]!
    const y = parts[1]!
    const monthIdx = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'].indexOf(m)
    return `${y}-${String(Math.max(monthIdx, 0) + 1).padStart(2, '0')}`
  })

  const declByMonth: Record<string, number> = {}
  const trkByMonth: Record<string, number> = {}

  for (const rec of recs) {
    if (!rec.created_at) continue
    const key = getMonthKey(rec.created_at)
    const decl = curated.declarations.find((d) => d.id === rec.declaration_id)
    if (!decl) continue
    declByMonth[key] = (declByMonth[key] ?? 0) + (decl.declared_volume ?? 0)
    trkByMonth[key] = (trkByMonth[key] ?? 0) + (rec.tracked_volume ?? 0)
  }

  return monthKeys.map((key, idx) => {
    const declared = declByMonth[key] ?? 0
    const tracked = trkByMonth[key] ?? 0
    const gap = Math.round((declared - tracked) * 100) / 100
    return {
      period: monthLabels[idx]!,
      declared: Math.round(declared * 100) / 100,
      tracked: Math.round(tracked * 100) / 100,
      gap,
      gapPct: declared ? Math.round(Math.abs(gap) / declared * 10000) / 100 : 0,
    }
  })
}

export function getMarketerClientSiteCoverage(marketerId: string): ClientSiteCoverage {
  const clientSites = (curated.client_sites as ClientSite[]).filter(
    (cs) => cs.current_marketeur_org_id === marketerId && cs.deleted_at === null
  )

  return {
    total: clientSites.length,
    active: clientSites.filter((cs) => cs.is_active).length,
    verified: clientSites.filter((cs) => cs.is_verified).length,
  }
}

export function getMarketerDashboardData(marketerId: string): MarketerDashboardData {
  return {
    volumeTrends: getMarketerVolumeTrends(marketerId),
    tourStatusDist: getMarketerTourStatusDist(marketerId),
    executionModeDist: getMarketerExecutionModeDist(marketerId),
    completionRates: getMarketerCompletionRates(marketerId),
    reconciliationGaps: getMarketerReconciliationGaps(marketerId),
    clientSiteCoverage: getMarketerClientSiteCoverage(marketerId),
  }
}