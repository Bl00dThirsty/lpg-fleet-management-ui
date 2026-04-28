import {
  buildRouteSummary,
  getRouteTripsView,
  type RouteEventSeverity,
} from '@/features/routes/data/routes'
import { sites } from '@/features/sites/data/sites'
import { getTruckTelemetry, trucks } from '@/features/trucks/data/trucks'

export type DashboardPeriod = 'daily' | 'weekly' | 'monthly'
export type DashboardMetricTone = 'sky' | 'emerald' | 'amber' | 'rose'
export type DashboardReserveStatus = 'healthy' | 'watch' | 'critical'
export type DashboardTrendDirection = 'up' | 'down' | 'stable'
export type DashboardActivityStatus = 'completed' | 'attention' | 'planned'

export type DashboardMetric = {
  id: string
  title: string
  value: number
  unit: 'kg' | 'count' | 'percent' | 'days'
  tone: DashboardMetricTone
  deltaPercent: number
  deltaDirection: DashboardTrendDirection
  description: string
  highlight: string
}

export type DashboardTrendPoint = {
  label: string
  transportedKg: number
  deliveredKg: number
  reserveKg: number
  alertCount: number
  serviceRate: number
}

export type DashboardCadenceSummary = {
  period: DashboardPeriod
  label: string
  transportedKg: number
  deliveredKg: number
  reserveKg: number
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
  transportedKg: number
  deliveredKg: number
  pendingKg: number
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
  reserveKg: number
  capacityKg: number
  fillPercent: number
  targetMinPercent: number
  inboundKg: number
  scheduledInboundKg: number
  outboundKg: number
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
  amountKg: number
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
  volumeKg?: number
  status: DashboardActivityStatus
}

export type DashboardOverview = {
  dateRangeLabel: string
  generatedAt: string
  totalTransportedKg: number
  totalDeliveredKg: number
  totalReserveKg: number
  reserveCapacityKg: number
  reserveFillPercent: number
  reserveCoverageDays: number
  activeTrips: number
  plannedTrips: number
  incidentTrips: number
  activeTrucks: number
  totalTrucks: number
  riskTrucks: number
  abnormalLossKg: number
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
  reserveSites: DashboardReserveSite[]
  alerts: DashboardAlert[]
  recentActivities: DashboardRecentActivity[]
}

const reserveConfigBySiteId = {
  'site-bipaga': {
    capacityKg: 52000,
    reserveKg: 41800,
    targetMinPercent: 42,
  },
  'site-scdp-douala': {
    capacityKg: 32000,
    reserveKg: 17350,
    targetMinPercent: 40,
  },
  'site-scdp-yaounde': {
    capacityKg: 26000,
    reserveKg: 11400,
    targetMinPercent: 45,
  },
  'site-bonaberi-center': {
    capacityKg: 20000,
    reserveKg: 6200,
    targetMinPercent: 38,
  },
  'site-bafoussam-center': {
    capacityKg: 14000,
    reserveKg: 9800,
    targetMinPercent: 40,
  },
} as const satisfies Record<
  string,
  { capacityKg: number; reserveKg: number; targetMinPercent: number }
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
  transportedKg: number
  deliveredKg: number
  reserveKg: number
  alertCount: number
  serviceRate: number
}) {
  const daily = [
    ...dailyTrendOffsets.map((point) => ({
      label: point.label,
      transportedKg: round(current.transportedKg * point.transport),
      deliveredKg: round(current.deliveredKg * point.delivered),
      reserveKg: round(current.reserveKg * point.reserve),
      alertCount: point.alerts,
      serviceRate: point.serviceRate,
    })),
    {
      label: "Aujourd'hui",
      transportedKg: current.transportedKg,
      deliveredKg: current.deliveredKg,
      reserveKg: current.reserveKg,
      alertCount: current.alertCount,
      serviceRate: current.serviceRate,
    },
  ]

  const weekly = [
    ...weeklyTrendOffsets.map((point) => ({
      label: point.label,
      transportedKg: round(current.transportedKg * point.transport),
      deliveredKg: round(current.deliveredKg * point.delivered),
      reserveKg: round(current.reserveKg * point.reserve),
      alertCount: point.alerts,
      serviceRate: point.serviceRate,
    })),
    {
      label: 'Semaine en cours',
      transportedKg: round(current.transportedKg * 5.92),
      deliveredKg: round(current.deliveredKg * 5.22),
      reserveKg: current.reserveKg,
      alertCount: Math.max(current.alertCount + 4, 6),
      serviceRate: Math.max(current.serviceRate + 8, 72),
    },
  ]

  const monthly = [
    ...monthlyTrendOffsets.map((point) => ({
      label: point.label,
      transportedKg: round(current.transportedKg * point.transport),
      deliveredKg: round(current.deliveredKg * point.delivered),
      reserveKg: round(current.reserveKg * point.reserve),
      alertCount: point.alerts,
      serviceRate: point.serviceRate,
    })),
    {
      label: 'Avr',
      transportedKg: round(current.transportedKg * 24.8),
      deliveredKg: round(current.deliveredKg * 22.7),
      reserveKg: current.reserveKg,
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
          ? 'La cadence reste soutenue, mais le reseau Centre demande plus de couverture.'
          : 'Le volume mensuel tient la trajectoire, la reserve demande un reequilibrage plus fin.'

    return {
      period,
      label,
      transportedKg: current.transportedKg,
      deliveredKg: current.deliveredKg,
      reserveKg: current.reserveKg,
      alertCount: current.alertCount,
      serviceRate: current.serviceRate,
      transportedDeltaPercent: getDeltaPercent(
        current.transportedKg,
        previous.transportedKg
      ),
      reserveDeltaPercent: getDeltaPercent(
        current.reserveKg,
        previous.reserveKg
      ),
      narrative,
    }
  })
}

function buildReserveSites() {
  const routeViews = getRouteTripsView()

  return Object.entries(reserveConfigBySiteId)
    .map(([siteId, config]) => {
      const site = sites.find((candidate) => candidate.id === siteId)

      if (!site) {
        throw new Error(`Unknown reserve site "${siteId}"`)
      }

      const outboundKg = routeViews
        .filter((trip) => trip.originSite.id === siteId)
        .reduce((total, trip) => total + trip.loadedQuantityKg, 0)

      const inboundKg = routeViews.reduce((total, trip) => {
        return (
          total +
          trip.stops.reduce((stopTotal, stop) => {
            if (stop.site.id !== siteId || !stop.completed) return stopTotal
            return stopTotal + (stop.deliveredQuantityKg ?? 0)
          }, 0)
        )
      }, 0)

      const scheduledInboundKg = routeViews.reduce((total, trip) => {
        return (
          total +
          trip.stops.reduce((stopTotal, stop) => {
            if (stop.site.id !== siteId || stop.completed) return stopTotal
            return stopTotal + (stop.deliveredQuantityKg ?? 0)
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

      const fillPercent = round((config.reserveKg / config.capacityKg) * 100)
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
        reserveKg: config.reserveKg,
        capacityKg: config.capacityKg,
        fillPercent,
        targetMinPercent: config.targetMinPercent,
        inboundKg,
        scheduledInboundKg,
        outboundKg,
        activeTripCount,
        daysOfCover: roundToOne(
          config.reserveKg / Math.max(outboundKg - scheduledInboundKg / 2, 5500)
        ),
        status,
      } satisfies DashboardReserveSite
    })
    .sort((left, right) => {
      const statusOrder = { critical: 0, watch: 1, healthy: 2 }
      return (
        statusOrder[left.status] - statusOrder[right.status] ||
        left.reserveKg - right.reserveKg
      )
    })
}

function buildFleetSummaries(totalTransportedKg: number) {
  const routeViews = getRouteTripsView()
  const fleets = new Map<
    string,
    Omit<DashboardFleetSummary, 'sharePercent' | 'color'>
  >()

  for (const truck of trucks) {
    if (!fleets.has(truck.tenantName)) {
      fleets.set(truck.tenantName, {
        fleetName: truck.tenantName,
        truckCount: 0,
        activeTruckCount: 0,
        activeTripCount: 0,
        transportedKg: 0,
        deliveredKg: 0,
        pendingKg: 0,
        utilizationPercent: 0,
        onTimeRate: 0,
        riskTruckCount: 0,
        averageLpgLevelPercent: 0,
      })
    }

    const entry = fleets.get(truck.tenantName)!
    entry.truckCount += 1
    entry.activeTruckCount += ['available', 'in_transit'].includes(truck.status)
      ? 1
      : 0
    entry.riskTruckCount += truck.riskLevel === 'low' ? 0 : 1
    entry.averageLpgLevelPercent += getTruckTelemetry(truck.id).lpgLevelPercent
  }

  for (const trip of routeViews) {
    const entry = fleets.get(trip.truck.tenantName)

    if (!entry) continue

    entry.transportedKg += trip.loadedQuantityKg
    entry.deliveredKg += trip.deliveredQuantityKg
    entry.pendingKg += trip.remainingQuantityKg
    entry.activeTripCount += isActiveRouteStatus(trip.status) ? 1 : 0
    entry.onTimeRate += trip.status === 'planned' ? 0 : trip.onTime ? 1 : 0
  }

  return [...fleets.values()]
    .map((fleet, index) => {
      const relatedTrips = routeViews.filter(
        (trip) => trip.truck.tenantName === fleet.fleetName
      )
      const nonPlannedTripCount = relatedTrips.filter(
        (trip) => trip.status !== 'planned'
      ).length

      return {
        ...fleet,
        sharePercent:
          totalTransportedKg === 0
            ? 0
            : round((fleet.transportedKg / totalTransportedKg) * 100),
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
    .filter((fleet) => fleet.transportedKg > 0 || fleet.activeTripCount > 0)
    .sort((left, right) => right.transportedKg - left.transportedKg)
}

function buildFlowBreakdown(
  fleets: readonly DashboardFleetSummary[],
  totalTransportedKg: number
) {
  return fleets
    .filter((fleet) => fleet.transportedKg > 0)
    .map((fleet) => ({
      id: `fleet-${fleet.fleetName.toLowerCase().replace(/\s+/g, '-')}`,
      label: fleet.fleetName,
      amountKg: fleet.transportedKg,
      sharePercent:
        totalTransportedKg === 0
          ? 0
          : round((fleet.transportedKg / totalTransportedKg) * 100),
      color: fleet.color,
    }))
}

function buildReserveSummary(reserveSites: readonly DashboardReserveSite[]) {
  const totalReserveKg = reserveSites.reduce(
    (total, site) => total + site.reserveKg,
    0
  )
  const rankedSites = [...reserveSites].sort(
    (left, right) => right.reserveKg - left.reserveKg
  )
  const primarySites = rankedSites.slice(0, 4)
  const otherReserveKg = rankedSites
    .slice(4)
    .reduce((total, site) => total + site.reserveKg, 0)

  const summary = primarySites.map((site, index) => ({
    id: `reserve-${site.siteId}`,
    label: site.city,
    amountKg: site.reserveKg,
    sharePercent:
      totalReserveKg === 0 ? 0 : round((site.reserveKg / totalReserveKg) * 100),
    color: reserveSummaryColors[index]!,
  }))

  if (otherReserveKg > 0) {
    summary.push({
      id: 'reserve-autres',
      label: 'Autres',
      amountKg: otherReserveKg,
      sharePercent: round((otherReserveKg / totalReserveKg) * 100),
      color: reserveSummaryColors[4]!,
    })
  }

  return summary
}

function buildAlerts(reserveSites: readonly DashboardReserveSite[]) {
  const routeViews = getRouteTripsView()
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
        owner: 'Stock reseau',
        metricValue: `${site.fillPercent}% de remplissage`,
      })
    } else if (site.status === 'watch') {
      alerts.push({
        id: `reserve-${site.siteId}-watch`,
        severity: 'medium',
        title: `Réserve a surveiller ${site.siteName}`,
        description:
          'Le site reste operationnel mais la marge est courte face aux sorties prevues.',
        scope: site.siteName,
        owner: 'Appro GPL',
        metricValue: `${site.fillPercent}% de remplissage`,
      })
    }
  }

  for (const trip of routeViews) {
    if (trip.unaccountedKg > 0) {
      alerts.push({
        id: `${trip.id}-loss`,
        severity: 'high',
        title: `Ecart de charge ${trip.reference}`,
        description:
          'La baisse de GPL constatee ne correspond pas aux volumes déjà traces sur la tournee.',
        scope: `${trip.originSite.city} -> ${trip.destinationSite.city}`,
        owner: trip.missionLead,
        metricValue: `${trip.unaccountedKg} kg a verifier`,
      })
    }

    if (!trip.onTime && trip.status !== 'planned') {
      alerts.push({
        id: `${trip.id}-eta`,
        severity: 'medium',
        title: `ETA degradee ${trip.reference}`,
        description:
          'Le respect de la fenetre client est degrade et demande un suivi exploitation resserre.',
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
          ? `Reserve basse a ${site.city}`
          : `Reserve a surveiller a ${site.city}`,
      description: `${site.fillPercent}% de remplissage avec ${site.scheduledInboundKg} kg en inbound programme.`,
      happenedAt: shiftMinutes(generatedAt, -(index * 9 + 2)),
      owner: site.status === 'critical' ? 'Stock reseau' : 'Appro GPL',
      location: site.siteName,
      volumeKg: site.reserveKg,
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
        volumeKg:
          event.severity === 'high'
            ? Math.max(trip.unaccountedKg, trip.remainingQuantityKg)
            : trip.deliveredQuantityKg,
        status: event.severity === 'low' ? 'completed' : 'attention',
      }))
  )

  const tripStatusActivities: DashboardRecentActivity[] = routeViews
    .filter((trip) => trip.status !== 'incident')
    .map((trip) => {
      if (trip.status === 'completed') {
        return {
          id: `activity-trip-${trip.id}`,
          title: `Livraison finalisee ${trip.reference}`,
          description: `${trip.deliveredQuantityKg} kg livres vers ${trip.destinationSite.name}.`,
          happenedAt: trip.lastUpdatedAt,
          owner: trip.missionLead,
          location: trip.destinationSite.name,
          volumeKg: trip.deliveredQuantityKg,
          status: 'completed',
        } satisfies DashboardRecentActivity
      }

      if (trip.status === 'planned') {
        return {
          id: `activity-trip-${trip.id}`,
          title: `Preparation de charge ${trip.reference}`,
          description: `${trip.loadedQuantityKg} kg reserves pour ${trip.destinationSite.name}.`,
          happenedAt: trip.lastUpdatedAt,
          owner: trip.missionLead,
          location: trip.originSite.name,
          volumeKg: trip.loadedQuantityKg,
          status: 'planned',
        } satisfies DashboardRecentActivity
      }

      return {
        id: `activity-trip-${trip.id}`,
        title: `Acheminement en cours ${trip.reference}`,
        description: `${trip.remainingQuantityKg} kg encore a delivrer vers ${trip.destinationSite.name}.`,
        happenedAt: trip.lastUpdatedAt,
        owner: trip.missionLead,
        location: `${trip.originSite.city} -> ${trip.destinationSite.city}`,
        volumeKg: trip.remainingQuantityKg,
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

export function buildDashboardView(): DashboardView {
  const routeViews = getRouteTripsView()
  const routeSummary = buildRouteSummary(routeViews)
  const reserveSites = buildReserveSites()
  const alerts = buildAlerts(reserveSites)
  const totalTransportedKg = routeViews.reduce(
    (total, trip) => total + trip.loadedQuantityKg,
    0
  )
  const totalDeliveredKg = routeSummary.deliveredVolumeKg
  const totalReserveKg = reserveSites.reduce(
    (total, site) => total + site.reserveKg,
    0
  )
  const reserveCapacityKg = reserveSites.reduce(
    (total, site) => total + site.capacityKg,
    0
  )
  const reserveCoverageDays = roundToOne(
    totalReserveKg / Math.max(totalDeliveredKg, 1)
  )
  const activeTrucks = trucks.filter((truck) =>
    ['available', 'in_transit'].includes(truck.status)
  ).length
  const riskTrucks = trucks.filter((truck) => truck.riskLevel !== 'low').length
  const abnormalLossKg = routeViews.reduce(
    (total, trip) => total + trip.unaccountedKg,
    0
  )
  const trendByPeriod = buildTrendSeries({
    transportedKg: totalTransportedKg,
    deliveredKg: totalDeliveredKg,
    reserveKg: totalReserveKg,
    alertCount: alerts.length,
    serviceRate: routeSummary.onTimeRate,
  })
  const generatedAt = routeViews.reduce((latest, trip) => {
    return new Date(trip.lastUpdatedAt) > new Date(latest)
      ? trip.lastUpdatedAt
      : latest
  }, routeViews[0]?.lastUpdatedAt ?? new Date().toISOString())
  const fleets = buildFleetSummaries(totalTransportedKg)
  const flowBreakdown = buildFlowBreakdown(fleets, totalTransportedKg)
  const reserveSummary = buildReserveSummary(reserveSites)
  const recentActivities = buildRecentActivities(
    routeViews,
    reserveSites,
    generatedAt
  )

  const dailyCurrent = trendByPeriod.daily[trendByPeriod.daily.length - 1]!
  const dailyPrevious = trendByPeriod.daily[trendByPeriod.daily.length - 2]!

  return {
    overview: {
      dateRangeLabel: '01 avr 2026 - 28 avr 2026',
      generatedAt,
      totalTransportedKg,
      totalDeliveredKg,
      totalReserveKg,
      reserveCapacityKg,
      reserveFillPercent: round((totalReserveKg / reserveCapacityKg) * 100),
      reserveCoverageDays,
      activeTrips: routeSummary.activeTrips,
      plannedTrips: routeSummary.plannedTrips,
      incidentTrips: routeSummary.incidentTrips,
      activeTrucks,
      totalTrucks: trucks.length,
      riskTrucks,
      abnormalLossKg,
      openAlerts: alerts.length,
      criticalAlerts: alerts.filter((alert) => alert.severity === 'high')
        .length,
    },
    metrics: [
      {
        id: 'transported',
        title: 'Volumes transportes',
        value: totalTransportedKg,
        unit: 'kg',
        tone: 'sky',
        deltaPercent: getDeltaPercent(
          dailyCurrent.transportedKg,
          dailyPrevious.transportedKg
        ),
        deltaDirection: getTrendDirection(
          dailyCurrent.transportedKg - dailyPrevious.transportedKg
        ),
        description: "Volume charge sur l'ensemble des tournées visibles.",
        highlight: `${routeSummary.activeTrips} tournées actives`,
      },
      {
        id: 'reserve',
        title: 'GPL en réserve',
        value: totalReserveKg,
        unit: 'kg',
        tone: 'emerald',
        deltaPercent: getDeltaPercent(
          dailyCurrent.reserveKg,
          dailyPrevious.reserveKg
        ),
        deltaDirection: getTrendDirection(
          dailyCurrent.reserveKg - dailyPrevious.reserveKg
        ),
        description: 'Stock pilotable sur les sites de charge et de reprise.',
        highlight: `${round((totalReserveKg / reserveCapacityKg) * 100)}% de remplissage`,
      },
      {
        id: 'delivered',
        title: 'Flux livrés',
        value: totalDeliveredKg,
        unit: 'kg',
        tone: 'amber',
        deltaPercent: getDeltaPercent(
          dailyCurrent.deliveredKg,
          dailyPrevious.deliveredKg
        ),
        deltaDirection: getTrendDirection(
          dailyCurrent.deliveredKg - dailyPrevious.deliveredKg
        ),
        description: 'Volume déjà delivre ou depose sur les etapes confirmees.',
        highlight: `${routeSummary.onTimeRate}% de service`,
      },
      {
        id: 'alerts',
        title: 'Alertes ouvertes',
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
          'Ecarts de charge, réserve basse et retards a traiter par priorite.',
        highlight: `${alerts.filter((alert) => alert.severity === 'high').length} critiques`,
      },
    ],
    trendByPeriod,
    cadence: buildCadence(trendByPeriod),
    flowBreakdown,
    reserveSummary,
    fleets,
    reserveSites,
    alerts,
    recentActivities,
  }
}
