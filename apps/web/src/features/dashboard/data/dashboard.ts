import { getSettingNumber } from '@lpg/mock-data'
import {
  buildRouteSummary,
  getRouteTripsView,
  type RouteEventSeverity,
  type RouteTripStatus,
  type RouteTripView,
} from '@/features/tours/data/tour-activity'
import { sites } from '@/features/sites/data/sites'
import { trucks } from '@/features/trucks/data/trucks'
import { quantityInfo } from '@/features/trucks/lib/quantity'
import type { UserScope } from '@/features/scope/scope'
import type { Role } from '@/config/rbac/roles'
import type { DateRange } from 'react-day-picker'

export type DashboardPeriod = 'daily' | 'weekly' | 'monthly'
export type DashboardMetricTone = 'sky' | 'emerald' | 'amber' | 'rose'
export type DashboardReserveStatus = 'healthy' | 'watch' | 'critical'
export type DashboardTrendDirection = 'up' | 'down' | 'stable'
export type DashboardActivityStatus = 'completed' | 'attention' | 'planned'

export type DashboardMetric = {
  id: string
  title: string
  value: number
  unit: 'TM' | 'btl' | 'count' | 'percent' | 'days'
  tone: DashboardMetricTone
  deltaPercent: number
  deltaDirection: DashboardTrendDirection
  description: string
  highlight: string
}

export type DashboardTrendPoint = {
  label: string
  transportedTM: number
  delivered: number
  reserveTM: number
  alertCount: number
  serviceRate: number
}

export type DashboardCadenceSummary = {
  period: DashboardPeriod
  label: string
  transportedTM: number
  delivered: number
  reserveTM: number
  alertCount: number
  serviceRate: number
  transportedDeltaPercent: number
  reserveDeltaPercent: number
  narrative: string
}

export type DashboardFleetSummary = {
  fleetName: string
  truckCount: number
  activeTruckCount: number
  activeTripCount: number
  transportedTM: number
  delivered: number
  pendingTM: number
  sharePercent: number
  utilizationPercent: number
  onTimeRate: number
  riskTruckCount: number
  averageLpgLevelPercent: number
  color: string
}

export type DashboardReserveSite = {
  siteId: string
  siteName: string
  city: string
  operator: string
  reserveTM: number
  capacityTM: number
  fillPercent: number
  targetMinPercent: number
  inboundTM: number
  scheduledInboundTM: number
  outboundTM: number
  activeTripCount: number
  daysOfCover: number
  status: DashboardReserveStatus
}

export type DashboardAlert = {
  id: string
  severity: RouteEventSeverity
  title: string
  description: string
  scope: string
  owner: string
  metricValue: string
}

export type DashboardBreakdownItem = {
  id: string
  label: string
  amountTM: number
  sharePercent: number
  color: string
}

export type DashboardRecentActivity = {
  id: string
  title: string
  description: string
  happenedAt: string
  owner: string
  location: string
  volumeTM?: number
  status: DashboardActivityStatus
}

export type DashboardRouteContribution = {
  id: string
  reference: string
  carrierName: string
  truckId: string
  plateNumber: string
  driverName: string
  missionLead: string
  customerName: string
  originLabel: string
  destinationLabel: string
  loadedQuantity: number
  deliveredQuantity: number
  remainingQuantity: number
  unaccounted: number
  transportedSharePercent: number
  deliveredSharePercent: number
  status: RouteTripStatus
  onTime: boolean
}

export type DashboardOverview = {
  dateRangeLabel: string
  generatedAt: string
  totalTransportedTM: number
  totalDeliveredTM: number
  totalReserveTM: number
  reserveCapacityTM: number
  reserveFillPercent: number
  reserveCoverageDays: number
  activeTrips: number
  plannedTrips: number
  incidentTrips: number
  activeTrucks: number
  totalTrucks: number
  riskTrucks: number
  abnormalLossTM: number
  openAlerts: number
  criticalAlerts: number
}

export type DashboardQuery = {
  range?: DateRange
  period?: DashboardPeriod
  fleetName?: string
}

export type DashboardView = {
  viewRole?: Role
  overview: DashboardOverview
  metrics: DashboardMetric[]
  trendByPeriod: Record<DashboardPeriod, DashboardTrendPoint[]>
  cadence: DashboardCadenceSummary[]
  flowBreakdown: DashboardBreakdownItem[]
  reserveSummary: DashboardBreakdownItem[]
  fleets: DashboardFleetSummary[]
  routeContributions: DashboardRouteContribution[]
  reserveSites: DashboardReserveSite[]
  alerts: DashboardAlert[]
  recentActivities: DashboardRecentActivity[]
  query?: DashboardQuery
}

const reserveConfigBySiteId = {
  'site-0033-scdp-kribi': {
    capacityTM: 52,
    reserveTM: 41.8,
    targetMinPercent: 42,
  },
  'site-0028-scdp-bonaberi': {
    capacityTM: 32,
    reserveTM: 17.35,
    targetMinPercent: 40,
  },
  'site-0029-scdp-yaounde': {
    capacityTM: 26,
    reserveTM: 11.4,
    targetMinPercent: 45,
  },
  'site-0001-sctm-bonaberi': {
    capacityTM: 20,
    reserveTM: 6.2,
    targetMinPercent: 38,
  },
  'site-0003-sctm-bafoussam': {
    capacityTM: 14,
    reserveTM: 9.8,
    targetMinPercent: 40,
  },
} as const satisfies Record<
  string,
  { capacityTM: number; reserveTM: number; targetMinPercent: number }
>

const fleetColors = ['#0f766e', '#0284c7', '#ca8a04', '#7c3aed'] as const
const reserveSummaryColors = [
  '#2563eb',
  '#60a5fa',
  '#818cf8',
  '#cbd5e1',
  '#94a3b8',
] as const
const activeRouteStatuses = ['planned', 'in-progress', 'incident'] as const

const dailyTrendOffsets = [
  {
    label: 'Lun',
    transport: 0.79,
    delivered: 0.85,
    reserve: 1.04,
    alerts: 2,
    serviceRate: 79,
  },
  {
    label: 'Mar',
    transport: 0.84,
    delivered: 0.92,
    reserve: 1.03,
    alerts: 2,
    serviceRate: 82,
  },
  {
    label: 'Mer',
    transport: 0.75,
    delivered: 0.8,
    reserve: 1.06,
    alerts: 1,
    serviceRate: 85,
  },
  {
    label: 'Jeu',
    transport: 0.91,
    delivered: 0.93,
    reserve: 1.02,
    alerts: 3,
    serviceRate: 76,
  },
  {
    label: 'Ven',
    transport: 0.96,
    delivered: 0.97,
    reserve: 1.01,
    alerts: 4,
    serviceRate: 73,
  },
] as const

const weeklyTrendOffsets = [
  {
    label: 'S-5',
    transport: 4.85,
    delivered: 4.4,
    reserve: 1.11,
    alerts: 5,
    serviceRate: 84,
  },
  {
    label: 'S-4',
    transport: 5.08,
    delivered: 4.55,
    reserve: 1.08,
    alerts: 6,
    serviceRate: 83,
  },
  {
    label: 'S-3',
    transport: 5.31,
    delivered: 4.78,
    reserve: 1.06,
    alerts: 7,
    serviceRate: 80,
  },
  {
    label: 'S-2',
    transport: 5.47,
    delivered: 4.94,
    reserve: 1.03,
    alerts: 8,
    serviceRate: 78,
  },
  {
    label: 'S-1',
    transport: 5.68,
    delivered: 5.08,
    reserve: 1.01,
    alerts: 9,
    serviceRate: 74,
  },
] as const

const monthlyTrendOffsets = [
  {
    label: 'Nov',
    transport: 20.4,
    delivered: 18.9,
    reserve: 1.17,
    alerts: 18,
    serviceRate: 87,
  },
  {
    label: 'Dec',
    transport: 21.1,
    delivered: 19.7,
    reserve: 1.13,
    alerts: 17,
    serviceRate: 86,
  },
  {
    label: 'Jan',
    transport: 22.5,
    delivered: 20.3,
    reserve: 1.1,
    alerts: 19,
    serviceRate: 84,
  },
  {
    label: 'Fev',
    transport: 23.2,
    delivered: 21.1,
    reserve: 1.07,
    alerts: 21,
    serviceRate: 82,
  },
  {
    label: 'Mar',
    transport: 24.1,
    delivered: 21.9,
    reserve: 1.03,
    alerts: 23,
    serviceRate: 79,
  },
] as const

function round(value: number) {
  return Math.round(value)
}

function roundToOne(value: number) {
  return Number(value.toFixed(1))
}

function isActiveRouteStatus(
  status: string
): status is (typeof activeRouteStatuses)[number] {
  return activeRouteStatuses.includes(
    status as (typeof activeRouteStatuses)[number]
  )
}

function getTrendDirection(value: number): DashboardTrendDirection {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'stable'
}

function getDeltaPercent(current: number, previous: number) {
  if (previous === 0) return 0
  return round(((current - previous) / previous) * 100)
}

function shiftMinutes(value: string, minutes: number) {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}

function formatDateRangeLabel(range?: DateRange): string | null {
  if (!range?.from) return null
  const fmt = (date: Date) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  if (!range.to) return fmt(range.from)
  return `${fmt(range.from)} – ${fmt(range.to)}`
}

function isWithinRange(dateIso: string, range: DateRange): boolean {
  const time = new Date(dateIso).getTime()
  if (Number.isNaN(time)) return true
  const fromTime = range.from ? new Date(range.from).setHours(0, 0, 0, 0) : -Infinity
  const toTime = range.to ? new Date(range.to).setHours(23, 59, 59, 999) : Infinity
  return time >= fromTime && time <= toTime
}

function applyDateRangeFilter<T extends RouteTripView>(
  trips: readonly T[],
  range?: DateRange
): readonly T[] {
  if (!range?.from && !range?.to) return trips
  const normalized: DateRange = {
    from: range.from,
    to: range.to ?? range.from,
  }
  return trips.filter(
    (trip) =>
      isWithinRange(trip.startedAt, normalized) ||
      isWithinRange(trip.lastUpdatedAt, normalized)
  )
}

function buildTrendSeries(current: {
  transportedTM: number
  delivered: number
  reserveTM: number
  alertCount: number
  serviceRate: number
}) {
  const daily = [
    ...dailyTrendOffsets.map((point) => ({
      label: point.label,
      transportedTM: round(current.transportedTM * point.transport),
      delivered: round(current.delivered * point.delivered),
      reserveTM: round(current.reserveTM * point.reserve),
      alertCount: point.alerts,
      serviceRate: point.serviceRate,
    })),
    {
      label: "Aujourd'hui",
      transportedTM: current.transportedTM,
      delivered: current.delivered,
      reserveTM: current.reserveTM,
      alertCount: current.alertCount,
      serviceRate: current.serviceRate,
    },
  ]

  const weekly = [
    ...weeklyTrendOffsets.map((point) => ({
      label: point.label,
      transportedTM: round(current.transportedTM * point.transport),
      delivered: round(current.delivered * point.delivered),
      reserveTM: round(current.reserveTM * point.reserve),
      alertCount: point.alerts,
      serviceRate: point.serviceRate,
    })),
    {
      label: 'Semaine en cours',
      transportedTM: round(current.transportedTM * 5.92),
      delivered: round(current.delivered * 5.22),
      reserveTM: current.reserveTM,
      alertCount: Math.max(current.alertCount + 4, 6),
      serviceRate: Math.max(current.serviceRate + 8, 72),
    },
  ]

  const monthly = [
    ...monthlyTrendOffsets.map((point) => ({
      label: point.label,
      transportedTM: round(current.transportedTM * point.transport),
      delivered: round(current.delivered * point.delivered),
      reserveTM: round(current.reserveTM * point.reserve),
      alertCount: point.alerts,
      serviceRate: point.serviceRate,
    })),
    {
      label: 'Avr',
      transportedTM: round(current.transportedTM * 24.8),
      delivered: round(current.delivered * 22.7),
      reserveTM: current.reserveTM,
      alertCount: Math.max(current.alertCount * 5, 20),
      serviceRate: Math.max(current.serviceRate + 10, 77),
    },
  ]

  return { daily, weekly, monthly }
}

function buildCadence(
  trendByPeriod: Record<DashboardPeriod, DashboardTrendPoint[]>
): DashboardCadenceSummary[] {
  return (
    Object.entries(trendByPeriod) as Array<
      [DashboardPeriod, DashboardTrendPoint[]]
    >
  ).map(([period, series]) => {
    const current = series[series.length - 1]!
    const previous = series[series.length - 2]!

    const label =
      period === 'daily' ? 'Jour' : period === 'weekly' ? 'Semaine' : 'Mois'

    const narrative =
      period === 'daily'
        ? 'Douala concentre la charge du jour, avec Bonaberi encore sous tension.'
        : period === 'weekly'
          ? 'La cadence reste soutenue, mais le réseau Centre demande plus de couverture.'
          : 'Le volume mensuel tient la trajectoire, la réserve demande un rééquilibrage plus fin.'

    return {
      period,
      label,
      transportedTM: current.transportedTM,
      delivered: current.delivered,
      reserveTM: current.reserveTM,
      alertCount: current.alertCount,
      serviceRate: current.serviceRate,
      transportedDeltaPercent: getDeltaPercent(
        current.transportedTM,
        previous.transportedTM
      ),
      reserveDeltaPercent: getDeltaPercent(
        current.reserveTM,
        previous.reserveTM
      ),
      narrative,
    }
  })
}

function buildReserveSites(scope?: UserScope) {
  const routeViews = getRouteTripsView('ALL', scope)

  return Object.entries(reserveConfigBySiteId)
    .map(([siteId, config]) => {
      const site = sites.find((candidate) => candidate.id === siteId)

      if (!site) {
        throw new Error(`Unknown reserve site "${siteId}"`)
      }

      const outboundTM = routeViews
        .filter((trip) => trip.originSite.id === siteId)
        .reduce((total, trip) => total + trip.loadedQuantity, 0)

      const inboundTM = routeViews.reduce((total, trip) => {
        return (
          total +
          trip.stops.reduce((stopTotal, stop) => {
            if (stop.site.id !== siteId || !stop.completed) return stopTotal
            return stopTotal + (stop.deliveredQuantity ?? 0)
          }, 0)
        )
      }, 0)

      const scheduledInboundTM = routeViews.reduce((total, trip) => {
        return (
          total +
          trip.stops.reduce((stopTotal, stop) => {
            if (stop.site.id !== siteId || stop.completed) return stopTotal
            return stopTotal + (stop.deliveredQuantity ?? 0)
          }, 0)
        )
      }, 0)

      const activeTripCount = routeViews.filter((trip) => {
        const touchesSite =
          trip.originSite.id === siteId ||
          trip.destinationSite.id === siteId ||
          trip.stops.some((stop) => stop.site.id === siteId)

        return touchesSite && isActiveRouteStatus(trip.status)
      }).length

      const fillPercent = round((config.reserveTM / config.capacityTM) * 100)
      const criticalFillPercent =
        getSettingNumber('reserve.critical_fill_percent') ?? 35
      const status: DashboardReserveStatus =
        fillPercent < criticalFillPercent
          ? 'critical'
          : fillPercent < config.targetMinPercent
            ? 'watch'
            : 'healthy'

      return {
        siteId,
        siteName: site.name,
        city: site.city,
        operator: site.operator,
        reserveTM: config.reserveTM,
        capacityTM: config.capacityTM,
        fillPercent,
        targetMinPercent: config.targetMinPercent,
        inboundTM,
        scheduledInboundTM,
        outboundTM,
        activeTripCount,
        daysOfCover: roundToOne(
          config.reserveTM / Math.max(outboundTM - scheduledInboundTM / 2, 5.5)
        ),
        status,
      } satisfies DashboardReserveSite
    })
    .sort((left, right) => {
      const statusOrder = { critical: 0, watch: 1, healthy: 2 }
      return (
        statusOrder[left.status] - statusOrder[right.status] ||
        left.reserveTM - right.reserveTM
      )
    })
}

function buildFleetSummaries(totalTransportedTM: number, scope?: UserScope) {
  const routeViews = getRouteTripsView('ALL', scope)
  const fleets = new Map<
    string,
    Omit<DashboardFleetSummary, 'sharePercent' | 'color'>
  >()

  for (const truck of trucks) {
    if (!fleets.has(truck.tenant_name)) {
      fleets.set(truck.tenant_name, {
        fleetName: truck.tenant_name,
        truckCount: 0,
        activeTruckCount: 0,
        activeTripCount: 0,
        transportedTM: 0,
        delivered: 0,
        pendingTM: 0,
        utilizationPercent: 0,
        onTimeRate: 0,
        riskTruckCount: 0,
        averageLpgLevelPercent: 0,
      })
    }

    const entry = fleets.get(truck.tenant_name)!
    entry.truckCount += 1
    entry.activeTruckCount += ['PLANNED', 'INPROGRESS', 'CHECKPOINTACTIVE', 'PENDINGTRANSPORTERACK', 'ACKNOWLEDGED'].includes(truck.tournee_status) ? 1 : 0
    entry.riskTruckCount += truck.risk_level === 'FAIBLE' ? 0 : 1
    entry.averageLpgLevelPercent += quantityInfo(truck).percent
  }

  for (const trip of routeViews) {
    const entry = fleets.get(trip.truck.tenant_name)

    if (!entry) continue

    entry.transportedTM += trip.loadedQuantity
    entry.delivered += trip.deliveredQuantity
    entry.pendingTM += trip.remainingQuantity
    entry.activeTripCount += isActiveRouteStatus(trip.status) ? 1 : 0
    entry.onTimeRate += trip.status === 'planned' ? 0 : trip.onTime ? 1 : 0
  }

  return [...fleets.values()]
    .map((fleet, index) => {
      const relatedTrips = routeViews.filter(
        (trip) => trip.truck.tenant_name === fleet.fleetName
      )
      const nonPlannedTripCount = relatedTrips.filter(
        (trip) => trip.status !== 'planned'
      ).length

      return {
        ...fleet,
        sharePercent:
          totalTransportedTM === 0
            ? 0
            : round((fleet.transportedTM / totalTransportedTM) * 100),
        utilizationPercent:
          fleet.truckCount === 0
            ? 0
            : round((fleet.activeTruckCount / fleet.truckCount) * 100),
        onTimeRate:
          nonPlannedTripCount === 0
            ? 0
            : round((fleet.onTimeRate / nonPlannedTripCount) * 100),
        averageLpgLevelPercent:
          fleet.truckCount === 0
            ? 0
            : round(fleet.averageLpgLevelPercent / fleet.truckCount),
        color: fleetColors[index % fleetColors.length]!,
      } satisfies DashboardFleetSummary
    })
    .filter((fleet) => fleet.transportedTM > 0 || fleet.activeTripCount > 0)
    .sort((left, right) => right.transportedTM - left.transportedTM)
}

function buildFlowBreakdown(
  fleets: readonly DashboardFleetSummary[],
  totalTransportedTM: number
) {
  return fleets
    .filter((fleet) => fleet.transportedTM > 0)
    .map((fleet) => ({
      id: `fleet-${fleet.fleetName.toLowerCase().replace(/\s+/g, '-')}`,
      label: fleet.fleetName,
      amountTM: fleet.transportedTM,
      sharePercent:
        totalTransportedTM === 0
          ? 0
          : round((fleet.transportedTM / totalTransportedTM) * 100),
      color: fleet.color,
    }))
}

function buildReserveSummary(reserveSites: readonly DashboardReserveSite[]) {
  const totalReserveTM = reserveSites.reduce(
    (total, site) => total + site.reserveTM,
    0
  )
  const rankedSites = [...reserveSites].sort(
    (left, right) => right.reserveTM - left.reserveTM
  )
  const primarySites = rankedSites.slice(0, 4)
  const otherReserveKg = rankedSites
    .slice(4)
    .reduce((total, site) => total + site.reserveTM, 0)

  const summary = primarySites.map((site, index) => ({
    id: `reserve-${site.siteId}`,
    label: site.city,
    amountTM: site.reserveTM,
    sharePercent:
      totalReserveTM === 0 ? 0 : round((site.reserveTM / totalReserveTM) * 100),
    color: reserveSummaryColors[index]!,
  }))

  if (otherReserveKg > 0) {
    summary.push({
      id: 'reserve-autres',
      label: 'Autres',
      amountTM: otherReserveKg,
      sharePercent: round((otherReserveKg / totalReserveTM) * 100),
      color: reserveSummaryColors[4]!,
    })
  }

  return summary
}

function buildRouteContributions(
  routeViews: readonly RouteTripView[],
  totalTransportedTM: number,
  totalDeliveredTM: number
) {
  return routeViews
    .map((trip) => ({
      id: trip.id,
      reference: trip.reference,
      carrierName: trip.truck.tenant_name,
      truckId: trip.truck.id,
      plateNumber: trip.truck.license_plate,
      driverName: trip.truck.assigned_driver ?? '',
      missionLead: trip.missionLead ?? '',
      customerName: trip.customerName ?? '',
      originLabel: trip.originSite.city,
      destinationLabel: trip.destinationSite.city,
      loadedQuantity: trip.loadedQuantity,
      deliveredQuantity: trip.deliveredQuantity,
      remainingQuantity: trip.remainingQuantity,
      unaccounted: trip.unaccounted,
      transportedSharePercent:
        totalTransportedTM === 0
          ? 0
          : round((trip.loadedQuantity / totalTransportedTM) * 100),
      deliveredSharePercent:
        totalDeliveredTM === 0
          ? 0
          : round((trip.deliveredQuantity / totalDeliveredTM) * 100),
      status: trip.status,
      onTime: trip.onTime,
    }))
    .sort((left, right) => right.loadedQuantity - left.loadedQuantity)
}

function buildAlerts(reserveSites: readonly DashboardReserveSite[], scope?: UserScope) {
  const routeViews = getRouteTripsView('ALL', scope)
  const alerts: DashboardAlert[] = []

  for (const site of reserveSites) {
    if (site.status === 'critical') {
      alerts.push({
        id: `reserve-${site.siteId}-critical`,
        severity: 'high',
        title: `Réserve basse ${site.siteName}`,
        description:
          'Le niveau disponible est trop bas pour absorber sereinement les prochains flux.',
        scope: site.siteName,
        owner: 'Stock réseau',
        metricValue: `${site.fillPercent}% de remplissage`,
      })
    } else if (site.status === 'watch') {
      alerts.push({
        id: `reserve-${site.siteId}-watch`,
        severity: 'medium',
        title: `Réserve à surveiller ${site.siteName}`,
        description:
          'Le site reste opérationnel mais la marge est courte face aux sorties prévues.',
        scope: site.siteName,
        owner: 'Appro GPL',
        metricValue: `${site.fillPercent}% de remplissage`,
      })
    }
  }

  for (const trip of routeViews) {
    if (trip.unaccounted > 0) {
      alerts.push({
        id: `${trip.id}-loss`,
        severity: 'high',
        title: `Écart de charge ${trip.reference}`,
        description:
          'La baisse de GPL constatée ne correspond pas aux volumes déjà tracés sur la tournée.',
        scope: `${trip.originSite.city} -> ${trip.destinationSite.city}`,
        owner: trip.missionLead,
        metricValue: `${trip.unaccounted} kg à vérifier`,
      })
    }

    if (!trip.onTime && trip.status !== 'planned') {
      alerts.push({
        id: `${trip.id}-eta`,
        severity: 'medium',
        title: `ETA dégradée ${trip.reference}`,
        description:
          'Le respect de la fenêtre client est dégradé et demande un suivi exploitation resserré.',
        scope: trip.customerName,
        owner: trip.missionLead,
        metricValue: `${trip.progressPercent}% de progression`,
      })
    }
  }

  return alerts.sort((left, right) => {
    const severityOrder: Record<RouteEventSeverity, number> = {
      high: 0,
      medium: 1,
      low: 2,
    }
    const priority = (alert: DashboardAlert) => {
      if (alert.id.endsWith('-loss')) return 0
      if (alert.id.includes('critical')) return 1
      if (alert.id.endsWith('-eta')) return 2
      if (alert.id.includes('watch')) return 3
      return 4
    }

    return (
      severityOrder[left.severity] - severityOrder[right.severity] ||
      priority(left) - priority(right) ||
      left.title.localeCompare(right.title)
    )
  })
}

function buildRecentActivities(
  routeViews: ReturnType<typeof getRouteTripsView>,
  reserveSites: readonly DashboardReserveSite[],
  generatedAt: string
) {
  const reserveActivities: DashboardRecentActivity[] = reserveSites
    .filter((site) => site.status !== 'healthy')
    .map((site, index) => ({
      id: `activity-reserve-${site.siteId}`,
      title:
        site.status === 'critical'
          ? `Réserve basse à ${site.city}`
          : `Réserve à surveiller à ${site.city}`,
      description: `${site.fillPercent}% de remplissage avec ${site.scheduledInboundTM} kg en inbound programmé.`,
      happenedAt: shiftMinutes(generatedAt, -(index * 9 + 2)),
      owner: site.status === 'critical' ? 'Stock réseau' : 'Appro GPL',
      location: site.siteName,
      volumeTM: site.reserveTM,
      status: 'attention',
    }))

  const routeEventActivities: DashboardRecentActivity[] = routeViews.flatMap(
    (trip) =>
      trip.events.map((event) => ({
        id: `activity-event-${event.id}`,
        title: event.title,
        description: `${trip.reference} · ${event.description}`,
        happenedAt: event.occurredAt,
        owner: trip.missionLead,
        location: `${trip.originSite.city} -> ${trip.destinationSite.city}`,
        volumeTM:
          event.severity === 'high'
            ? Math.max(trip.unaccounted, trip.remainingQuantity)
            : trip.deliveredQuantity,
        status: event.severity === 'low' ? 'completed' : 'attention',
      }))
  )

  const tripStatusActivities: DashboardRecentActivity[] = routeViews
    .filter((trip) => trip.status !== 'incident')
    .map((trip) => {
      if (trip.status === 'completed') {
        return {
          id: `activity-trip-${trip.id}`,
          title: `Livraison finalisée ${trip.reference}`,
          description: `${trip.deliveredQuantity} kg livrés vers ${trip.destinationSite.name}.`,
          happenedAt: trip.lastUpdatedAt,
          owner: trip.missionLead,
          location: trip.destinationSite.name,
          volumeTM: trip.deliveredQuantity,
          status: 'completed',
        } satisfies DashboardRecentActivity
      }

      if (trip.status === 'planned') {
        return {
          id: `activity-trip-${trip.id}`,
          title: `Préparation de charge ${trip.reference}`,
          description: `${trip.loadedQuantity} kg réservés pour ${trip.destinationSite.name}.`,
          happenedAt: trip.lastUpdatedAt,
          owner: trip.missionLead,
          location: trip.originSite.name,
          volumeTM: trip.loadedQuantity,
          status: 'planned',
        } satisfies DashboardRecentActivity
      }

      return {
        id: `activity-trip-${trip.id}`,
        title: `Acheminement en cours ${trip.reference}`,
        description: `${trip.remainingQuantity} kg encore à délivrer vers ${trip.destinationSite.name}.`,
        happenedAt: trip.lastUpdatedAt,
        owner: trip.missionLead,
        location: `${trip.originSite.city} -> ${trip.destinationSite.city}`,
        volumeTM: trip.remainingQuantity,
        status: 'attention',
      } satisfies DashboardRecentActivity
    })

  return [
    ...reserveActivities,
    ...routeEventActivities,
    ...tripStatusActivities,
  ]
    .sort(
      (left, right) =>
        new Date(right.happenedAt).getTime() -
        new Date(left.happenedAt).getTime()
    )
    .slice(0, 6)
}

export function buildDashboardView(
  role?: Role,
  scope?: UserScope,
  query?: DashboardQuery
): DashboardView {
  const allRouteViews = getRouteTripsView('ALL', scope)
  const routeViews = applyDateRangeFilter(allRouteViews, query?.range)
  const routeSummary = buildRouteSummary(routeViews)
  const reserveSites = buildReserveSites(scope)
  const alerts = buildAlerts(reserveSites, scope)
  const totalTransportedTM = routeViews.reduce(
    (total, trip) => total + trip.loadedQuantity,
    0
  )
  const totalDeliveredTM = routeSummary.deliveredVolume
  const totalReserveTM = reserveSites.reduce(
    (total, site) => total + site.reserveTM,
    0
  )
  const reserveCapacityTM = reserveSites.reduce(
    (total, site) => total + site.capacityTM,
    0
  )
  const reserveCoverageDays = roundToOne(
    totalReserveTM / Math.max(totalDeliveredTM, 1)
  )
  const activeTrucks = trucks.filter((truck) =>
    ['PLANNED', 'INPROGRESS', 'CHECKPOINTACTIVE', 'PENDINGTRANSPORTERACK', 'ACKNOWLEDGED'].includes(truck.tournee_status)
  ).length
  const riskTrucks = trucks.filter((truck) => truck.risk_level !== 'FAIBLE').length
  const abnormalLossTM = routeViews.reduce(
    (total, trip) => total + trip.unaccounted,
    0
  )
  const trendByPeriod = buildTrendSeries({
    transportedTM: totalTransportedTM,
    delivered: totalDeliveredTM,
    reserveTM: totalReserveTM,
    alertCount: alerts.length,
    serviceRate: routeSummary.onTimeRate,
  })
  const generatedAt = routeViews.reduce((latest, trip) => {
    return new Date(trip.lastUpdatedAt) > new Date(latest)
      ? trip.lastUpdatedAt
      : latest
  }, routeViews[0]?.lastUpdatedAt ?? new Date().toISOString())
  const allFleets = buildFleetSummaries(totalTransportedTM, scope)
  const fleets = query?.fleetName
    ? allFleets.filter((fleet) => fleet.fleetName === query.fleetName)
    : allFleets
  const flowBreakdown = buildFlowBreakdown(
    query?.fleetName ? fleets : allFleets,
    totalTransportedTM
  )
  const reserveSummary = buildReserveSummary(reserveSites)
  const routeContributionsFiltered = query?.fleetName
    ? routeViews.filter((trip) => trip.truck.tenant_name === query.fleetName)
    : routeViews
  const routeContributions = buildRouteContributions(
    [...routeContributionsFiltered],
    totalTransportedTM,
    totalDeliveredTM
  )
  const recentActivities = buildRecentActivities(
    [...routeViews],
    reserveSites,
    generatedAt
  )

  const activePeriod: DashboardPeriod = query?.period ?? 'daily'
  const periodSeries = trendByPeriod[activePeriod]
  const periodCurrent = periodSeries[periodSeries.length - 1]!
  const periodPrevious = periodSeries[periodSeries.length - 2]!
  const dynamicDateLabel =
    formatDateRangeLabel(query?.range) ?? '01 avr 2026 - 28 avr 2026'

  return {
    viewRole: role,
    query,
    overview: {
      dateRangeLabel: dynamicDateLabel,
      generatedAt,
      totalTransportedTM,
      totalDeliveredTM,
      totalReserveTM,
      reserveCapacityTM,
      reserveFillPercent: round((totalReserveTM / reserveCapacityTM) * 100),
      reserveCoverageDays,
      activeTrips: routeSummary.activeTrips,
      plannedTrips: routeSummary.plannedTrips,
      incidentTrips: routeSummary.incidentTrips,
      activeTrucks,
      totalTrucks: trucks.length,
      riskTrucks,
      abnormalLossTM,
      openAlerts: alerts.length,
      criticalAlerts: alerts.filter((alert) => alert.severity === 'high')
        .length,
    },
    metrics: [
      {
        id: 'transported',
        title: 'Volumes transportés',
        value: totalTransportedTM,
        unit: 'TM',
        tone: 'sky',
        deltaPercent: getDeltaPercent(
          periodCurrent.transportedTM,
          periodPrevious.transportedTM
        ),
        deltaDirection: getTrendDirection(
          periodCurrent.transportedTM - periodPrevious.transportedTM
        ),
        description: "Volume chargé sur l'ensemble des tournées visibles.",
        highlight: `${routeSummary.activeTrips} tournées actives`,
      },
      {
        id: 'reserve',
        title: 'GPL en réserve',
        value: totalReserveTM,
        unit: 'TM',
        tone: 'emerald',
        deltaPercent: getDeltaPercent(
          periodCurrent.reserveTM,
          periodPrevious.reserveTM
        ),
        deltaDirection: getTrendDirection(
          periodCurrent.reserveTM - periodPrevious.reserveTM
        ),
        description: 'Stock pilotable sur les sites de charge et de reprise.',
        highlight: `${round((totalReserveTM / reserveCapacityTM) * 100)}% de remplissage`,
      },
      {
        id: 'delivered',
        title: 'Flux livrés',
        value: totalDeliveredTM,
        unit: 'TM',
        tone: 'amber',
        deltaPercent: getDeltaPercent(
          periodCurrent.delivered,
          periodPrevious.delivered
        ),
        deltaDirection: getTrendDirection(
          periodCurrent.delivered - periodPrevious.delivered
        ),
        description: 'Volume déjà délivré ou déposé sur les étapes confirmées.',
        highlight: `${routeSummary.onTimeRate}% de service`,
      },
      {
        id: 'alerts',
        title: 'Alertes ouvertes',
        value: alerts.length,
        unit: 'count',
        tone: 'rose',
        deltaPercent: getDeltaPercent(
          periodCurrent.alertCount,
          periodPrevious.alertCount
        ),
        deltaDirection: getTrendDirection(
          periodCurrent.alertCount - periodPrevious.alertCount
        ),
        description:
          'Écarts de charge, réserve basse et retards à traiter par priorité.',
        highlight: `${alerts.filter((alert) => alert.severity === 'high').length} critiques`,
      },
    ],
    trendByPeriod,
    cadence: buildCadence(trendByPeriod),
    // keep query for consumers needing active filters
    flowBreakdown,
    reserveSummary,
    fleets,
    routeContributions,
    reserveSites,
    alerts,
    recentActivities,
  }
}
