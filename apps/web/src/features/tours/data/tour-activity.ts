import {
  anomalies,
  checkpoints,
  client_sites,
  curated,
  delivery_tours,
  drivers,
  organizations,
  scan_events,
  users,
  vehicles,
} from '@lpg/mock-data'
import type {
  Anomaly,
  Checkpoint,
  DeliveryTour,
  ExecutionMode,
  Setting,
  TourneeStatus,
  TourneeType,
} from '@lpg/types'
import { sites, type Site } from '@/features/sites/data/sites'
import { trucks, type Truck } from '@/features/trucks/data/trucks'
import { resolveSlaThresholds, tourSlaFlags } from './tour-machine'
import type { UserScope } from '@/features/scope/scope'
import { scopeBySiteOrCreator, scopeWithOrgId } from '@/features/scope/site-creator'
import { useToursStore } from '@/store/tours-store'

export type { ExecutionMode, TourneeStatus }

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
  loadedQuantity: number
  deliveredQuantity: number
  remainingQuantity: number
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
  deliveredQuantity?: number
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
  estimatedVolume: number
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
  unaccounted: number
  attentionLevel: RouteEventSeverity
}

export type RouteSummary = {
  totalTrips: number
  activeTrips: number
  plannedTrips: number
  completedTrips: number
  incidentTrips: number
  activeVolume: number
  deliveredVolume: number
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

const siteById = new Map(sites.map((site) => [site.id, site]))
const truckById = new Map(trucks.map((truck) => [truck.id, truck]))
const driverById = new Map(drivers.map((driver) => [driver.id, driver]))

function requireSite(siteId: string) {
  const site = siteById.get(siteId)

  if (!site) {
    throw new Error(`Unknown site "${siteId}"`)
  }

  return site
}

function placeholderSite(): Site {
  return {
    id: '',
    name: '—',
    type: 'depot' as Site['type'],
    allTypes: ['depot'] as Site['allTypes'],
    functions: [],
    city: '',
    region: '',
    operator: '',
    latitude: 0,
    longitude: 0,
    description: '',
    status: 'inactive' as Site['status'],
  }
}

function requireTruck(truckId: string) {
  const truck = truckById.get(truckId)

  if (!truck) {
    throw new Error(`Unknown truck "${truckId}"`)
  }

  return truck
}

export function routeStatusFromTournee(status: TourneeStatus): RouteTripStatus {
  switch (status) {
    case 'CLOSED':
      return 'completed'
    case 'INPROGRESS':
    case 'CHECKPOINTACTIVE':
      return 'in-progress'
    case 'CANCELLED':
      return 'incident'
    default:
      return 'planned'
  }
}

function driverName(driverId: string | null | undefined): string {
  if (!driverId) return '—'
  const driver = driverById.get(driverId)
  if (!driver) return '—'
  return `${driver.first_name} ${driver.last_name}`.trim()
}

export type TourSlice =
  | 'ALL'
  | 'INTERNAL'
  | 'EXTERNAL'
  | 'PENDING'
  | 'ACTIVE'
  | 'HISTORY'

export type TourActivity = RouteTripView & {
  tourneeStatus: TourneeStatus
  tourneeType: TourneeType
  execution_mode: ExecutionMode
  marketeur_name: string
  transporter_name: string | null
  vehicle_plate: string | null
  driver_name: string | null
  livreur_name: string | null
  requested_quantity: number
  loaded_quantity: number | null
  delivered_quantity: number | null
  checkpoint_count: number
  completed_checkpoints: number
  created_at: string
  transport_assigned_at: string | null
  sla_transporter_no_ack: boolean
  sla_unassigned_too_long: boolean
  anomaly_ids: string[]
}

export interface TourEnrichOptions {
  checkpoints?: typeof curated.checkpoints
  anomalies?: Anomaly[]
  settings?: Setting[]
  now?: Date
}

export const tourneeTypeLabels: Record<TourneeType, string> = {
  VRAC: 'Vrac (TM)',
  BOUTEILLES50KG: 'Bouteilles 50 kg',
}

export const tourStatusLabels: Record<TourneeStatus, string> = {
  DRAFT: 'Brouillon',
  PLANNED: 'Planifiée',
  PENDINGTRANSPORTERACK: 'En attente transporteur',
  ACKNOWLEDGED: 'Accusée',
  INPROGRESS: 'En transit',
  CHECKPOINTACTIVE: 'En livraison',
  CLOSED: 'Livrée',
  CANCELLED: 'Annulée',
}

export const executionModeLabels: Record<ExecutionMode, string> = {
  INTERNAL: 'Interne',
  EXTERNAL: 'Externalisée',
}

export const tourStatusOptions: readonly { label: string; value: TourneeStatus }[] = (
  Object.keys(tourStatusLabels) as TourneeStatus[]
).map((value) => ({ label: tourStatusLabels[value], value }))

export const executionModeOptions: readonly { label: string; value: ExecutionMode }[] = (
  Object.keys(executionModeLabels) as ExecutionMode[]
).map((value) => ({ label: executionModeLabels[value], value }))

function orgName(id: string | null | undefined): string | null {
  if (!id) return null
  return organizations.find((o) => o.id === id)?.name ?? id
}

function personName(id: string | null | undefined): string | null {
  if (!id) return null
  const user = users.find((u) => u.id === id)
  if (user) return `${user.first_name} ${user.last_name}`.trim()
  const driver = drivers.find((d) => d.id === id)
  if (driver) return `${driver.first_name} ${driver.last_name}`.trim()
  return id
}

function vehiclePlate(id: string | null | undefined): string | null {
  if (!id) return null
  return vehicles.find((v) => v.id === id)?.license_plate ?? id
}

function siteName(id: string | null | undefined): string | null {
  if (!id) return null
  return [...sites, ...client_sites].find((s) => s.id === id)?.name ?? id
}

function tourReference(index: number): string {
  return `TRP-${2401 + index}`
}

function windowLabel(dateIso: string | null | undefined): string {
  if (!dateIso) return 'Fenêtre non définie'
  const date = new Date(dateIso)
  const from = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const to = new Date(date.getTime() + 20 * 60 * 1000)
  const toLabel = to.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${from} - ${toLabel}`
}

function stopNote(checkpoint: Checkpoint): string {
  switch (checkpoint.status) {
    case 'COMPLETED':
      return 'Point validé et documents confirmés.'
    case 'REACHED':
      return 'Livreur arrivé sur site, en cours de chargement ou de déchargement.'
    case 'SKIPPED':
      return 'Point sauté — motif saisi par le livreur.'
    default:
      return 'Point planifié, en attente de passage.'
  }
}

function stopTitle(role: RouteStopRole, checkpoint: Checkpoint): string {
  const base = role === 'loading' ? 'Chargement' : role === 'delivery' ? 'Livraison finale' : 'Contrôle intermédiaire'
  const label = checkpoint.status === 'COMPLETED' ? 'confirmé' : checkpoint.status === 'REACHED' ? 'arrivé' : 'planifié'
  return `${base} ${label}`
}

function buildStops(
  tourCheckpoints: Checkpoint[],
  tour: DeliveryTour,
): RouteTripStop[] {
  return tourCheckpoints.map((checkpoint, index) => {
    const isFirst = index === 0
    const isLast = index === tourCheckpoints.length - 1
    const role: RouteStopRole = isFirst
      ? 'loading'
      : isLast
        ? 'delivery'
        : 'checkpoint'
    const completed = checkpoint.status !== 'PENDING'

    return {
      id: checkpoint.id,
      siteId: stopFromId(checkpoint),
      role,
      title: stopTitle(role, checkpoint),
      completed,
      windowLabel: windowLabel(checkpoint.expected_arrival),
      deliveredQuantity: isLast ? (tour.delivered_quantity ?? 0) : undefined,
      note: stopNote(checkpoint),
    }
  })
}

function stopFromId(checkpoint: Checkpoint): string {
  return checkpoint.site_id ?? checkpoint.client_site_id ?? ''
}

function buildTelemetry(
  tourId: string,
  tour: DeliveryTour,
  tourCheckpoints: Checkpoint[],
  origin: Site,
  destination: Site,
): RouteTelemetryPoint[] {
  const scans = scan_events.filter((scan) =>
    tourCheckpoints.some(
      (checkpoint) => checkpoint.id === scan.checkpoint_id,
    ),
  )

  if (scans.length > 0) {
    return scans.map((scan, index) => {
      const [lng, lat] = scan.geo_point ?? [0, 0]
      const total = scans.length
      const loaded = tour.loaded_quantity ?? tour.requested_quantity ?? 0
      const delivered = tour.delivered_quantity ?? 0
      const level = Math.max(
        Math.round(100 - (delivered / (loaded || 1)) * (index / (total - 1)) * 100),
        0,
      )

      return {
        id: `tel-${scan.id}`,
        routeTripId: tourId,
        recordedAt: scan.timestamp,
        latitude: Number(lat ?? 0),
        longitude: Number(lng ?? 0),
        lpgLevelPercent: level,
        pressureBar: round1(12.4 - (100 - level) * 0.03),
        estimatedVolume: Math.round((loaded * level) / 100),
      }
    })
  }

  const loaded = tour.loaded_quantity ?? tour.requested_quantity ?? 0
  const points = 3
  const legLat = (destination.latitude - origin.latitude) / (points - 1)
  const legLng = (destination.longitude - origin.longitude) / (points - 1)

  return Array.from({ length: points }, (_, index) => {
    const level =
      tour.status === 'CLOSED'
        ? index === points - 1
          ? 1
          : 100 - index * 33
        : 100
    return {
      id: `tel-${tourId}-${index}`,
      routeTripId: tourId,
      recordedAt:
        tour.started_at ??
        new Date(
          new Date(tour.created_at ?? Date.now()).getTime() + index * 3600_000,
        ).toISOString(),
      latitude: origin.latitude + legLat * index,
      longitude: origin.longitude + legLng * index,
      lpgLevelPercent: level,
      pressureBar: round1(12.4 - (100 - level) * 0.03),
      estimatedVolume: Math.round((loaded * level) / 100),
    }
  })
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function fallbackTruckId(marketeurOrgId: string | null | undefined, tourType: string): string {
  const candidates = vehicles.filter(
    (v) => v.org_id === marketeurOrgId && v.type === tourType && v.is_active,
  )
  if (candidates.length > 0) return candidates[0]!.id
  const any = vehicles.find((v) => v.type === tourType && v.is_active)
  return any?.id ?? trucks[0]?.id ?? ''
}

function buildEvents(
  tourId: string,
  tour: DeliveryTour,
  tourCheckpoints: Checkpoint[],
  status: RouteTripStatus,
): RouteEvent[] {
  const seeded = anomalies.filter(
    (anomaly) =>
      anomaly.entity_type === 'TOURNEE' && anomaly.entity_id === tourId,
  )

  const mapped = seeded.map((anomaly) =>
    anomalyToEvent(tourId, anomaly),
  )

  if (mapped.length > 0) return mapped

  if (status === 'completed') {
    return [
      {
        id: `${tourId}-event-final`,
        routeTripId: tourId,
        occurredAt: tour.closed_at ?? tour.updated_at ?? '',
        severity: 'low',
        title: 'Livraison signée',
        description:
          'Le bon de livraison est signé et le retour dépôt peut être engagé.',
      },
    ]
  }

  if (status === 'in-progress') {
    return tourCheckpoints.map((checkpoint, index) => ({
      id: `${tourId}-event-${index}`,
      routeTripId: tourId,
      occurredAt: checkpoint.actual_arrival ?? checkpoint.expected_arrival ?? '',
      severity: (index === 0 ? 'low' : 'medium') as RouteEventSeverity,
      title:
        index === 0
          ? 'Chargement confirmé'
          : `Point de contrôle ${index + 1} atteint`,
      description:
        index === 0
          ? 'Le chargement initial est validé et le convoyeur est sur la route.'
          : 'En provenance du point précédent, progression nominale.',
    }))
  }

  return [
    {
      id: `${tourId}-event-order`,
      routeTripId: tourId,
      occurredAt: tour.updated_at ?? tour.created_at ?? '',
      severity: 'low',
      title: 'Ordre de mission confirmé',
      description:
        'La tournee est planifiée et prête à être affectée à un véhicule.',
    },
  ]
}

function mapToEventSeverity(anomaly: Anomaly): RouteEventSeverity {
  switch (anomaly.severity) {
    case 'FAIBLE':
      return 'low'
    case 'MODERE':
      return 'medium'
    case 'ELEVE':
    case 'CRITIQUE':
    case 'CRITIQUEEXTREME':
      return 'high'
    default:
      return 'low'
  }
}

function anomalyToEvent(tourId: string, anomaly: Anomaly): RouteEvent {
  const labels: Record<string, string> = {
    DEVIATIONROUTE: 'Déviation de route',
    CHECKPOINTMISSED: 'Point de contrôle manqué',
    SCANOUTOFSEQUENCE: 'Scan hors séquence',
    TOURNEEUNASSIGNEDTOOLONG: 'Tournée non affectée',
    TRANSPORTERNOACK: 'Transporteur sans confirmation',
  }
  return {
    id: anomaly.id,
    routeTripId: tourId,
    occurredAt: anomaly.created_at ?? '',
    severity: mapToEventSeverity(anomaly),
    title: labels[anomaly.type] ?? anomaly.type,
    description:
      anomaly.resolution_notes ??
      `Anomalie ${anomaly.category ?? anomaly.type} signalée pour cette tournée.`,
  }
}

function haversineKm(
  origin: Pick<Site, 'latitude' | 'longitude'>,
  destination: Pick<Site, 'latitude' | 'longitude'>,
): number {
  const earthRadiusKm = 6371
  const toRad = (degree: number) => (degree * Math.PI) / 180
  const dLat = toRad(destination.latitude - origin.latitude)
  const dLng = toRad(destination.longitude - origin.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.latitude)) *
      Math.cos(toRad(destination.latitude)) *
      Math.sin(dLng / 2) ** 2
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function getHighestSeverity(events: readonly RouteEvent[]): RouteEventSeverity {
  if (events.some((event) => event.severity === 'high')) return 'high'
  if (events.some((event) => event.severity === 'medium')) return 'medium'
  return 'low'
}

function buildView(tour: DeliveryTour, index: number, checkpointsSource?: typeof checkpoints): TourActivity {
  const tourCheckpoints = (checkpointsSource ?? checkpoints).filter(
    (checkpoint) => checkpoint.tournee_id === tour.id,
  )
  const stops = buildStops(tourCheckpoints, tour)
  const originSiteId = stops[0]?.siteId ?? ''
  const destinationSiteId = stops[stops.length - 1]?.siteId ?? ''
  const originSite = originSiteId ? requireSite(originSiteId) : placeholderSite()
  const destinationSite = destinationSiteId
    ? requireSite(destinationSiteId)
    : placeholderSite()
  const status = routeStatusFromTournee(tour.status)
  const loaded = tour.loaded_quantity ?? tour.requested_quantity ?? 0
  const delivered = tour.delivered_quantity ?? (status === 'completed' ? loaded : 0)
  const remaining = Math.max(loaded - delivered, 0)
  const truckId = tour.vehicle_id ?? fallbackTruckId(tour.marketeur_org_id, tour.type)
  const truck = requireTruck(truckId)
  const expectedArrivalAt =
    stops[stops.length - 1]?.windowLabel ??
    tour.closed_at ??
    tour.updated_at ??
    ''

  const telemetry = buildTelemetry(tour.id, tour, tourCheckpoints, originSite, destinationSite)
  const latestTelemetry = telemetry[telemetry.length - 1] ?? {
    id: `${tour.id}-fallback`,
    routeTripId: tour.id,
    recordedAt: tour.updated_at ?? '',
    latitude: truck.lat,
    longitude: truck.lng,
    lpgLevelPercent: Math.round((remaining / (loaded || 1)) * 100),
    pressureBar: 0,
    estimatedVolume: remaining,
  }
  const firstTelemetry = telemetry[0] ?? latestTelemetry
  const events = buildEvents(tour.id, tour, tourCheckpoints, status)
  const deliveredPercent = Math.round((delivered / (loaded || 1)) * 100)
  const remainingPercent = Math.round((remaining / (loaded || 1)) * 100)
  const unaccounted = Math.max(loaded - delivered - remaining, 0)

  const stopViews = stops.map((stop) => ({ ...stop, site: requireSite(stop.siteId) }))
  const nextStop = stopViews.find((stop) => !stop.completed) ?? stopViews[stopViews.length - 1]!

  return {
    id: tour.id,
    reference: tourReference(index),
    truckId,
    customerName: destinationSite.name,
    missionLead: driverName(tour.driver_id),
    originSiteId,
    destinationSiteId,
    startedAt: tour.started_at ?? tour.created_at ?? '',
    expectedArrivalAt,
    lastUpdatedAt: tour.updated_at ?? '',
    loadedQuantity: loaded,
    deliveredQuantity: delivered,
    remainingQuantity: remaining,
    progressPercent:
      status === 'completed'
        ? 100
        : status === 'planned'
          ? 0
          : deliveredPercent,
    routeDistanceKm: haversineKm(originSite, destinationSite),
    onTime: isOnTime(tourCheckpoints),
    status,
    truck,
    originSite,
    destinationSite,
    stops: stopViews,
    telemetry,
    events,
    latestTelemetry,
    nextStop,
    deliveredPercent,
    remainingPercent,
    lpgDropPercent: Math.max(
      firstTelemetry.lpgLevelPercent - latestTelemetry.lpgLevelPercent,
      0,
    ),
    pressureDeltaBar: Number(
      Math.max(firstTelemetry.pressureBar - latestTelemetry.pressureBar, 0).toFixed(1),
    ),
    unaccounted,
    attentionLevel: getHighestSeverity(events),
    tourneeStatus: tour.status,
    tourneeType: tour.type,
    execution_mode: tour.execution_mode,
    marketeur_name: orgName(tour.marketeur_org_id) ?? '—',
    transporter_name: orgName(tour.transporter_org_id),
    vehicle_plate: vehiclePlate(tour.vehicle_id),
    driver_name: personName(tour.driver_id),
    livreur_name: personName(tour.livreur_user_id),
    requested_quantity: tour.requested_quantity,
    loaded_quantity: tour.loaded_quantity ?? null,
    delivered_quantity: tour.delivered_quantity ?? null,
    checkpoint_count: tourCheckpoints.length,
    completed_checkpoints: tourCheckpoints.filter((cp) => cp.status === 'COMPLETED').length,
    created_at: tour.created_at ?? '',
    transport_assigned_at: tour.transporter_assigned_at ?? null,
    sla_transporter_no_ack: tourSlaFlags(tour, resolveSlaThresholds(curated.settings)).transporterNoAck,
    sla_unassigned_too_long: tourSlaFlags(tour, resolveSlaThresholds(curated.settings)).unassignedTooLong,
    anomaly_ids: curated.anomalies
      .filter(
        (a) =>
          a.entity_type === 'TOURNEE' &&
          a.entity_id === tour.id &&
          (['TRANSPORTERNOACK', 'TOURNEEUNASSIGNEDTOOLONG'] as readonly string[]).includes(a.type),
      )
      .map((a) => a.id),
  }
}

function isOnTime(checkpoints: Checkpoint[]): boolean {
  const reached = checkpoints.filter(
    (checkpoint) => checkpoint.actual_arrival != null,
  )
  if (reached.length === 0) return true
  return reached.every(
    (checkpoint) =>
      new Date(checkpoint.actual_arrival!) <= new Date(checkpoint.expected_arrival!),
  )
}

function slicePredicate(slice: TourSlice): (tour: DeliveryTour) => boolean {
  switch (slice) {
    case 'INTERNAL':
      return (tour) => tour.execution_mode === 'INTERNAL'
    case 'EXTERNAL':
      return (tour) => tour.execution_mode === 'EXTERNAL'
    case 'PENDING':
      return (tour) => tour.status === 'PENDINGTRANSPORTERACK'
    case 'ACTIVE':
      return (tour) => tour.status === 'INPROGRESS' || tour.status === 'CHECKPOINTACTIVE'
    case 'HISTORY':
      return (tour) => tour.status === 'CLOSED' || tour.status === 'CANCELLED'
    default:
      return () => true
  }
}

/**
 * Tour list for a slice, scoped to the user. The single source of truth is the
 * tours store (seeded from the curated fixtures + every create/action the user
 * performs), so tours created or updated in the session are visible here. The
 * store's checkpoints are used to enrich stops so a freshly created tour shows
 * its planned route.
 */
export function getTourActivity(slice: TourSlice = 'ALL', scope?: UserScope): TourActivity[] {
  const { tours, checkpoints: storeCheckpoints } = useToursStore.getState()
  const sliced = tours.filter(slicePredicate(slice))
  if (!scope) return sliced.map((tour, index) => buildView(tour, index, storeCheckpoints))
  const siteKey =
    scope.view === 'transporter'
      ? (tour: DeliveryTour) => tour.transporter_org_id ?? undefined
      : (tour: DeliveryTour) => tour.marketeur_org_id
  return scopeBySiteOrCreator(
    sliced,
    scopeWithOrgId(scope),
    siteKey,
    (tour) => tour.created_by ?? undefined,
  ).map((tour, index) => buildView(tour, index, storeCheckpoints))
}

export function getTourActivityById(id: string, scope?: UserScope): TourActivity | undefined {
  const { tours, checkpoints: storeCheckpoints } = useToursStore.getState()
  const index = tours.findIndex((tour) => tour.id === id)
  if (index === -1) return undefined
  const tour = tours[index]!
  if (scope && scope.view !== 'org') {
    const siteKey =
      scope.view === 'transporter'
        ? (t: DeliveryTour) => t.transporter_org_id ?? undefined
        : (t: DeliveryTour) => t.marketeur_org_id
    const visible = scopeBySiteOrCreator(
      [tour],
      scopeWithOrgId(scope),
      siteKey,
      (t) => t.created_by ?? undefined,
    )
    if (visible.length === 0) return undefined
  }
  return buildView(tour, index, storeCheckpoints)
}

export function toTourActivities(
  tours: readonly DeliveryTour[],
  opts: TourEnrichOptions = {},
): TourActivity[] {
  return tours.map((tour, index) => buildView(tour, index, opts.checkpoints))
}

export function buildTourActivity(
  tour: DeliveryTour,
  index: number,
  opts: TourEnrichOptions = {},
): TourActivity {
  return buildView(tour, index, opts.checkpoints)
}

export const getRouteTripsView = getTourActivity
export const buildTourSummary = buildRouteSummary
export const getTourCustomerOptions = getRouteCustomerOptions

export function getTourStops(id: string): string[] {
  const tour = delivery_tours.find((t) => t.id === id)
  if (!tour) return []
  return checkpoints
    .filter((cp) => cp.tournee_id === tour.id)
    .sort((a, b) => a.sequence - b.sequence)
    .map((cp) => siteName(cp.site_id ?? cp.client_site_id))
    .filter((name): name is string => Boolean(name))
}

export function getTourProgress(activity: TourActivity): number {
  if (activity.checkpoint_count === 0)
    return activity.tourneeStatus === 'CLOSED' ? 100 : 0
  return Math.round(
    (activity.completed_checkpoints / activity.checkpoint_count) * 100,
  )
}

export function getTourEta(activity: TourActivity): string {
  if (!activity.startedAt) return '—'
  const eta = new Date(new Date(activity.startedAt).getTime() + 4 * 3600_000)
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(eta)
}

export function getTourCargo(activity: TourActivity): string {
  return activity.tourneeType === 'VRAC' ? 'GPL vrac' : 'Bouteilles 50 kg'
}

export function getTourVolume(activity: TourActivity): string {
  return `${activity.requested_quantity} ${activity.tourneeType === 'VRAC' ? 'TM' : 'btl'}`
}

export function isActiveTourStatus(status: TourneeStatus): boolean {
  return status === 'INPROGRESS' || status === 'CHECKPOINTACTIVE'
}

export function buildRouteSummary(
  trips: readonly RouteTripView[],
): RouteSummary {
  const completedAndActiveTrips = trips.filter(
    (trip) => trip.status !== 'planned',
  )
  const onTimeTrips = completedAndActiveTrips.filter((trip) => trip.onTime)

  return {
    totalTrips: trips.length,
    activeTrips: trips.filter((trip) =>
      ['in-progress', 'incident'].includes(trip.status),
    ).length,
    plannedTrips: trips.filter((trip) => trip.status === 'planned').length,
    completedTrips: trips.filter((trip) => trip.status === 'completed').length,
    incidentTrips: trips.filter((trip) => trip.status === 'incident').length,
    activeVolume: trips
      .filter((trip) => ['in-progress', 'incident'].includes(trip.status))
      .reduce((total, trip) => total + trip.loadedQuantity, 0),
    deliveredVolume: trips.reduce(
      (total, trip) => total + trip.deliveredQuantity,
      0,
    ),
    onTimeRate:
      completedAndActiveTrips.length === 0
        ? 0
        : Math.round(
            (onTimeTrips.length / completedAndActiveTrips.length) * 100,
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

export type RouteLpgVariationStageId = 'loading' | 'live' | 'projected'

export type RouteLpgVariationStageTone = 'emerald' | 'sky' | 'amber'

export type RouteLpgVariationStage = {
  id: RouteLpgVariationStageId
  label: string
  quantity: number
  percent: number
  delta: number
  deltaPercent: number
  tone: RouteLpgVariationStageTone
}

export type RouteLpgVariation = {
  stages: RouteLpgVariationStage[]
  delivered: number
  deliveredPercent: number
  nextDrop: number
  telemetryGap: number
}

export function buildRouteLpgVariation(
  trip: RouteTripView
): RouteLpgVariation {
  const loading = trip.loadedQuantity
  const live = trip.latestTelemetry.estimatedVolume
  const nextDrop =
    trip.status === 'completed' ? 0 : (trip.nextStop.deliveredQuantity ?? 0)
  const projected =
    trip.status === 'completed' ? live : Math.max(live - nextDrop, 0)

  return {
    stages: [
      {
        id: 'loading',
        label: 'Au chargement',
        quantity: loading,
        percent: 100,
        delta: 0,
        deltaPercent: 0,
        tone: 'emerald',
      },
      {
        id: 'live',
        label: 'Dernier releve',
        quantity: live,
        percent: toPercent(live, loading),
        delta: live - loading,
        deltaPercent: toPercent(live, loading) - 100,
        tone: 'sky',
      },
      {
        id: 'projected',
        label:
          trip.status === 'completed'
            ? 'Niveau final'
            : 'Apres prochaine livraison',
        quantity: projected,
        percent: toPercent(projected, loading),
        delta: projected - live,
        deltaPercent:
          toPercent(projected, loading) - toPercent(live, loading),
        tone: 'amber',
      },
    ],
    delivered: trip.deliveredQuantity,
    deliveredPercent: trip.deliveredPercent,
    nextDrop,
    telemetryGap: Math.abs(live - trip.remainingQuantity),
  }
}

function toPercent(quantity: number, loadedQuantity: number) {
  if (loadedQuantity <= 0) return 0

  return Math.max(Math.round((quantity / loadedQuantity) * 100), 0)
}

export const buildTourLpgVariation = buildRouteLpgVariation
