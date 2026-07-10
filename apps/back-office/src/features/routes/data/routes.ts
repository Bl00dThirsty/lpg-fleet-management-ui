import { sites, type Site } from '@/features/sites/data/sites'
import { trucks, type Truck } from '@/features/trucks/data/trucks'

export type RouteTripStatus =
  | 'planned'
  | 'in-progress'
  | 'completed'
  | 'incident'

export type RouteStopRole = 'loading' | 'checkpoint' | 'delivery'

export type RouteEventSeverity = 'low' | 'medium' | 'high'

export type RouteTrip = {
  id: string
  reference: string
  truckId: string
  customerName: string
  missionLead: string
  originSiteId: string
  destinationSiteId: string
  startedAt: string
  expectedArrivalAt: string
  lastUpdatedAt: string
  loadedQuantityKg: number
  deliveredQuantityKg: number
  remainingQuantityKg: number
  progressPercent: number
  routeDistanceKm: number
  onTime: boolean
  status: RouteTripStatus
}

export type RouteTripStop = {
  id: string
  siteId: string
  role: RouteStopRole
  title: string
  completed: boolean
  windowLabel: string
  deliveredQuantityKg?: number
  note: string
}

export type RouteTelemetryPoint = {
  id: string
  routeTripId: string
  recordedAt: string
  latitude: number
  longitude: number
  lpgLevelPercent: number
  pressureBar: number
  estimatedVolumeKg: number
}

export type RouteEvent = {
  id: string
  routeTripId: string
  occurredAt: string
  severity: RouteEventSeverity
  title: string
  description: string
}

export type RouteTripViewStop = RouteTripStop & {
  site: Site
}

export type RouteTripView = RouteTrip & {
  truck: Truck
  originSite: Site
  destinationSite: Site
  stops: RouteTripViewStop[]
  telemetry: RouteTelemetryPoint[]
  events: RouteEvent[]
  latestTelemetry: RouteTelemetryPoint
  nextStop: RouteTripViewStop
  deliveredPercent: number
  remainingPercent: number
  lpgDropPercent: number
  pressureDeltaBar: number
  unaccountedKg: number
  attentionLevel: RouteEventSeverity
}

export type RouteSummary = {
  totalTrips: number
  activeTrips: number
  plannedTrips: number
  completedTrips: number
  incidentTrips: number
  activeVolumeKg: number
  deliveredVolumeKg: number
  onTimeRate: number
  attentionCount: number
}

export const routeStatusLabels: Record<RouteTripStatus, string> = {
  planned: 'Planifiee',
  'in-progress': 'En cours',
  completed: 'Terminee',
  incident: 'Incident',
}

export const routeStatusClasses: Record<RouteTripStatus, string> = {
  planned: 'bg-slate-500/10 text-slate-700',
  'in-progress': 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  incident: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export const routeSeverityLabels: Record<RouteEventSeverity, string> = {
  low: 'Normal',
  medium: 'Attention',
  high: 'Critique',
}

export const routeSeverityClasses: Record<RouteEventSeverity, string> = {
  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  high: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export const routeStatusOptions = [
  { label: 'En cours', value: 'in-progress' },
  { label: 'Incident', value: 'incident' },
  { label: 'Planifiee', value: 'planned' },
  { label: 'Terminee', value: 'completed' },
] as const satisfies ReadonlyArray<{
  label: string
  value: RouteTripStatus
}>

export const routeAttentionOptions = [
  { label: 'Normal', value: 'low' },
  { label: 'Attention', value: 'medium' },
  { label: 'Critique', value: 'high' },
] as const satisfies ReadonlyArray<{
  label: string
  value: RouteEventSeverity
}>

const statusSortOrder: Record<RouteTripStatus, number> = {
  'in-progress': 0,
  incident: 1,
  planned: 2,
  completed: 3,
}

const routeTrips = [
  {
    id: 'route-trip-bipaga-bonaberi',
    reference: 'TRP-2401',
    truckId: 'TRX-CM-005',
    customerName: 'Centre emplisseur Bonaberi',
    missionLead: 'Alain Mbarga',
    originSiteId: 'site-bipaga',
    destinationSiteId: 'site-bonaberi-center',
    startedAt: '2026-04-24T06:20:00+01:00',
    expectedArrivalAt: '2026-04-24T11:10:00+01:00',
    lastUpdatedAt: '2026-04-24T10:42:00+01:00',
    loadedQuantityKg: 18500,
    deliveredQuantityKg: 6050,
    remainingQuantityKg: 12450,
    progressPercent: 58,
    routeDistanceKm: 191,
    onTime: true,
    status: 'in-progress',
  },
  {
    id: 'route-trip-nsam-ebolowa',
    reference: 'TRP-2402',
    truckId: 'TTC-CM-002',
    customerName: 'Total Ebolowa',
    missionLead: 'Brice Ndzi',
    originSiteId: 'site-scdp-yaounde',
    destinationSiteId: 'site-total-ebolowa',
    startedAt: '2026-04-24T05:45:00+01:00',
    expectedArrivalAt: '2026-04-24T09:40:00+01:00',
    lastUpdatedAt: '2026-04-24T10:39:00+01:00',
    loadedQuantityKg: 14000,
    deliveredQuantityKg: 0,
    remainingQuantityKg: 12150,
    progressPercent: 71,
    routeDistanceKm: 173,
    onTime: false,
    status: 'incident',
  },
  {
    id: 'route-trip-bonaberi-akwa',
    reference: 'TRP-2403',
    truckId: 'TRX-CM-001',
    customerName: 'Tradex Akwa',
    missionLead: 'Diane Fotso',
    originSiteId: 'site-bonaberi-center',
    destinationSiteId: 'site-tradex-akwa',
    startedAt: '2026-04-24T11:45:00+01:00',
    expectedArrivalAt: '2026-04-24T12:35:00+01:00',
    lastUpdatedAt: '2026-04-24T10:15:00+01:00',
    loadedQuantityKg: 9500,
    deliveredQuantityKg: 0,
    remainingQuantityKg: 9500,
    progressPercent: 0,
    routeDistanceKm: 18,
    onTime: true,
    status: 'planned',
  },
  {
    id: 'route-trip-douala-bonamoussadi',
    reference: 'TRP-2398',
    truckId: 'TTC-CM-006',
    customerName: 'Total Bonamoussadi',
    missionLead: 'Patrick Ngono',
    originSiteId: 'site-scdp-douala',
    destinationSiteId: 'site-total-bonamoussadi',
    startedAt: '2026-04-24T04:50:00+01:00',
    expectedArrivalAt: '2026-04-24T06:10:00+01:00',
    lastUpdatedAt: '2026-04-24T06:18:00+01:00',
    loadedQuantityKg: 11200,
    deliveredQuantityKg: 11050,
    remainingQuantityKg: 150,
    progressPercent: 100,
    routeDistanceKm: 22,
    onTime: true,
    status: 'completed',
  },
] as const satisfies ReadonlyArray<RouteTrip>

const routeStopsByTripId: Record<string, RouteTripStop[]> = {
  'route-trip-bipaga-bonaberi': [
    {
      id: 'trip-2401-stop-origin',
      siteId: 'site-bipaga',
      role: 'loading',
      title: 'Chargement confirmé',
      completed: true,
      windowLabel: '06:00 - 06:30',
      note: 'Chargement initial valide et documents chauffeur emis.',
    },
    {
      id: 'trip-2401-stop-scdp',
      siteId: 'site-scdp-douala',
      role: 'checkpoint',
      title: 'Drop intermediaire SCDP',
      completed: true,
      windowLabel: '09:20 - 09:45',
      deliveredQuantityKg: 6050,
      note: 'Depose intermediaire pour alimentation du reseau Littoral.',
    },
    {
      id: 'trip-2401-stop-destination',
      siteId: 'site-bonaberi-center',
      role: 'delivery',
      title: 'Livraison finale Bonaberi',
      completed: false,
      deliveredQuantityKg: 12450,
      windowLabel: '11:00 - 11:20',
      note: 'Le reliquat alimente le centre emplisseur et la preparation du lot suivant.',
    },
  ],
  'route-trip-nsam-ebolowa': [
    {
      id: 'trip-2402-stop-origin',
      siteId: 'site-scdp-yaounde',
      role: 'loading',
      title: 'Depart Nsam',
      completed: true,
      windowLabel: '05:30 - 05:50',
      note: 'Sortie validee depuis le site SCDP Yaounde.',
    },
    {
      id: 'trip-2402-stop-destination',
      siteId: 'site-total-ebolowa',
      role: 'delivery',
      title: 'Livraison client finale',
      completed: false,
      deliveredQuantityKg: 12150,
      windowLabel: '09:30 - 09:45',
      note: 'Mise en attente suite a un ecart de charge et une verification securite.',
    },
  ],
  'route-trip-bonaberi-akwa': [
    {
      id: 'trip-2403-stop-origin',
      siteId: 'site-bonaberi-center',
      role: 'loading',
      title: 'Preparation chargement',
      completed: false,
      windowLabel: '11:25 - 11:45',
      note: 'Le camion est au quai, pret a basculer vers le trajet urbain.',
    },
    {
      id: 'trip-2403-stop-destination',
      siteId: 'site-tradex-akwa',
      role: 'delivery',
      title: 'Livraison point marketer',
      completed: false,
      deliveredQuantityKg: 9500,
      windowLabel: '12:20 - 12:35',
      note: 'Fenêtre courte, coordination client déja confirmé.',
    },
  ],
  'route-trip-douala-bonamoussadi': [
    {
      id: 'trip-2398-stop-origin',
      siteId: 'site-scdp-douala',
      role: 'loading',
      title: 'Chargement Douala',
      completed: true,
      windowLabel: '04:35 - 04:55',
      note: 'Chargement terminé sans anomalie.',
    },
    {
      id: 'trip-2398-stop-destination',
      siteId: 'site-total-bonamoussadi',
      role: 'delivery',
      title: 'Reception client signée',
      completed: true,
      deliveredQuantityKg: 11050,
      windowLabel: '06:00 - 06:10',
      note: 'Réception client confirmée et bon de livraison cloture.',
    },
  ],
}

const routeTelemetryByTripId: Record<string, RouteTelemetryPoint[]> = {
  'route-trip-bipaga-bonaberi': [
    {
      id: 'trip-2401-tel-1',
      routeTripId: 'route-trip-bipaga-bonaberi',
      recordedAt: '2026-04-24T06:20:00+01:00',
      latitude: 3.09783,
      longitude: 9.98989,
      lpgLevelPercent: 100,
      pressureBar: 12.4,
      estimatedVolumeKg: 18500,
    },
    {
      id: 'trip-2401-tel-2',
      routeTripId: 'route-trip-bipaga-bonaberi',
      recordedAt: '2026-04-24T07:05:00+01:00',
      latitude: 3.245,
      longitude: 10.004,
      lpgLevelPercent: 95,
      pressureBar: 12.2,
      estimatedVolumeKg: 17600,
    },
    {
      id: 'trip-2401-tel-3',
      routeTripId: 'route-trip-bipaga-bonaberi',
      recordedAt: '2026-04-24T08:00:00+01:00',
      latitude: 3.43,
      longitude: 10.002,
      lpgLevelPercent: 88,
      pressureBar: 12,
      estimatedVolumeKg: 16280,
    },
    {
      id: 'trip-2401-tel-4',
      routeTripId: 'route-trip-bipaga-bonaberi',
      recordedAt: '2026-04-24T08:45:00+01:00',
      latitude: 3.6312,
      longitude: 10.0454,
      lpgLevelPercent: 79,
      pressureBar: 11.8,
      estimatedVolumeKg: 14615,
    },
    {
      id: 'trip-2401-tel-5',
      routeTripId: 'route-trip-bipaga-bonaberi',
      recordedAt: '2026-04-24T09:28:00+01:00',
      latitude: 4.04902,
      longitude: 9.7198,
      lpgLevelPercent: 72,
      pressureBar: 11.6,
      estimatedVolumeKg: 13320,
    },
    {
      id: 'trip-2401-tel-6',
      routeTripId: 'route-trip-bipaga-bonaberi',
      recordedAt: '2026-04-24T10:42:00+01:00',
      latitude: 4.061,
      longitude: 9.698,
      lpgLevelPercent: 67,
      pressureBar: 11.5,
      estimatedVolumeKg: 12450,
    },
  ],
  'route-trip-nsam-ebolowa': [
    {
      id: 'trip-2402-tel-1',
      routeTripId: 'route-trip-nsam-ebolowa',
      recordedAt: '2026-04-24T05:45:00+01:00',
      latitude: 3.8398,
      longitude: 11.51372,
      lpgLevelPercent: 100,
      pressureBar: 11.8,
      estimatedVolumeKg: 14000,
    },
    {
      id: 'trip-2402-tel-2',
      routeTripId: 'route-trip-nsam-ebolowa',
      recordedAt: '2026-04-24T06:20:00+01:00',
      latitude: 3.771,
      longitude: 11.519,
      lpgLevelPercent: 99,
      pressureBar: 11.7,
      estimatedVolumeKg: 13860,
    },
    {
      id: 'trip-2402-tel-3',
      routeTripId: 'route-trip-nsam-ebolowa',
      recordedAt: '2026-04-24T07:10:00+01:00',
      latitude: 3.712,
      longitude: 11.518,
      lpgLevelPercent: 96,
      pressureBar: 11.4,
      estimatedVolumeKg: 13440,
    },
    {
      id: 'trip-2402-tel-4',
      routeTripId: 'route-trip-nsam-ebolowa',
      recordedAt: '2026-04-24T08:00:00+01:00',
      latitude: 3.6828,
      longitude: 11.5156,
      lpgLevelPercent: 92,
      pressureBar: 10.8,
      estimatedVolumeKg: 12880,
    },
    {
      id: 'trip-2402-tel-5',
      routeTripId: 'route-trip-nsam-ebolowa',
      recordedAt: '2026-04-24T09:05:00+01:00',
      latitude: 3.541,
      longitude: 11.468,
      lpgLevelPercent: 89,
      pressureBar: 10.1,
      estimatedVolumeKg: 12460,
    },
    {
      id: 'trip-2402-tel-6',
      routeTripId: 'route-trip-nsam-ebolowa',
      recordedAt: '2026-04-24T10:39:00+01:00',
      latitude: 3.41,
      longitude: 11.398,
      lpgLevelPercent: 87,
      pressureBar: 9.5,
      estimatedVolumeKg: 12150,
    },
  ],
  'route-trip-bonaberi-akwa': [
    {
      id: 'trip-2403-tel-1',
      routeTripId: 'route-trip-bonaberi-akwa',
      recordedAt: '2026-04-24T11:25:00+01:00',
      latitude: 4.07142,
      longitude: 9.68177,
      lpgLevelPercent: 100,
      pressureBar: 12.1,
      estimatedVolumeKg: 9500,
    },
    {
      id: 'trip-2403-tel-2',
      routeTripId: 'route-trip-bonaberi-akwa',
      recordedAt: '2026-04-24T12:00:00+01:00',
      latitude: 4.061,
      longitude: 9.71,
      lpgLevelPercent: 100,
      pressureBar: 12.1,
      estimatedVolumeKg: 9500,
    },
    {
      id: 'trip-2403-tel-3',
      routeTripId: 'route-trip-bonaberi-akwa',
      recordedAt: '2026-04-24T12:35:00+01:00',
      latitude: 4.0498,
      longitude: 9.7679,
      lpgLevelPercent: 100,
      pressureBar: 12.1,
      estimatedVolumeKg: 9500,
    },
  ],
  'route-trip-douala-bonamoussadi': [
    {
      id: 'trip-2398-tel-1',
      routeTripId: 'route-trip-douala-bonamoussadi',
      recordedAt: '2026-04-24T04:50:00+01:00',
      latitude: 4.04902,
      longitude: 9.7198,
      lpgLevelPercent: 100,
      pressureBar: 11.5,
      estimatedVolumeKg: 11200,
    },
    {
      id: 'trip-2398-tel-2',
      routeTripId: 'route-trip-douala-bonamoussadi',
      recordedAt: '2026-04-24T05:10:00+01:00',
      latitude: 4.059,
      longitude: 9.723,
      lpgLevelPercent: 78,
      pressureBar: 11.1,
      estimatedVolumeKg: 8735,
    },
    {
      id: 'trip-2398-tel-3',
      routeTripId: 'route-trip-douala-bonamoussadi',
      recordedAt: '2026-04-24T05:28:00+01:00',
      latitude: 4.068,
      longitude: 9.729,
      lpgLevelPercent: 51,
      pressureBar: 10.6,
      estimatedVolumeKg: 5712,
    },
    {
      id: 'trip-2398-tel-4',
      routeTripId: 'route-trip-douala-bonamoussadi',
      recordedAt: '2026-04-24T05:45:00+01:00',
      latitude: 4.078,
      longitude: 9.735,
      lpgLevelPercent: 24,
      pressureBar: 10,
      estimatedVolumeKg: 2688,
    },
    {
      id: 'trip-2398-tel-5',
      routeTripId: 'route-trip-douala-bonamoussadi',
      recordedAt: '2026-04-24T06:05:00+01:00',
      latitude: 4.0912,
      longitude: 9.7411,
      lpgLevelPercent: 1,
      pressureBar: 9.4,
      estimatedVolumeKg: 150,
    },
  ],
}

const routeEventsByTripId: Record<string, RouteEvent[]> = {
  'route-trip-bipaga-bonaberi': [
    {
      id: 'trip-2401-event-1',
      routeTripId: 'route-trip-bipaga-bonaberi',
      occurredAt: '2026-04-24T09:30:00+01:00',
      severity: 'medium',
      title: 'Fenêtre Bonaberi resserrée',
      description:
        'Le centre emplisseur demande un repositionnement de quai dans les 20 prochaines minutes.',
    },
    {
      id: 'trip-2401-event-2',
      routeTripId: 'route-trip-bipaga-bonaberi',
      occurredAt: '2026-04-24T10:05:00+01:00',
      severity: 'low',
      title: 'Contrôle pression stable',
      description:
        'La pression reste dans la zone nominale après le drop intermediaire SCDP.',
    },
  ],
  'route-trip-nsam-ebolowa': [
    {
      id: 'trip-2402-event-1',
      routeTripId: 'route-trip-nsam-ebolowa',
      occurredAt: '2026-04-24T09:05:00+01:00',
      severity: 'high',
      title: 'Ecart de charge détecté',
      description:
        'La baisse de GPL observée n\'est pas cohérente avec la progression du trajet. Vérification securité déclenchée.',
    },
    {
      id: 'trip-2402-event-2',
      routeTripId: 'route-trip-nsam-ebolowa',
      occurredAt: '2026-04-24T09:20:00+01:00',
      severity: 'medium',
      title: 'Contact chauffeur renforce',
      description:
        'Le chauffeur a été bascule en suivi serré avec appel exploitation toutes les 15 minutes.',
    },
  ],
  'route-trip-bonaberi-akwa': [
    {
      id: 'trip-2403-event-1',
      routeTripId: 'route-trip-bonaberi-akwa',
      occurredAt: '2026-04-24T10:15:00+01:00',
      severity: 'low',
      title: 'Ordre de mission confirmé',
      description:
        'Le point de livraison à confirmé la fenêtre d\' arrivage avant 12h35.',
    },
  ],
  'route-trip-douala-bonamoussadi': [
    {
      id: 'trip-2398-event-1',
      routeTripId: 'route-trip-douala-bonamoussadi',
      occurredAt: '2026-04-24T06:12:00+01:00',
      severity: 'low',
      title: 'Livraison signée',
      description:
        'Le bon de livraison est signé et le retour dépôt peut être engagé.',
    },
  ],
}

const siteById = new Map(sites.map((site) => [site.id, site]))
const truckById = new Map(trucks.map((truck) => [truck.id, truck]))

function requireSite(siteId: string) {
  const site = siteById.get(siteId)

  if (!site) {
    throw new Error(`Unknown site "${siteId}"`)
  }

  return site
}

function requireTruck(truckId: string) {
  const truck = truckById.get(truckId)

  if (!truck) {
    throw new Error(`Unknown truck "${truckId}"`)
  }

  return truck
}

function getHighestSeverity(events: readonly RouteEvent[]): RouteEventSeverity {
  if (events.some((event) => event.severity === 'high')) return 'high'
  if (events.some((event) => event.severity === 'medium')) return 'medium'
  return 'low'
}

export function getRouteTripsView(): RouteTripView[] {
  return [...routeTrips]
    .map((trip) => {
      const truck = requireTruck(trip.truckId)
      const originSite = requireSite(trip.originSiteId)
      const destinationSite = requireSite(trip.destinationSiteId)
      const stops = (routeStopsByTripId[trip.id] ?? []).map((stop) => ({
        ...stop,
        site: requireSite(stop.siteId),
      }))

      if (stops.length === 0) {
        throw new Error(`Route trip "${trip.id}" has no stops`)
      }

      const telemetry = routeTelemetryByTripId[trip.id] ?? []
      const latestTelemetry = telemetry[telemetry.length - 1] ?? {
        id: `${trip.id}-fallback`,
        routeTripId: trip.id,
        recordedAt: trip.lastUpdatedAt,
        latitude: truck.latitude,
        longitude: truck.longitude,
        lpgLevelPercent: Math.round(
          (trip.remainingQuantityKg / trip.loadedQuantityKg) * 100
        ),
        pressureBar: 0,
        estimatedVolumeKg: trip.remainingQuantityKg,
      }
      const firstTelemetry = telemetry[0] ?? latestTelemetry
      const events = routeEventsByTripId[trip.id] ?? []
      const nextStop =
        stops.find((stop) => !stop.completed) ?? stops[stops.length - 1]!
      const deliveredPercent = Math.round(
        (trip.deliveredQuantityKg / trip.loadedQuantityKg) * 100
      )
      const remainingPercent = Math.round(
        (trip.remainingQuantityKg / trip.loadedQuantityKg) * 100
      )
      const unaccountedKg = Math.max(
        trip.loadedQuantityKg -
          trip.deliveredQuantityKg -
          trip.remainingQuantityKg,
        0
      )

      return {
        ...trip,
        truck,
        originSite,
        destinationSite,
        stops,
        telemetry,
        events,
        latestTelemetry,
        nextStop,
        deliveredPercent,
        remainingPercent,
        lpgDropPercent: Math.max(
          firstTelemetry.lpgLevelPercent - latestTelemetry.lpgLevelPercent,
          0
        ),
        pressureDeltaBar: Number(
          Math.max(
            firstTelemetry.pressureBar - latestTelemetry.pressureBar,
            0
          ).toFixed(1)
        ),
        unaccountedKg,
        attentionLevel: getHighestSeverity(events),
      }
    })
    .sort((left, right) => {
      const statusOrder =
        statusSortOrder[left.status] - statusSortOrder[right.status]

      if (statusOrder !== 0) return statusOrder

      return (
        new Date(right.lastUpdatedAt).getTime() -
        new Date(left.lastUpdatedAt).getTime()
      )
    })
}

export function buildRouteSummary(
  trips: readonly RouteTripView[]
): RouteSummary {
  const completedAndActiveTrips = trips.filter(
    (trip) => trip.status !== 'planned'
  )
  const onTimeTrips = completedAndActiveTrips.filter((trip) => trip.onTime)

  return {
    totalTrips: trips.length,
    activeTrips: trips.filter((trip) =>
      ['in-progress', 'incident'].includes(trip.status)
    ).length,
    plannedTrips: trips.filter((trip) => trip.status === 'planned').length,
    completedTrips: trips.filter((trip) => trip.status === 'completed').length,
    incidentTrips: trips.filter((trip) => trip.status === 'incident').length,
    activeVolumeKg: trips
      .filter((trip) => ['in-progress', 'incident'].includes(trip.status))
      .reduce((total, trip) => total + trip.loadedQuantityKg, 0),
    deliveredVolumeKg: trips.reduce(
      (total, trip) => total + trip.deliveredQuantityKg,
      0
    ),
    onTimeRate:
      completedAndActiveTrips.length === 0
        ? 0
        : Math.round(
            (onTimeTrips.length / completedAndActiveTrips.length) * 100
          ),
    attentionCount: trips.filter((trip) => trip.attentionLevel !== 'low')
      .length,
  }
}

export function getRouteCustomerOptions(trips: readonly RouteTripView[]) {
  return Array.from(new Set(trips.map((trip) => trip.customerName))).map(
    (customerName) => ({
      label: customerName,
      value: customerName,
    })
  )
}
