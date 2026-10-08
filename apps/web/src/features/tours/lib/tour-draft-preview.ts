import {
  organizations as defaultOrganizations,
  vehicles as defaultVehicles,
} from '@/lib/entity-data'
import type { ClientSite, Site as CuratedSite } from '@lpg/types'
import { cityFromAddress, type Site } from '@/features/sites/data/sites'
import type { Truck } from '@/features/trucks/data/trucks'
import type {
  RouteTelemetryPoint,
  RouteTripViewStop,
  TourActivity,
} from '../data/tour-activity'
import type { TourDraftValues } from '../components/tour-create-schema'

function parseGeoCoordinates(
  geo: unknown
): { lat: number; lng: number } | null {
  if (!Array.isArray(geo) || geo.length < 2) return null
  const [lng, lat] = geo
  if (
    typeof lng !== 'number' ||
    typeof lat !== 'number' ||
    !Number.isFinite(lng) ||
    !Number.isFinite(lat) ||
    Math.abs(lng) > 180 ||
    Math.abs(lat) > 90
  )
    return null
  return { lat, lng }
}

export function clientSiteToOperationalSite(cs: ClientSite): Site | null {
  const coords = parseGeoCoordinates(cs.geo_point)
  if (!coords) return null
  return {
    id: cs.id,
    name: cs.name,
    type: 'delivery-point',
    city: cityFromAddress(cs.address),
    region: cs.region,
    operator: 'Client Distributeur',
    latitude: coords.lat,
    longitude: coords.lng,
    description: cs.address || '',
    status: 'active',
  }
}

export function buildDraftTourActivity(
  draft: Partial<TourDraftValues>,
  options?: {
    customClientSites?: ClientSite[]
    sourceSites?: CuratedSite[]
    clientSites?: ClientSite[]
  }
): TourActivity | null {
  const allOperationalSites: Site[] = (options?.sourceSites ?? []).flatMap(
    (site) => {
      const coords = parseGeoCoordinates(site.geo_point)
      if (!coords || site.deleted_at) return []
      return [
        {
          id: site.id,
          name: site.name,
          type: 'depot',
          city: cityFromAddress(site.address),
          region: site.region,
          operator: '',
          latitude: coords.lat,
          longitude: coords.lng,
          description: site.address ?? '',
          status: 'active',
          orgId: site.org_id,
        },
      ]
    }
  )
  const allClientSites = [
    ...(options?.customClientSites ?? []),
    ...(options?.clientSites ?? []),
  ]

  const sourceSiteId = draft.sourceSiteId
  if (!sourceSiteId) {
    return null
  }

  const originSite = allOperationalSites.find((s) => s.id === sourceSiteId)

  if (!originSite) {
    return null
  }

  const checkpoints = draft.checkpoints ?? []
  const deliveryStops: RouteTripViewStop[] = []
  const clientNames: string[] = []
  const clientSiteIds: string[] = []

  checkpoints.forEach((cp, idx) => {
    let resolvedSite: Site | null = null
    let clientName: string | undefined

    if (cp.client_site_id) {
      const cs = allClientSites.find(
        (c) => c.id === cp.client_site_id && !c.deleted_at
      )
      if (cs) {
        resolvedSite = clientSiteToOperationalSite(cs)
        clientName = cs.name
        clientNames.push(cs.name)
        clientSiteIds.push(cs.id)
      }
    } else if (cp.site_id) {
      const s = allOperationalSites.find((item) => item.id === cp.site_id)
      if (s) {
        resolvedSite = s
        clientName = s.name
        clientNames.push(s.name)
      }
    }

    if (resolvedSite) {
      deliveryStops.push({
        id: `stop-delivery-${idx + 1}`,
        siteId: resolvedSite.id,
        role: 'delivery',
        title: resolvedSite.name,
        completed: false,
        windowLabel: `Étape ${cp.sequence || idx + 1}`,
        expectedQuantity: cp.expected_quantity,
        deliveredQuantity: 0,
        note: `Livraison prévue — ${cp.expected_quantity ?? 0} ${draft.type === 'BOUTEILLES50KG' ? 'btl' : 'TM'}`,
        checkpointStatus: 'PENDING',
        site: resolvedSite,
        clientName: clientName ?? resolvedSite.name,
        pointName: resolvedSite.name,
        city: resolvedSite.city,
        address: resolvedSite.description,
      })
    }
  })

  if (deliveryStops.length !== checkpoints.length || !deliveryStops.length)
    return null

  const loadingStop: RouteTripViewStop = {
    id: 'stop-loading-0',
    siteId: originSite.id,
    role: 'loading',
    title: originSite.name,
    completed: false,
    windowLabel: 'Départ / Chargement',
    expectedQuantity: draft.requested_quantity ?? 0,
    deliveredQuantity: 0,
    note: 'Site source de chargement',
    checkpointStatus: 'PENDING',
    site: originSite,
    pointName: originSite.name,
    city: originSite.city,
    address: originSite.description,
  }

  const stops: RouteTripViewStop[] = [loadingStop, ...deliveryStops]
  const destinationSite =
    deliveryStops.length > 0
      ? deliveryStops[deliveryStops.length - 1]!.site
      : originSite

  const vehicle = defaultVehicles.find((v) => v.id === draft.vehicle_id)
  const truck: Truck = {
    id: vehicle?.id ?? 'truck-draft-preview',
    license_plate: vehicle?.license_plate ?? 'En attente d’affectation',
    type: draft.type ?? 'VRAC',
    tournee_status:
      draft.execution_mode === 'EXTERNAL' ? 'PENDINGTRANSPORTERACK' : 'PLANNED',
    org_id: draft.marketeur_org_id ?? originSite.orgId ?? '',
    tenant_name: 'Marketeur',
    region: (originSite.region as Truck['region']) ?? 'LITTORAL',
    requested_quantity: draft.requested_quantity ?? 0,
    loaded_quantity: draft.requested_quantity ?? 0,
    delivered_quantity: 0,
    risk_level: 'FAIBLE',
    current_location: originSite.name,
    lat: originSite.latitude,
    lng: originSite.longitude,
  }

  const latestTelemetry: RouteTelemetryPoint = {
    id: 'telemetry-draft-0',
    routeTripId: 'draft-preview',
    recordedAt: new Date().toISOString(),
    latitude: originSite.latitude,
    longitude: originSite.longitude,
    lpgLevelPercent: 0,
    pressureBar: 0,
    estimatedVolume: 0,
  }

  const org = defaultOrganizations.find((o) => o.id === draft.marketeur_org_id)
  const totalExpected = stops.reduce(
    (acc, s) => acc + (s.expectedQuantity ?? 0),
    0
  )

  return {
    id: 'draft-preview-tour',
    reference: 'PLANIFICATION-NOUVELLE-TOURNEE',
    truckId: truck.id,
    customerName: clientNames[0] ?? org?.name ?? 'Client distributeur',
    missionLead: 'Chauffeur / Livreur',
    originSiteId: originSite.id,
    destinationSiteId: destinationSite.id,
    startedAt: new Date().toISOString(),
    expectedArrivalAt: '',
    lastUpdatedAt: new Date().toISOString(),
    loadedQuantity: draft.requested_quantity ?? totalExpected,
    deliveredQuantity: 0,
    remainingQuantity: draft.requested_quantity ?? totalExpected,
    progressPercent: 0,
    routeDistanceKm: 0,
    onTime: true,
    status: 'planned',
    truck,
    originSite,
    destinationSite,
    stops,
    telemetry: [latestTelemetry],
    events: [],
    latestTelemetry,
    nextStop: deliveryStops[0] ?? null,
    deliveredPercent: 0,
    remainingPercent: 100,
    lpgDropPercent: 0,
    pressureDeltaBar: 0,
    unaccounted: 0,
    attentionLevel: 'low',
    tourneeStatus:
      draft.execution_mode === 'EXTERNAL' ? 'PENDINGTRANSPORTERACK' : 'PLANNED',
    tourneeType: draft.type ?? 'VRAC',
    anomaly_ids: [],
    marketeur_name: org?.name ?? 'Marketeur',
    transporter_name: null,
    vehicle_plate: truck.license_plate,
    driver_name: null,
    livreur_name: null,
    requested_quantity: draft.requested_quantity ?? 0,
    loaded_quantity: draft.requested_quantity ?? totalExpected,
    delivered_quantity: 0,
    checkpoint_count: stops.length,
    completed_checkpoints: 0,
    created_at: new Date().toISOString(),
    transport_assigned_at: null,
    execution_mode: draft.execution_mode ?? 'INTERNAL',
    sla_transporter_no_ack: false,
    sla_unassigned_too_long: false,
  }
}
