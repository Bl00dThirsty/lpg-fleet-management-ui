import type {
  Site as OperationalSite,
  Anomaly,
  Checkpoint,
  CheckpointStatus,
  ClientSite,
  DeliveryTour,
  ExecutionMode,
  Organization,
  ScanEvent,
  Setting,
  TourneeStatus,
  TourneeType,
  Vehicle,
} from '@lpg/types'
import {
  sites,
  type Site,
  getSites,
  cityFromAddress,
} from '@/features/sites/data/sites'
import { curated } from '@lpg/mock-data'
import { trucks, type Truck } from '@/features/trucks/data/trucks'
import {
  anomalies as defaultAnomalies,
  checkpoints as defaultCheckpoints,
  client_sites as defaultClientSites,
  delivery_tours as defaultDeliveryTours,
  drivers as defaultDrivers,
  organizations as defaultOrganizations,
  scan_events as defaultScanEvents,
  settings as defaultSettings,
  users as defaultUsers,
  vehicles as defaultVehicles,
} from '@/lib/entity-data'
import { resolveSlaThresholds, tourSlaFlags } from './tour-machine'
import { useUsersStore } from '@/store/users-store'
import { useToursStore } from '@/store/tours-store'
import type { UserScope } from '@/features/scope/scope'

export type { CheckpointStatus }

// Live lookups: every helper below resolves its rows from explicit parameters
// that default to the `@/lib/entity-data` collections (empty until hydrated).
// Callers holding fresher rows (e.g. the tours store after fetchCheckpoints)
// pass them in via TourEnrichOptions — no module-scope shadow collections.

/** Minimal person shape shared by users and drivers lookups. */
export type TourPerson = {
  id: string
  first_name?: string | null
  last_name?: string | null
}

export type { ExecutionMode, TourneeStatus }

export type RouteTripStatus =
  'planned' | 'in-progress' | 'completed' | 'incident'

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
  expectedQuantity?: number
  note: string
  /** Server checkpoint status backing this stop (absent for hand-built rows). */
  checkpointStatus?: CheckpointStatus
  clientName?: string
  pointName?: string
  city?: string
  address?: string
  contactName?: string
  contactPhone?: string
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
  /** First non-terminal stop, or the last stop, or null when no stops exist. */
  nextStop: RouteTripViewStop | null
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

function clientSiteToSite(cs: ClientSite): Site {
  return {
    id: cs.id,
    name: cs.name,
    type: 'delivery-point' as const,
    city: cityFromAddress(cs.address),
    region: cs.region,
    operator: 'Client Distributeur',
    latitude: Array.isArray(cs.geo_point) ? (cs.geo_point[0] ?? 4.05) : 4.05,
    longitude: Array.isArray(cs.geo_point) ? (cs.geo_point[1] ?? 9.76) : 9.76,
    description: cs.address || '',
    status: 'active' as const,
  }
}

function buildSiteIndex(
  siteRows: Site[] = sites,
  clientSiteRows: ClientSite[] = defaultClientSites
): Map<string, Site> {
  const index = new Map<string, Site>()
  const effectiveSites =
    siteRows && siteRows.length > 0
      ? siteRows
      : getSites(curated.sites as OperationalSite[])
  const effectiveClientSites =
    clientSiteRows && clientSiteRows.length > 0
      ? clientSiteRows
      : (curated.client_sites as ClientSite[])
  for (const site of effectiveSites) index.set(site.id, site)
  for (const cs of effectiveClientSites) {
    if (!index.has(cs.id)) index.set(cs.id, clientSiteToSite(cs))
  }
  return index
}

// `trucks` lives behind an import cycle: this module <- tours-store, and
// trucks/data/trucks imports tours-store back. Building the index at module scope
// reads `trucks` while it is still uninitialised, which is `undefined` outside a
// browser bundle and crashes the map suites on import. Build it on first use.
let truckIndex: Map<string, Truck> | null = null
function truckById(): Map<string, Truck> {
  truckIndex ??= new Map(trucks.map((truck) => [truck.id, truck]))
  return truckIndex
}

function requireSite(siteId: string, index: Map<string, Site>): Site {
  if (!siteId) return placeholderSite()
  const site = index.get(siteId)
  if (site) return site
  const directCs = (curated.client_sites as ClientSite[]).find(
    (c) => c.id === siteId
  )
  if (directCs) return clientSiteToSite(directCs)
  const directOp = (curated.sites as OperationalSite[]).find(
    (s) => s.id === siteId
  )
  if (directOp) return getSites([directOp])[0]!
  return {
    id: siteId,
    name: 'Point de livraison',
    type: 'delivery-point',
    city: 'Cameroun',
    region: 'LITTORAL',
    operator: 'Client',
    latitude: 4.0511,
    longitude: 9.7679,
    description: '',
    status: 'active',
  }
}

function placeholderSite(): Site {
  return {
    id: '',
    name: '—',
    type: 'depot',
    city: '',
    region: '',
    operator: '',
    latitude: 0,
    longitude: 0,
    description: '',
    status: 'inactive',
  }
}

function requireTruck(truckId: string): Truck {
  if (!truckId) return trucks[0]!
  const truck = truckById().get(truckId)
  if (truck) return truck
  return (
    trucks[0] ?? {
      id: truckId,
      license_plate: 'LT-0000-XX',
      tenant_name: 'SCTM Interne',
      org_id: 'org-0002-sctm-0000-000000000001',
      region: 'LITTORAL' as const,
      type: 'VRAC' as const,
      tournee_status: 'INPROGRESS' as const,
      requested_quantity: 20,
      lat: 4.0511,
      lng: 9.7679,
      risk_level: 'FAIBLE' as const,
    }
  )
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

function driverName(
  driverId: string | null | undefined,
  drivers: TourPerson[] = defaultDrivers
): string {
  if (!driverId) return '—'
  const live = useUsersStore.getState().users.find((u) => u.id === driverId)
  if (live)
    return `${live.first_name ?? ''} ${live.last_name ?? ''}`.trim() || '—'
  const driver = drivers.find((d) => d.id === driverId)
  if (!driver) return '—'
  return `${driver.first_name ?? ''} ${driver.last_name ?? ''}`.trim() || '—'
}

export type TourSlice =
  'ALL' | 'INTERNAL' | 'EXTERNAL' | 'PENDING' | 'ACTIVE' | 'HISTORY'

export type TourActivity = RouteTripView & {
  mission_kind?: DeliveryTour['mission_kind']
  scheduled_at?: string | null
  pickup_status?: DeliveryTour['pickup_status']
  has_loading_proof?: boolean
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
  sites?: Site[]
  checkpoints?: Checkpoint[]
  anomalies?: Anomaly[]
  settings?: Setting[]
  organizations?: Organization[]
  vehicles?: Vehicle[]
  clientSites?: ClientSite[]
  drivers?: TourPerson[]
  scanEvents?: ScanEvent[]
  users?: TourPerson[]
  now?: Date
  scope?: UserScope
}

export const checkpointStatusLabels: Record<CheckpointStatus, string> = {
  PENDING: 'En attente',
  REACHED: 'Arrivé',
  COMPLETED: 'Terminé',
  SKIPPED: 'Sauté',
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

export const tourStatusOptions: readonly {
  label: string
  value: TourneeStatus
}[] = (Object.keys(tourStatusLabels) as TourneeStatus[]).map((value) => ({
  label: tourStatusLabels[value],
  value,
}))

export const executionModeOptions: readonly {
  label: string
  value: ExecutionMode
}[] = (Object.keys(executionModeLabels) as ExecutionMode[]).map((value) => ({
  label: executionModeLabels[value],
  value,
}))

function orgName(
  id: string | null | undefined,
  orgs: Organization[] = defaultOrganizations
): string | null {
  if (!id) return null
  return orgs.find((o) => o.id === id)?.name ?? id
}

function personName(
  id: string | null | undefined,
  users: TourPerson[] = defaultUsers,
  drivers: TourPerson[] = defaultDrivers
): string | null {
  if (!id) return null
  // Live users are fetched into users-store; this lookup is the production path.
  const live = useUsersStore.getState().users.find((u) => u.id === id)
  if (live)
    return `${live.first_name ?? ''} ${live.last_name ?? ''}`.trim() || id
  const user = users.find((u) => u.id === id)
  if (user)
    return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || id
  const driver = drivers.find((d) => d.id === id)
  if (driver)
    return `${driver.first_name ?? ''} ${driver.last_name ?? ''}`.trim() || id
  return id
}

function vehiclePlate(
  id: string | null | undefined,
  rows: Vehicle[] = defaultVehicles
): string | null {
  if (!id) return null
  return rows.find((v) => v.id === id)?.license_plate ?? id
}

function siteName(
  id: string | null | undefined,
  siteRows: Site[] = sites,
  clientSiteRows: ClientSite[] = defaultClientSites
): string | null {
  if (!id) return null
  return (
    siteRows.find((s) => s.id === id)?.name ??
    clientSiteRows.find((s) => s.id === id)?.name ??
    id
  )
}

function tourReference(tour: DeliveryTour, index: number = 0): string {
  if (tour.tour_code && tour.tour_code.trim()) return tour.tour_code.trim()
  return `TRP-${2401 + index}`
}

function windowLabel(dateIso: string | null | undefined): string {
  if (!dateIso) return 'Fenêtre non définie'
  const date = new Date(dateIso)
  const from = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const to = new Date(date.getTime() + 20 * 60 * 1000)
  const toLabel = to.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
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

function buildStops(
  tourCheckpoints: Checkpoint[],
  tour: DeliveryTour,
  siteIndex?: Map<string, Site>,
  clientSites: ClientSite[] = defaultClientSites.length > 0
    ? defaultClientSites
    : (curated.client_sites as ClientSite[]),
  orgs: Organization[] = defaultOrganizations.length > 0
    ? defaultOrganizations
    : (curated.organizations as Organization[])
): RouteTripStop[] {
  return tourCheckpoints.map((checkpoint, index) => {
    const isFirst = index === 0
    const isLast = index === tourCheckpoints.length - 1
    const role: RouteStopRole = isFirst
      ? 'loading'
      : isLast
        ? 'delivery'
        : 'checkpoint'
    const completed =
      checkpoint.status === 'COMPLETED' || checkpoint.status === 'SKIPPED'
    const siteId = stopFromId(checkpoint)
    const clientSite = clientSites.find(
      (cs) => cs.id === checkpoint.client_site_id || cs.id === siteId
    )
    const site = siteIndex?.get(siteId)

    // Resolve client organization name
    let clientName: string | undefined = undefined
    if (clientSite) {
      const clientOrg = orgs.find((o) => o.id === clientSite.client_org_id)
      clientName =
        clientOrg?.name ??
        (clientSite.name.includes('—')
          ? clientSite.name.split('—')[0]!.trim()
          : clientSite.name)
    } else if (site) {
      clientName = site.operator
    }

    const pointName =
      clientSite?.name ??
      site?.name ??
      (role === 'loading' ? 'Dépôt principal' : 'Point de livraison')
    const city = clientSite
      ? cityFromAddress(clientSite.address)
      : (site?.city ?? 'Douala')
    const address = clientSite?.address ?? site?.description ?? ''
    const contactName = clientSite?.site_contact_name
    const contactPhone = clientSite?.site_contact_phone

    const expectedQty =
      checkpoint.expected_quantity ??
      (role === 'loading'
        ? (tour.loaded_quantity ?? tour.requested_quantity)
        : (tour.delivered_quantity ??
          tour.loaded_quantity ??
          tour.requested_quantity))
    const deliveredQty =
      checkpoint.delivered_quantity ?? (completed ? expectedQty : undefined)

    let title: string
    if (role === 'loading') {
      title = pointName ? `Chargement — ${pointName}` : 'Chargement au dépôt'
    } else if (role === 'delivery') {
      title = clientName
        ? `Livraison client — ${clientName}`
        : 'Livraison finale'
    } else {
      title = clientName
        ? `Étape de contrôle — ${clientName}`
        : 'Contrôle intermédiaire'
    }

    return {
      id: checkpoint.id,
      siteId,
      role,
      title,
      completed,
      windowLabel: windowLabel(checkpoint.expected_arrival),
      expectedQuantity: expectedQty,
      deliveredQuantity: deliveredQty,
      note: stopNote(checkpoint),
      checkpointStatus: checkpoint.status,
      clientName,
      pointName,
      city,
      address,
      contactName,
      contactPhone,
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
  scans: ScanEvent[] = defaultScanEvents
): RouteTelemetryPoint[] {
  const tourScans = scans.filter((scan) =>
    tourCheckpoints.some((checkpoint) => checkpoint.id === scan.checkpoint_id)
  )

  if (tourScans.length > 0) {
    return tourScans.map((scan, index) => {
      const [lng, lat] = scan.geo_point ?? [0, 0]
      const total = tourScans.length
      const loaded =
        tour.loaded_quantity ??
        (tour.mission_kind === 'PICKUP' ? 0 : tour.requested_quantity) ??
        0
      const delivered = tour.delivered_quantity ?? 0
      const level = Math.max(
        Math.round(
          100 - (delivered / (loaded || 1)) * (index / (total - 1)) * 100
        ),
        0
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

  const loaded =
    tour.loaded_quantity ??
    (tour.mission_kind === 'PICKUP' ? 0 : tour.requested_quantity) ??
    0
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
          new Date(tour.created_at ?? Date.now()).getTime() + index * 3600_000
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

function fallbackTruckId(
  marketeurOrgId: string | null | undefined,
  tourType: string,
  rows: Vehicle[] = defaultVehicles
): string {
  const candidates = rows.filter(
    (v) => v.org_id === marketeurOrgId && v.type === tourType && v.is_active
  )
  if (candidates.length > 0) return candidates[0]!.id
  const any = rows.find((v) => v.type === tourType && v.is_active)
  return any?.id ?? trucks[0]?.id ?? ''
}

function buildEvents(
  tourId: string,
  tour: DeliveryTour,
  tourCheckpoints: Checkpoint[],
  status: RouteTripStatus,
  seeded: Anomaly[] = defaultAnomalies
): RouteEvent[] {
  const tourAnomalies = seeded.filter(
    (anomaly) =>
      anomaly.entity_type === 'TOURNEE' && anomaly.entity_id === tourId
  )

  const mapped = tourAnomalies.map((anomaly) => anomalyToEvent(tourId, anomaly))

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
      occurredAt:
        checkpoint.actual_arrival ?? checkpoint.expected_arrival ?? '',
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
  destination: Pick<Site, 'latitude' | 'longitude'>
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
  return Math.round(
    earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  )
}

function getHighestSeverity(events: readonly RouteEvent[]): RouteEventSeverity {
  if (events.some((event) => event.severity === 'high')) return 'high'
  if (events.some((event) => event.severity === 'medium')) return 'medium'
  return 'low'
}

type TourWireRow = Partial<DeliveryTour> & {
  tourCode?: string
  marketerOrganizationId?: string
  executionMode?: ExecutionMode
  transporterOrganizationId?: string
  vehicleId?: string
  driverId?: string
  livreurUserId?: string
  assignedByTransporterUserId?: string
  transporterAssignedAt?: string
  sentToTransporterAt?: string
  tourneeType?: TourneeType
  tourneeStatus?: TourneeStatus
  requestedQuantity?: number
  loadedQuantity?: number
  deliveredQuantity?: number
  startedAt?: string
  closedAt?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  createdBy?: string
  updatedBy?: string
}
export function normalizeTour(raw: TourWireRow): DeliveryTour {
  if (!raw) {
    return {
      id: `tour-fallback-${Date.now()}`,
      tour_code: `TRP-${Math.floor(1000 + Math.random() * 9000)}`,
      marketeur_org_id: 'org-0002-sctm-0000-000000000001',
      execution_mode: 'INTERNAL',
      transporter_org_id: null,
      vehicle_id: null,
      driver_id: null,
      livreur_user_id: null,
      assigned_by_transporter_user_id: null,
      transporter_assigned_at: null,
      sent_to_transporter_at: null,
      type: 'VRAC',
      status: 'INPROGRESS',
      requested_quantity: 10,
      loaded_quantity: null,
      delivered_quantity: null,
      started_at: null,
      closed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      created_by: 'system',
      updated_by: 'system',
    }
  }

  return {
    mission_kind: raw.mission_kind,
    scheduled_at: raw.scheduled_at,
    pickup_status: raw.pickup_status,
    loading: raw.loading,
    loading_validated: raw.loading_validated,
    id: raw.id ?? `tour-${Math.random()}`,
    tour_code: raw.tour_code ?? raw.tourCode ?? undefined,
    marketeur_org_id:
      raw.marketeur_org_id ??
      raw.marketerOrganizationId ??
      'org-0002-sctm-0000-000000000001',
    execution_mode: raw.execution_mode ?? raw.executionMode ?? 'INTERNAL',
    transporter_org_id:
      raw.transporter_org_id ?? raw.transporterOrganizationId ?? null,
    vehicle_id: raw.vehicle_id ?? raw.vehicleId ?? null,
    driver_id: raw.driver_id ?? raw.driverId ?? null,
    livreur_user_id: raw.livreur_user_id ?? raw.livreurUserId ?? null,
    assigned_by_transporter_user_id:
      raw.assigned_by_transporter_user_id ??
      raw.assignedByTransporterUserId ??
      null,
    transporter_assigned_at:
      raw.transporter_assigned_at ?? raw.transporterAssignedAt ?? null,
    sent_to_transporter_at:
      raw.sent_to_transporter_at ?? raw.sentToTransporterAt ?? null,
    type: raw.type ?? raw.tourneeType ?? 'VRAC',
    status: raw.status ?? raw.tourneeStatus ?? 'INPROGRESS',
    requested_quantity: Number(
      raw.requested_quantity ?? raw.requestedQuantity ?? 10
    ),
    loaded_quantity:
      raw.loaded_quantity != null
        ? Number(raw.loaded_quantity)
        : raw.loadedQuantity != null
          ? Number(raw.loadedQuantity)
          : null,
    delivered_quantity:
      raw.delivered_quantity != null
        ? Number(raw.delivered_quantity)
        : raw.deliveredQuantity != null
          ? Number(raw.deliveredQuantity)
          : null,
    started_at: raw.started_at ?? raw.startedAt ?? null,
    closed_at: raw.closed_at ?? raw.closedAt ?? null,
    created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? raw.updatedAt ?? new Date().toISOString(),
    deleted_at: raw.deleted_at ?? raw.deletedAt ?? null,
    created_by: raw.created_by ?? raw.createdBy ?? 'system',
    updated_by: raw.updated_by ?? raw.updatedBy ?? 'system',
  }
}

function buildView(
  tourRaw: DeliveryTour,
  opts: TourEnrichOptions = {},
  index: number = 0
): TourActivity {
  const tour = normalizeTour(tourRaw)
  const checkpointRows = opts.checkpoints ?? defaultCheckpoints
  const anomalyRows = opts.anomalies ?? defaultAnomalies
  const settingRows = opts.settings ?? defaultSettings
  const orgRows = opts.organizations ?? defaultOrganizations
  const vehicleRows = opts.vehicles ?? defaultVehicles
  const clientSiteRows = opts.clientSites ?? defaultClientSites
  const driverRows = opts.drivers ?? defaultDrivers
  const scanRows = opts.scanEvents ?? defaultScanEvents
  const userRows = opts.users ?? defaultUsers
  const effectiveClientSites =
    clientSiteRows.length > 0
      ? clientSiteRows
      : (curated.client_sites as ClientSite[])
  const effectiveOrgs =
    orgRows.length > 0 ? orgRows : (curated.organizations as Organization[])
  const siteIndex = buildSiteIndex(opts.sites ?? sites, effectiveClientSites)
  const tourCheckpoints = checkpointRows
    .filter(
      (checkpoint) =>
        checkpoint.tournee_id === tour.id || checkpoint.tour_id === tour.id
    )
    .sort((left, right) => left.sequence - right.sequence)
  const stops = buildStops(
    tourCheckpoints,
    tour,
    siteIndex,
    effectiveClientSites,
    effectiveOrgs
  )
  const originSiteId = stops[0]?.siteId ?? ''
  const destinationSiteId =
    stops.length > 0 ? (stops[stops.length - 1]?.siteId ?? '') : ''
  const originSite = originSiteId
    ? requireSite(originSiteId, siteIndex)
    : placeholderSite()
  const destinationSite = destinationSiteId
    ? requireSite(destinationSiteId, siteIndex)
    : placeholderSite()

  const allDone =
    tourCheckpoints.length > 0 &&
    tourCheckpoints.every(
      (cp) => cp.status === 'COMPLETED' || cp.status === 'SKIPPED'
    )

  const effectiveTourneeStatus: TourneeStatus =
    allDone && tour.status !== 'CANCELLED' ? 'CLOSED' : tour.status
  const status = routeStatusFromTournee(effectiveTourneeStatus)
  const loaded =
    tour.loaded_quantity ??
    (tour.mission_kind === 'PICKUP' ? 0 : tour.requested_quantity) ??
    0
  const delivered =
    status === 'completed'
      ? (tour.delivered_quantity ?? loaded)
      : (tour.delivered_quantity ?? 0)
  const remaining = Math.max(loaded - delivered, 0)
  const truckId =
    tour.vehicle_id ??
    fallbackTruckId(tour.marketeur_org_id, tour.type, vehicleRows)
  const truck = requireTruck(truckId)
  const expectedArrivalAt =
    tourCheckpoints[tourCheckpoints.length - 1]?.expected_arrival ??
    tour.closed_at ??
    tour.updated_at ??
    ''

  const telemetry = buildTelemetry(
    tour.id,
    tour,
    tourCheckpoints,
    originSite,
    destinationSite,
    scanRows
  )
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
  const events = buildEvents(
    tour.id,
    tour,
    tourCheckpoints,
    status,
    anomalyRows
  )
  const deliveredPercent = Math.round((delivered / (loaded || 1)) * 100)
  const remainingPercent = Math.round((remaining / (loaded || 1)) * 100)
  const unaccounted = Math.max(loaded - delivered - remaining, 0)

  const stopViews = stops.map((stop) => ({
    ...stop,
    site: requireSite(stop.siteId, siteIndex),
  }))
  const nextStop =
    stopViews.find((stop) => !stop.completed) ??
    (stopViews.length > 0 ? stopViews[stopViews.length - 1] : undefined) ??
    null

  return {
    id: tour.id,
    reference: tourReference(tour, index),
    truckId,
    customerName: destinationSite.name,
    missionLead: driverName(tour.driver_id, driverRows),
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
      0
    ),
    pressureDeltaBar: Number(
      Math.max(
        firstTelemetry.pressureBar - latestTelemetry.pressureBar,
        0
      ).toFixed(1)
    ),
    unaccounted,
    attentionLevel: getHighestSeverity(events),
    mission_kind: tour.mission_kind,
    scheduled_at: tour.scheduled_at,
    pickup_status: tour.pickup_status,
    has_loading_proof: !!tour.loading?.order_image_path,
    tourneeStatus: effectiveTourneeStatus,
    tourneeType: tour.type,
    execution_mode: tour.execution_mode,
    marketeur_name: orgName(tour.marketeur_org_id, orgRows) ?? 'SCTM',
    transporter_name: orgName(tour.transporter_org_id, orgRows),
    vehicle_plate: vehiclePlate(tour.vehicle_id, vehicleRows),
    driver_name: personName(tour.driver_id, userRows, driverRows),
    livreur_name: personName(tour.livreur_user_id, userRows, driverRows),
    requested_quantity: tour.requested_quantity,
    loaded_quantity: tour.loaded_quantity ?? null,
    delivered_quantity:
      status === 'completed'
        ? (tour.delivered_quantity ?? loaded)
        : (tour.delivered_quantity ?? null),
    checkpoint_count: tourCheckpoints.length,
    completed_checkpoints: tourCheckpoints.filter(
      (cp) => cp.status === 'COMPLETED'
    ).length,
    created_at: tour.created_at ?? '',
    transport_assigned_at: tour.transporter_assigned_at ?? null,
    sla_transporter_no_ack: tourSlaFlags(
      tour,
      resolveSlaThresholds(settingRows)
    ).transporterNoAck,
    sla_unassigned_too_long: tourSlaFlags(
      tour,
      resolveSlaThresholds(settingRows)
    ).unassignedTooLong,
    anomaly_ids: anomalyRows
      .filter(
        (a) =>
          a.entity_type === 'TOURNEE' &&
          a.entity_id === tour.id &&
          (
            [
              'TRANSPORTERNOACK',
              'TOURNEEUNASSIGNEDTOOLONG',
            ] as readonly string[]
          ).includes(a.type)
      )
      .map((a) => a.id),
  }
}

function isOnTime(checkpoints: Checkpoint[]): boolean {
  const reached = checkpoints.filter(
    (checkpoint) => checkpoint.actual_arrival != null
  )
  if (reached.length === 0) return true
  return reached.every(
    (checkpoint) =>
      new Date(checkpoint.actual_arrival!) <=
      new Date(checkpoint.expected_arrival!)
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
      return (tour) =>
        tour.status === 'INPROGRESS' || tour.status === 'CHECKPOINTACTIVE'
    case 'HISTORY':
      return (tour) => tour.status === 'CLOSED' || tour.status === 'CANCELLED'
    default:
      return () => true
  }
}

export function getTourActivity(
  slice: TourSlice = 'ALL',
  optsOrScope: TourEnrichOptions | UserScope = {}
): TourActivity[] {
  const opts: TourEnrichOptions =
    'view' in optsOrScope ? { scope: optsOrScope } : optsOrScope
  const storeTours = useToursStore.getState().tours
  let tours =
    import.meta.env.VITE_API_MODE === 'http' ||
    (storeTours && storeTours.length > 0)
      ? storeTours
      : (defaultDeliveryTours as DeliveryTour[])
  const scope = opts.scope
  if (scope && scope.view !== 'org') {
    if (scope.view === 'site' && scope.orgId) {
      tours = tours.filter((t) => t.marketeur_org_id === scope.orgId)
    } else if (scope.view === 'transporter' && scope.orgId) {
      tours = tours.filter((t) => t.transporter_org_id === scope.orgId)
    }
  }
  const storeCheckpoints = useToursStore.getState().checkpoints
  const checkpoints =
    opts.checkpoints ??
    (import.meta.env.VITE_API_MODE === 'http' ||
    (storeCheckpoints && storeCheckpoints.length > 0)
      ? storeCheckpoints
      : (defaultCheckpoints as Checkpoint[]))
  return tours
    .filter(slicePredicate(slice))
    .map((tour, index) => buildView(tour, { ...opts, checkpoints }, index))
}

export function getTourActivityById(
  id: string,
  optsOrScope: TourEnrichOptions | UserScope = {}
): TourActivity | undefined {
  const opts: TourEnrichOptions =
    'view' in optsOrScope ? { scope: optsOrScope } : optsOrScope
  const storeTours = useToursStore.getState().tours
  const tours =
    import.meta.env.VITE_API_MODE === 'http' ||
    (storeTours && storeTours.length > 0)
      ? storeTours
      : (defaultDeliveryTours as DeliveryTour[])
  const index = tours.findIndex((t) => t.id === id)
  if (index === -1) return undefined
  const tour = tours[index]!
  const storeCheckpoints = useToursStore.getState().checkpoints
  const checkpoints =
    opts.checkpoints ??
    (import.meta.env.VITE_API_MODE === 'http' ||
    (storeCheckpoints && storeCheckpoints.length > 0)
      ? storeCheckpoints
      : (defaultCheckpoints as Checkpoint[]))
  return buildView(tour, { ...opts, checkpoints }, index)
}

export function toTourActivities(
  tours: readonly DeliveryTour[],
  opts: TourEnrichOptions = {}
): TourActivity[] {
  return tours.map((tour, index) => buildView(tour, opts, index))
}

export function buildTourActivity(
  tour: DeliveryTour,
  index: number = 0,
  opts: TourEnrichOptions = {}
): TourActivity {
  return buildView(tour, opts, index)
}

export const getRouteTripsView = getTourActivity
export const buildTourSummary = buildRouteSummary
export const getTourCustomerOptions = getRouteCustomerOptions

export function getTourStops(
  id: string,
  checkpoints: Checkpoint[] = defaultCheckpoints
): string[] {
  const tour = useToursStore.getState().tours.find((t) => t.id === id)
  if (!tour) return []
  return checkpoints
    .filter((cp) => cp.tournee_id === tour.id || cp.tour_id === tour.id)
    .sort((a, b) => a.sequence - b.sequence)
    .map((cp) => siteName(cp.site_id ?? cp.client_site_id))
    .filter((name): name is string => Boolean(name))
}

export function getTourProgress(activity: TourActivity): number {
  if (activity.checkpoint_count === 0)
    return activity.tourneeStatus === 'CLOSED' ? 100 : 0
  return Math.round(
    (activity.completed_checkpoints / activity.checkpoint_count) * 100
  )
}

export function getTourEta(activity: TourActivity): string {
  if (!activity.startedAt) return '—'
  const eta = new Date(new Date(activity.startedAt).getTime() + 4 * 3600_000)
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(eta)
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
    activeVolume: trips
      .filter((trip) => ['in-progress', 'incident'].includes(trip.status))
      .reduce((total, trip) => total + trip.loadedQuantity, 0),
    deliveredVolume: trips.reduce(
      (total, trip) => total + trip.deliveredQuantity,
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

export function buildRouteLpgVariation(trip: RouteTripView): RouteLpgVariation {
  const loading = trip.loadedQuantity
  const live = trip.latestTelemetry.estimatedVolume
  const nextDrop =
    trip.status === 'completed' ? 0 : (trip.nextStop?.deliveredQuantity ?? 0)
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
        deltaPercent: toPercent(projected, loading) - toPercent(live, loading),
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
