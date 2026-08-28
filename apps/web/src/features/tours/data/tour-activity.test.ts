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

  it('getRouteTripsView alias returns the same rows', () => {
    expect(getRouteTripsView().map((t) => t.id)).toEqual(
      getTourActivity().map((t) => t.id),
    )
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
  it('derives loading/live/projected stages from telemetry', () => {
    const trip = buildTourActivity(curated.delivery_tours[0]!, 0)
    const variation = buildRouteLpgVariation(trip)
    expect(variation.stages).toHaveLength(3)
    expect(variation.delivered).toBe(trip.deliveredQuantity)
  })
})
