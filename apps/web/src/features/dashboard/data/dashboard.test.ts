import { describe, expect, it } from 'vitest'
import { buildDashboardView } from './dashboard'
import type { Site } from '@/features/sites/data/sites'
import type { Truck } from '@/features/trucks/data/trucks'
import type { TourActivity } from '@/features/tours/data/tour-activity'

function makeSite(partial: Partial<Site> & Pick<Site, 'id' | 'name' | 'city'>): Site {
  return {
    type: 'depot',
    region: 'Littoral',
    operator: 'SCTM Test',
    latitude: 4.05,
    longitude: 9.68,
    description: 'Site de test.',
    status: 'active',
    ...partial,
  }
}

// Two sites reuse the reserve-config ids so the hydrated branch is covered;
// the other three config ids fall back to placeholders.
const siteBonaberi = makeSite({
  id: 'site-0001-sctm-bonaberi',
  name: 'Dépôt SCTM Bonabéri',
  city: 'Douala',
})
const siteKribi = makeSite({
  id: 'site-0033-scdp-kribi',
  name: 'Dépôt SCDP Kribi',
  type: 'scdp',
  city: 'Kribi',
})

function makeTruck(partial: Partial<Truck> & Pick<Truck, 'id' | 'tenant_name'>): Truck {
  return {
    license_plate: `LT-${partial.id.toUpperCase()}`,
    type: 'VRAC',
    tournee_status: 'INPROGRESS',
    max_volume: 30,
    org_id: 'org-test',
    region: 'LITTORAL',
    assigned_driver: 'Chauffeur Test',
    requested_quantity: 20,
    loaded_quantity: 20,
    delivered_quantity: null,
    risk_level: 'FAIBLE',
    lat: 4.05,
    lng: 9.7,
    ...partial,
  }
}

const truckA = makeTruck({ id: 'truck-a', tenant_name: 'Flotte Test Douala', tournee_status: 'INPROGRESS' })
const truckB = makeTruck({ id: 'truck-b', tenant_name: 'Flotte Test Douala', tournee_status: 'PLANNED', risk_level: 'MODERE' })
const truckC = makeTruck({ id: 'truck-c', tenant_name: 'Autre Flotte Test', tournee_status: 'CLOSED' })

type TripSpec = {
  id: string
  reference: string
  status: 'in-progress' | 'completed' | 'planned'
  onTime: boolean
  loaded: number
  delivered: number
  truck: Truck
  origin: Site
  destination: Site
  destStopCompleted: boolean
  destStopQuantity: number
  lastUpdatedAt: string
}

function makeTrip(spec: TripSpec): TourActivity {
  const remaining = spec.loaded - spec.delivered
  const destStop = {
    id: `${spec.id}-stop-dest`,
    siteId: spec.destination.id,
    role: 'delivery' as const,
    title: 'Livraison finale planifié',
    completed: spec.destStopCompleted,
    windowLabel: '08:00 - 08:20',
    deliveredQuantity: spec.destStopQuantity,
    note: '',
    site: spec.destination,
  }
  const originStop = {
    id: `${spec.id}-stop-origin`,
    siteId: spec.origin.id,
    role: 'loading' as const,
    title: 'Chargement confirmé',
    completed: true,
    windowLabel: '06:00 - 06:20',
    deliveredQuantity: undefined,
    note: '',
    site: spec.origin,
  }
  const stops = [originStop, destStop]
  const telemetry = {
    id: `${spec.id}-tel-0`,
    routeTripId: spec.id,
    recordedAt: spec.lastUpdatedAt,
    latitude: spec.origin.latitude,
    longitude: spec.origin.longitude,
    lpgLevelPercent: 80,
    pressureBar: 11.8,
    estimatedVolume: remaining,
  }
  const tourneeStatus = spec.status === 'in-progress' ? 'INPROGRESS' : spec.status === 'completed' ? 'CLOSED' : 'PLANNED'
  return {
    id: spec.id,
    reference: spec.reference,
    truckId: spec.truck.id,
    customerName: 'Client Test',
    missionLead: 'Chef Test',
    originSiteId: spec.origin.id,
    destinationSiteId: spec.destination.id,
    startedAt: '2026-04-20T06:00:00Z',
    expectedArrivalAt: '2026-04-20T12:00:00Z',
    lastUpdatedAt: spec.lastUpdatedAt,
    loadedQuantity: spec.loaded,
    deliveredQuantity: spec.delivered,
    remainingQuantity: remaining,
    progressPercent: spec.status === 'completed' ? 100 : spec.status === 'planned' ? 0 : 60,
    routeDistanceKm: 250,
    onTime: spec.onTime,
    status: spec.status,
    truck: spec.truck,
    originSite: spec.origin,
    destinationSite: spec.destination,
    stops,
    telemetry: [telemetry],
    events: [
      {
        id: `${spec.id}-ev-0`,
        routeTripId: spec.id,
        occurredAt: spec.lastUpdatedAt,
        severity: spec.status === 'in-progress' ? 'medium' : 'low',
        title: 'Point de contrôle atteint',
        description: 'Progression nominale.',
      },
    ],
    latestTelemetry: telemetry,
    nextStop: destStop,
    deliveredPercent: Math.round((spec.delivered / spec.loaded) * 100),
    remainingPercent: Math.round((remaining / spec.loaded) * 100),
    lpgDropPercent: 20,
    pressureDeltaBar: 0.6,
    unaccounted: 0,
    attentionLevel: spec.status === 'in-progress' ? 'medium' : 'low',
    tourneeStatus: tourneeStatus as TourActivity['tourneeStatus'],
    tourneeType: 'VRAC',
    execution_mode: 'INTERNAL',
    marketeur_name: 'SCTM Test Coop',
    transporter_name: null,
    vehicle_plate: spec.truck.license_plate,
    driver_name: 'Chauffeur Test',
    livreur_name: null,
    requested_quantity: spec.loaded,
    loaded_quantity: spec.loaded,
    delivered_quantity: spec.delivered,
    checkpoint_count: 2,
    completed_checkpoints: spec.destStopCompleted ? 2 : 1,
    created_at: '2026-04-20T05:00:00Z',
    transport_assigned_at: null,
    sla_transporter_no_ack: false,
    sla_unassigned_too_long: false,
    anomaly_ids: [],
  }
}

const trip1 = makeTrip({
  id: 'trip-1',
  reference: 'TRP-T1',
  status: 'in-progress',
  onTime: true,
  loaded: 20,
  delivered: 12,
  truck: truckA,
  origin: siteBonaberi,
  destination: siteKribi,
  destStopCompleted: true,
  destStopQuantity: 12,
  lastUpdatedAt: '2026-04-21T10:00:00Z',
})
const trip2 = makeTrip({
  id: 'trip-2',
  reference: 'TRP-T2',
  status: 'completed',
  onTime: false,
  loaded: 10,
  delivered: 8,
  truck: truckB,
  origin: siteKribi,
  destination: siteBonaberi,
  destStopCompleted: true,
  destStopQuantity: 8,
  lastUpdatedAt: '2026-04-20T15:00:00Z',
})
const trip3 = makeTrip({
  id: 'trip-3',
  reference: 'TRP-T3',
  status: 'planned',
  onTime: true,
  loaded: 15,
  delivered: 0,
  truck: truckC,
  origin: siteBonaberi,
  destination: siteKribi,
  destStopCompleted: false,
  destStopQuantity: 15,
  lastUpdatedAt: '2026-04-19T09:00:00Z',
})

const source = {
  routes: [trip1, trip2, trip3],
  trucks: [truckA, truckB, truckC],
  sites: [siteBonaberi, siteKribi],
}

describe('buildDashboardView', () => {
  it('builds the command dashboard aggregates from fleet, route, and site data', () => {
    const dashboard = buildDashboardView(undefined, undefined, undefined, source)

    expect(dashboard.overview).toMatchObject({
      totalTransportedTM: 45,
      totalDeliveredTM: 20,
      totalReserveTM: 86.55,
      reserveCapacityTM: 144,
      reserveFillPercent: 60,
      activeTrips: 1,
      plannedTrips: 1,
      incidentTrips: 0,
      activeTrucks: 2,
      totalTrucks: 3,
      riskTrucks: 1,
      abnormalLossTM: 0,
      openAlerts: 3,
      criticalAlerts: 1,
    })

    expect(dashboard.metrics.map((metric) => metric.id)).toEqual([
      'transported',
      'reserve',
      'delivered',
      'alerts',
    ])
    expect(dashboard.metrics[0]).toMatchObject({
      value: 45,
      unit: 'TM',
      deltaPercent: 5,
      deltaDirection: 'up',
    })
    expect(dashboard.metrics[1]).toMatchObject({
      value: 86.55,
      unit: 'TM',
      deltaPercent: -1,
      deltaDirection: 'down',
    })

    expect(
      dashboard.trendByPeriod.daily[dashboard.trendByPeriod.daily.length - 1]
    ).toEqual({
      label: "Aujourd'hui",
      transportedTM: 45,
      delivered: 20,
      reserveTM: 86.55,
      alertCount: 3,
      serviceRate: 50,
    })

    expect(dashboard.cadence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          period: 'daily',
          label: 'Jour',
          transportedDeltaPercent: 5,
          reserveDeltaPercent: -1,
        }),
        expect.objectContaining({ period: 'weekly', label: 'Semaine' }),
        expect.objectContaining({ period: 'monthly', label: 'Mois' }),
      ])
    )
  })

  it('surfaces fleet and reserve site hotspots in priority order', () => {
    const dashboard = buildDashboardView(undefined, undefined, undefined, source)

    // Fleets group inline trucks by tenant and sort by transported volume.
    expect(dashboard.fleets).toHaveLength(2)
    expect(dashboard.fleets[0]).toMatchObject({
      fleetName: 'Flotte Test Douala',
      transportedTM: 30,
      delivered: 20,
      pendingTM: 10,
      sharePercent: 67,
      onTimeRate: 50,
      truckCount: 2,
      activeTripCount: 1,
    })
    expect(dashboard.fleets[1]).toMatchObject({
      fleetName: 'Autre Flotte Test',
      transportedTM: 15,
      sharePercent: 33,
    })

    // Critical reserve first, then watch, then healthy by volume.
    expect(dashboard.reserveSites[0]).toMatchObject({
      siteId: 'site-0001-sctm-bonaberi',
      siteName: 'Dépôt SCTM Bonabéri',
      status: 'critical',
      fillPercent: 31,
      activeTripCount: 2,
      inboundTM: 8,
    })
    expect(dashboard.reserveSites[1]).toMatchObject({
      siteId: 'site-0029-scdp-yaounde',
      status: 'watch',
      fillPercent: 44,
      activeTripCount: 0,
    })

    expect(dashboard.alerts.map((alert) => alert.id)).toEqual([
      'reserve-site-0001-sctm-bonaberi-critical',
      'trip-2-eta',
      'reserve-site-0029-scdp-yaounde-watch',
    ])
  })

  it('keeps route-level contribution details for volume traceability', () => {
    const dashboard = buildDashboardView(undefined, undefined, undefined, source)

    expect(dashboard.routeContributions.map((c) => c.reference)).toEqual([
      'TRP-T1',
      'TRP-T3',
      'TRP-T2',
    ])
    expect(dashboard.routeContributions[0]).toMatchObject({
      carrierName: 'Flotte Test Douala',
      loadedQuantity: 20,
      transportedSharePercent: 44,
      status: 'in-progress',
    })
    expect(dashboard.routeContributions[1]).toMatchObject({
      reference: 'TRP-T3',
      loadedQuantity: 15,
      status: 'planned',
    })
    expect(dashboard.routeContributions[2]).toMatchObject({
      deliveredQuantity: 8,
      deliveredSharePercent: 40,
    })
  })

  it('renders the empty live state without crashing', () => {
    const dashboard = buildDashboardView(undefined, undefined, undefined, { routes: [], trucks: [] })

    expect(dashboard.overview).toMatchObject({
      totalTransportedTM: 0,
      totalDeliveredTM: 0,
      activeTrips: 0,
      totalTrucks: 0,
      openAlerts: 2,
      criticalAlerts: 1,
    })
    expect(dashboard.fleets).toEqual([])
    expect(dashboard.routeContributions).toEqual([])
    expect(dashboard.reserveSites).toHaveLength(5)
    expect(dashboard.metrics.map((m) => m.value)).toEqual([0, 86.55, 0, 2])
  })
})
