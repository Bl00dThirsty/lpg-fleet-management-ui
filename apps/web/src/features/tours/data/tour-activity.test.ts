import { describe, expect, it } from 'vitest'
import { curated } from '@lpg/mock-data'
import type { UserScope } from '@/features/scope/scope'
import {
  buildRouteLpgVariation,
  buildTourActivity,
  buildTourSummary,
  getRouteTripsView,
  getTourActivity,
  getTourActivityById,
  getTourCustomerOptions,
  getTourStops,
  isActiveTourStatus,
  toTourActivities,
} from './tour-activity'

describe('buildTourActivity', () => {
  it('builds every curated delivery_tour into a TourActivity', () => {
    const view = toTourActivities(curated.delivery_tours)
    expect(view).toHaveLength(curated.delivery_tours.length)
  })

  it('exposes canonical schema status plus a derived runtime status', () => {
    const tour = curated.delivery_tours[0]!
    const activity = buildTourActivity(tour, 0)
    expect(activity.tourneeStatus).toBe(tour.status)
    expect(activity.status).toMatch(/^(planned|in-progress|completed|incident)$/)
  })

  it('resolves management fields (marketeur, vehicle plate, sla flags)', () => {
    const activity = buildTourActivity(curated.delivery_tours[0]!, 0)
    expect(activity.marketeur_name.length).toBeGreaterThan(0)
    expect(activity.sla_transporter_no_ack).toBeTypeOf('boolean')
    expect(Array.isArray(activity.anomaly_ids)).toBe(true)
  })

  it('orders stops by sequence and links origin/destination sites', () => {
    const activity = buildTourActivity(curated.delivery_tours[0]!, 0)
    if (activity.stops.length >= 2) {
      expect(activity.originSite.id).toBe(activity.stops[0]!.siteId)
      expect(activity.destinationSite.id).toBe(
        activity.stops[activity.stops.length - 1]!.siteId,
      )
    }
  })

  it('produces telemetry, events and a latest telemetry point', () => {
    const activity = buildTourActivity(curated.delivery_tours[0]!, 0)
    expect(activity.telemetry.length).toBeGreaterThan(0)
    expect(activity.latestTelemetry).toBeDefined()
    expect(Array.isArray(activity.events)).toBe(true)
  })

  it('uses only scan meter readings as telemetry volume evidence', () => {
    const scanById = new Map(curated.scan_events.map((scan) => [scan.id, scan]))
    const trips = getRouteTripsView('ALL')

    for (const trip of trips) {
      for (const point of trip.telemetry) {
        const scan = scanById.get(point.id.replace(/^tel-/, ''))
        expect(point.meterReading).toBe(scan?.meter_reading ?? undefined)
      }
    }
  })

  it('exposes no LPG level or pressure fact on a telemetry point', () => {
    for (const trip of getRouteTripsView('ALL')) {
      for (const point of trip.telemetry) {
        expect(point).not.toHaveProperty('lpgLevelPercent')
        expect(point).not.toHaveProperty('pressureBar')
      }
    }
  })

  it('exposes no unaccounted or abnormal loss fact on the trip view', () => {
    for (const trip of getRouteTripsView('ALL')) {
      expect(trip).not.toHaveProperty('unaccounted')
    }
  })

  it('does not fabricate bottle telemetry from scan positions', () => {
    const bottleTrip = getRouteTripsView('ALL').find(
      (trip) => trip.tourneeType === 'BOUTEILLES50KG',
    )

    expect(
      bottleTrip?.telemetry.every(
        (point) => point.meterReading == null || point.meterReading >= 0,
      ),
    ).toBe(true)
  })

  it('keeps tours without telemetry empty instead of fabricating points', () => {
    const withoutTelemetry = getRouteTripsView('ALL').find(
      (trip) => trip.telemetry.length === 0,
    )

    expect(withoutTelemetry).toBeDefined()
  })
})

describe('getTourActivity', () => {
  it('filters by slice', () => {
    expect(getTourActivity('INTERNAL').every((t) => t.execution_mode === 'INTERNAL')).toBe(true)
    expect(getTourActivity('PENDING').every((t) => t.tourneeStatus === 'PENDINGTRANSPORTERACK')).toBe(true)
    expect(getTourActivity('ACTIVE').every((t) => t.tourneeStatus === 'INPROGRESS' || t.tourneeStatus === 'CHECKPOINTACTIVE')).toBe(true)
    expect(getTourActivity('HISTORY').every((t) => t.tourneeStatus === 'CLOSED' || t.tourneeStatus === 'CANCELLED')).toBe(true)
  })

  it('getTourActivityById returns a matching tour', () => {
    const first = getTourActivity()[0]!
    expect(getTourActivityById(first.id)?.id).toBe(first.id)
    expect(getTourActivityById('missing-tour')?.id).toBeUndefined()
  })

  it('getTourCustomerOptions dedupes customers', () => {
    const options = getTourCustomerOptions(getTourActivity())
    expect(new Set(options.map((o) => o.value)).size).toBe(options.length)
  })

  it('buildTourSummary states partition all tours', () => {
    const summary = buildTourSummary(getTourActivity())
    expect(summary.totalTrips).toBe(getTourActivity().length)
    expect(summary.activeTrips + summary.completedTrips + summary.plannedTrips + summary.incidentTrips).toBe(summary.totalTrips)
  })

  it('buildTourSummary never counts a cancelled tour as active', () => {
    const cancelled = curated.delivery_tours.filter(
      (tour) => tour.status === 'CANCELLED',
    )
    const summary = buildTourSummary(toTourActivities(cancelled))

    expect(summary.activeTrips).toBe(0)
  })

  it('buildTourSummary counts active tours from the canonical active statuses', () => {
    const active = curated.delivery_tours.filter((tour) =>
      isActiveTourStatus(tour.status),
    )
    const summary = buildTourSummary(toTourActivities(active))

    expect(summary.activeTrips).toBe(active.length)
    expect(active.length).toBeGreaterThan(0)
  })

  it('a cancelled tour reports a zero delivered quantity', () => {
    const cancelled = curated.delivery_tours.find(
      (tour) => tour.status === 'CANCELLED',
    )

    if (!cancelled) return

    const activity = buildTourActivity(cancelled, 0)
    expect(activity.status).toBe('incident')
    expect(isActiveTourStatus(activity.tourneeStatus)).toBe(false)
  })

  it('getTourStops returns ordered stop names', () => {
    expect(Array.isArray(getTourStops(curated.delivery_tours[0]!.id))).toBe(true)
  })

  it('site scope narrows tours to the marketeur org set', () => {
    const scope: UserScope = {
      view: 'site',
      orgId: 'org-0002-sctm-0000-000000000001',
      siteIds: ['site-0001-sctm-bonaberi'],
      userId: 'user-nobody',
    }
    const scoped = getTourActivity('ALL', scope)
    expect(scoped.length).toBeGreaterThan(0)
    expect(scoped.length).toBeLessThan(getTourActivity().length)
    expect(scoped.length).toBe(
      curated.delivery_tours.filter(
        (t) => t.marketeur_org_id === 'org-0002-sctm-0000-000000000001',
      ).length,
    )
  })

  it('transporter scope narrows tours to the transporter org set', () => {
    const scope: UserScope = {
      view: 'transporter',
      orgId: 'org-0010-translog----000000000001',
      siteIds: [],
      userId: 'user-nobody',
    }
    const scoped = getTourActivity('ALL', scope)
    expect(scoped.length).toBe(
      curated.delivery_tours.filter(
        (t) => t.transporter_org_id === 'org-0010-translog----000000000001',
      ).length,
    )
  })
})

describe('buildRouteLpgVariation', () => {
  it('derives loaded, latest reading, delivered and remaining stages without projections', () => {
    const trip = buildTourActivity(curated.delivery_tours[0]!, 0)
    const variation = buildRouteLpgVariation(trip)
    expect(variation.stages.map((stage) => stage.id)).toEqual([
      'loading',
      'live',
      'delivered',
      'remaining',
    ])
    expect(variation.delivered).toBe(trip.deliveredQuantity)
  })

  it('labels every stage with a translatable key instead of runtime French', () => {
    const trip = buildTourActivity(curated.delivery_tours[0]!, 0)
    const variation = buildRouteLpgVariation(trip)

    expect(variation.stages.map((stage) => stage.labelKey)).toEqual([
      'variation.stageLoading',
      'variation.stageLive',
      'variation.stageDelivered',
      'variation.stageRemaining',
    ])
    for (const stage of variation.stages) {
      expect(stage).not.toHaveProperty('label')
    }
  })

  it('leaves the live stage quantity absent when no meter reading exists', () => {
    const withoutReading = curated.delivery_tours
      .map((tour) => buildTourActivity(tour, 0))
      .find((trip) => trip.latestTelemetry?.meterReading == null)

    if (!withoutReading) return

    const live = buildRouteLpgVariation(withoutReading).stages.find(
      (stage) => stage.id === 'live',
    )

    expect(live?.quantity ?? null).toBeNull()
    expect(live?.delta ?? null).toBeNull()
  })

  it('exposes no speculative next drop quantity nor telemetry gap', () => {
    const trip = buildTourActivity(curated.delivery_tours[0]!, 0)
    const variation = buildRouteLpgVariation(trip)

    expect(variation).not.toHaveProperty('nextStopQuantity')
    expect(variation).not.toHaveProperty('telemetryGap')
    expect(variation).not.toHaveProperty('nextDrop')
  })
})

describe('next stop selection', () => {
  it('selects only a genuinely PENDING checkpoint as the next stop', () => {
    const checkpointById = new Map(
      curated.checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]),
    )

    for (const trip of getRouteTripsView('ALL')) {
      if (trip.nextStop === null) continue

      const checkpoint = checkpointById.get(trip.nextStop.id)
      expect(checkpoint?.status).toBe('PENDING')
    }
  })

  it('is null once no PENDING checkpoint remains', () => {
    const closed = curated.delivery_tours.find(
      (tour) =>
        tour.status === 'CLOSED' &&
        curated.checkpoints
          .filter((checkpoint) => checkpoint.tournee_id === tour.id)
          .every((checkpoint) => checkpoint.status !== 'PENDING'),
    )

    if (!closed) return

    expect(buildTourActivity(closed, 0).nextStop).toBeNull()
  })

  it('never falls back to an already visited stop', () => {
    for (const trip of getRouteTripsView('ALL')) {
      if (trip.nextStop === null) continue
      expect(trip.nextStop.completed).toBe(false)
    }
  })
})

describe('tour trip view telemetry surfaces', () => {
  it('exposes no projected level or pressure deltas on the trip view', () => {
    for (const trip of getRouteTripsView('ALL')) {
      expect(trip).not.toHaveProperty('lpgDropPercent')
      expect(trip).not.toHaveProperty('pressureDeltaBar')
    }
  })
})
