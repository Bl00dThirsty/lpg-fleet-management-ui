import {
  buildRouteSummary,
  getRouteTripsView,
  type RouteEventSeverity,
  type RouteTripStatus,
  type RouteTripView,
  type TourActivity,
} from '@/features/tours/data/tour-activity'
import { sites, type Site } from '@/features/sites/data/sites'
import { trucks, type Truck } from '@/features/trucks/data/trucks'
import { quantityInfo } from '@/features/trucks/lib/quantity'

export interface DashboardSource {
  routes?: readonly TourActivity[]
  trucks?: readonly Truck[]
  sites?: readonly Site[]
}

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
  scdpReserveTM: number
  scdpCapacityTM: number
  snhReserveTM: number
  snhCapacityTM: number
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

export type DashboardView = {
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

function buildReserveSites(
  siteRows: readonly Site[] = sites,
  routeViews: readonly RouteTripView[] = getRouteTripsView(),
): DashboardReserveSite[] {
  return Object.entries(reserveConfigBySiteId)
    .map(([siteId, config]) => {
      const site = siteRows.find((candidate) => candidate.id === siteId)

      if (!site) {
        // Live site data not yet hydrated (sites store empty during cold
        // start). Render a minimal placeholder row so the dashboard does
        // not crash; the live row replaces this once api.sites.list()
        // resolves.
        const fillPercent = round((config.reserveTM / config.capacityTM) * 100)
        const status: DashboardReserveStatus =
          fillPercent < 35 ? 'critical' : fillPercent < config.targetMinPercent ? 'watch' : 'healthy'
        return {
          siteId,
          siteName: siteId,
          city: '—',
          operator: '—',
          reserveTM: config.reserveTM,
          capacityTM: config.capacityTM,
          fillPercent,
          targetMinPercent: config.targetMinPercent,
          inboundTM: 0,
          scheduledInboundTM: 0,
          outboundTM: 0,
          activeTripCount: 0,
          daysOfCover: 0,
          status,
        } satisfies DashboardReserveSite
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
      const status: DashboardReserveStatus =
        fillPercent < 35
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

function buildFleetSummaries(
  totalTransportedTM: number,
  truckRows: readonly Truck[] = trucks,
  routeViews: readonly RouteTripView[] = getRouteTripsView(),
) {
  const fleets = new Map<
    string,
    Omit<DashboardFleetSummary, 'sharePercent' | 'color'>
  >()

  for (const truck of truckRows) {
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
    const tenantName = trip.truck?.tenant_name
    if (!tenantName) continue
    const entry = fleets.get(tenantName)

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
        (trip) => trip.truck?.tenant_name === fleet.fleetName
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
      carrierName: trip.truck?.tenant_name ?? '—',
      truckId: trip.truck?.id ?? trip.truckId ?? '—',
      plateNumber: trip.truck?.license_plate ?? '—',
      driverName: trip.truck?.assigned_driver ?? trip.missionLead ?? '',
      missionLead: trip.missionLead ?? '',
      customerName: trip.customerName ?? '',
      originLabel: trip.originSite?.city ?? '—',
      destinationLabel: trip.destinationSite?.city ?? '—',
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

function buildAlerts(
  reserveSites: readonly DashboardReserveSite[],
  routeViews: readonly RouteTripView[] = getRouteTripsView(),
) {
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
  routeViews: readonly TourActivity[],
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

export function buildDashboardView(role?: string, _orgId?: string, orgName?: string, source: DashboardSource = {}): DashboardView {
  const routeViews = source.routes ?? getRouteTripsView()
  const truckRows = source.trucks ?? trucks
  const siteRows = source.sites ?? sites
  const isMarketer = role === 'MARKETEUR'
  const isTransporter = role === 'TRANSPORTEUR'

  let filteredRoutes = routeViews
  if (isMarketer) {
    filteredRoutes = routeViews.filter((r) => r.marketeur_name.toLowerCase().includes('sctm') || r.marketeur_name.toLowerCase().includes('gpl') || (orgName && r.marketeur_name.toLowerCase().includes(orgName.toLowerCase())))
    if (filteredRoutes.length === 0) filteredRoutes = routeViews.slice(0, 2)
  } else if (isTransporter) {
    filteredRoutes = routeViews.filter((r) => (r.transporter_name && r.transporter_name.toLowerCase().includes('express')) || (orgName && r.transporter_name?.toLowerCase().includes(orgName.toLowerCase())))
    if (filteredRoutes.length === 0) filteredRoutes = routeViews.slice(0, 2)
  }

  const routeSummary = buildRouteSummary(filteredRoutes)
  const reserveSites = buildReserveSites(siteRows, filteredRoutes)
  const alerts = buildAlerts(reserveSites, filteredRoutes)
  const totalTransportedTM = filteredRoutes.reduce(
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
  const activeTrucks = truckRows.filter((truck) =>
    ['PLANNED', 'INPROGRESS', 'CHECKPOINTACTIVE', 'PENDINGTRANSPORTERACK', 'ACKNOWLEDGED'].includes(truck.tournee_status)
  ).length
  const riskTrucks = truckRows.filter((truck) => truck.risk_level !== 'FAIBLE').length
  const abnormalLossTM = filteredRoutes.reduce(
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
  const generatedAt = filteredRoutes.reduce((latest, trip) => {
    return new Date(trip.lastUpdatedAt) > new Date(latest)
      ? trip.lastUpdatedAt
      : latest
  }, filteredRoutes[0]?.lastUpdatedAt ?? new Date().toISOString())
  const fleets = buildFleetSummaries(totalTransportedTM, truckRows, filteredRoutes)
  const flowBreakdown = buildFlowBreakdown(fleets, totalTransportedTM)
  const reserveSummary = buildReserveSummary(reserveSites)
  const routeContributions = buildRouteContributions(
    filteredRoutes,
    totalTransportedTM,
    totalDeliveredTM
  )
  const recentActivities = buildRecentActivities(
    filteredRoutes,
    reserveSites,
    generatedAt
  )

  const dailyCurrent = trendByPeriod.daily[trendByPeriod.daily.length - 1]!
  const dailyPrevious = trendByPeriod.daily[trendByPeriod.daily.length - 2]!

  const scdpReserveSites = reserveSites.filter((site) => site.siteId.includes('scdp'))
  const scdpReserveTM = roundToOne(
    scdpReserveSites.reduce((sum, site) => sum + site.reserveTM, 0)
  )
  const scdpCapacityTM = roundToOne(
    scdpReserveSites.reduce((sum, site) => sum + site.capacityTM, 0)
  )
  const snhReserveTM = 48.0
  const snhCapacityTM = 60.0

  return {
    overview: {
      dateRangeLabel: '01 avr 2026 - 28 avr 2026',
      generatedAt,
      totalTransportedTM,
      totalDeliveredTM,
      totalReserveTM,
      reserveCapacityTM,
      reserveFillPercent: round((totalReserveTM / reserveCapacityTM) * 100),
      reserveCoverageDays,
      scdpReserveTM,
      scdpCapacityTM,
      snhReserveTM,
      snhCapacityTM,
      activeTrips: routeSummary.activeTrips,
      plannedTrips: routeSummary.plannedTrips,
      incidentTrips: routeSummary.incidentTrips,
      activeTrucks,
      totalTrucks: truckRows.length,
      riskTrucks,
      abnormalLossTM,
      openAlerts: alerts.length,
      criticalAlerts: alerts.filter((alert) => alert.severity === 'high')
        .length,
    },
    metrics: [
      {
        id: 'transported',
        title: isMarketer ? 'Volumes transportés (Mes flux)' : isTransporter ? 'Volumes acheminés' : 'Volumes nationaux transportés',
        value: totalTransportedTM,
        unit: 'TM',
        tone: 'sky',
        deltaPercent: getDeltaPercent(
          dailyCurrent.transportedTM,
          dailyPrevious.transportedTM
        ),
        deltaDirection: getTrendDirection(
          dailyCurrent.transportedTM - dailyPrevious.transportedTM
        ),
        description: isMarketer ? 'Volume chargé sur vos tournées de distribution.' : "Volume chargé sur l'ensemble des tournées visibles.",
        highlight: `${routeSummary.activeTrips} tournées actives`,
      },
      {
        id: 'reserve',
        title: isMarketer ? 'Stock GPL centres emplisseurs' : 'GPL en réserve utile',
        value: totalReserveTM,
        unit: 'TM',
        tone: 'emerald',
        deltaPercent: getDeltaPercent(
          dailyCurrent.reserveTM,
          dailyPrevious.reserveTM
        ),
        deltaDirection: getTrendDirection(
          dailyCurrent.reserveTM - dailyPrevious.reserveTM
        ),
        description: isMarketer ? 'Stock disponible sur vos centres emplisseurs.' : 'Stock pilotable sur les sites de charge et de reprise.',
        highlight: `${round((totalReserveTM / reserveCapacityTM) * 100)}% de remplissage`,
      },
      {
        id: 'delivered',
        title: isMarketer ? 'Volumes livrés aux clients' : 'Flux livrés certifiés',
        value: totalDeliveredTM,
        unit: 'TM',
        tone: 'amber',
        deltaPercent: getDeltaPercent(
          dailyCurrent.delivered,
          dailyPrevious.delivered
        ),
        deltaDirection: getTrendDirection(
          dailyCurrent.delivered - dailyPrevious.delivered
        ),
        description: isMarketer ? 'Volume délivré et validé sur vos étapes de livraison.' : 'Volume déjà délivré ou déposé sur les étapes confirmées.',
        highlight: `${routeSummary.onTimeRate}% de service`,
      },
      {
        id: 'alerts',
        title: isMarketer ? 'Mes alertes opérationnelles' : 'Alertes & Anomalies réseau',
        value: alerts.length,
        unit: 'count',
        tone: 'rose',
        deltaPercent: getDeltaPercent(
          dailyCurrent.alertCount,
          dailyPrevious.alertCount
        ),
        deltaDirection: getTrendDirection(
          dailyCurrent.alertCount - dailyPrevious.alertCount
        ),
        description:
          'Écarts de charge, réserve basse et retards à traiter par priorité.',
        highlight: `${alerts.filter((alert) => alert.severity === 'high').length} critiques`,
      },
    ],
    trendByPeriod,
    cadence: buildCadence(trendByPeriod),
    flowBreakdown,
    reserveSummary,
    fleets,
    routeContributions,
    reserveSites,
    alerts,
    recentActivities,
  }
}
