import { describe, expect, it } from 'vitest'
import { getRouteTripsView, isActiveTourStatus } from '@/features/tours/data/tour-activity'
import { quantity } from './dashboard-quantity'
import {
  buildDashboardMetrics,
  buildDashboardOverview,
  buildPeriodFacts,
  totalDeliveredFor,
  totalTransportedFor,
} from './dashboard-metrics'
import type { DashboardTranslator } from './dashboard'

const t: DashboardTranslator = (key, params) =>
  params && Object.keys(params).length > 0
    ? `${key}(${Object.values(params).join('|')})`
    : key

function allTrips() {
  return getRouteTripsView('ALL')
}

function withTrip(overrides: Partial<ReturnType<typeof allTrips>[number]>) {
  const base = allTrips()[0]!
  return { ...base, ...overrides }
}

describe('totalTransportedFor / totalDeliveredFor', () => {
  it('splits transported volume by unit without mixing them', () => {
    const trips = allTrips()
    const transported = totalTransportedFor(trips)

    for (const unit of ['TM', 'btl'] as const) {
      expect(transported[unit].unit).toBe(unit)
      expect(transported[unit].value).toBe(
        trips
          .filter((trip) => (trip.truck.type === 'VRAC' ? 'TM' : 'btl') === unit)
          .reduce((total, trip) => total + trip.loadedQuantity, 0),
      )
    }
  })

  it('sums delivered volume per unit', () => {
    const trips = allTrips()
    const delivered = totalDeliveredFor(trips)

    for (const unit of ['TM', 'btl'] as const) {
      expect(delivered[unit].value).toBe(
        trips
          .filter((trip) => (trip.truck.type === 'VRAC' ? 'TM' : 'btl') === unit)
          .reduce((total, trip) => total + trip.deliveredQuantity, 0),
      )
    }
  })
})

describe('buildDashboardOverview', () => {
  it('counts active trips from the canonical active tour statuses only', () => {
    const trips = allTrips()
    const overview = buildDashboardOverview({
      trips,
      trucks: [],
      period: 'monthly',
      dateRangeLabel: 'label',
      generatedAt: '2026-02-01T00:00:00.000Z',
      openAlerts: 0,
      criticalAlerts: 0,
      serviceRate: 0,
    })

    expect(overview.activeTrips).toBe(
      trips.filter((trip) => isActiveTourStatus(trip.tourneeStatus)).length,
    )
  })

  it('never counts a cancelled tour as active', () => {
    const cancelled = withTrip({ tourneeStatus: 'CANCELLED', status: 'incident' })
    const overview = buildDashboardOverview({
      trips: [cancelled],
      trucks: [],
      period: 'daily',
      dateRangeLabel: 'label',
      generatedAt: '2026-02-01T00:00:00.000Z',
      openAlerts: 0,
      criticalAlerts: 0,
      serviceRate: 0,
    })

    expect(overview.activeTrips).toBe(0)
  })

  it('counts truck mobilization from the canonical active tour statuses only', () => {
    const truck = allTrips()[0]!.truck
    const activeTruck = { ...truck, tournee_status: 'INPROGRESS' as const }
    const plannedTruck = { ...truck, tournee_status: 'PLANNED' as const }
    const cancelledTruck = { ...truck, tournee_status: 'CANCELLED' as const }

    expect(
      buildDashboardOverview({
        trips: [],
        trucks: [activeTruck, plannedTruck, cancelledTruck],
        period: 'daily',
        dateRangeLabel: 'label',
        generatedAt: '2026-02-01T00:00:00.000Z',
        openAlerts: 0,
        criticalAlerts: 0,
        serviceRate: 0,
      }).activeTrucks,
    ).toBe(1)
  })

  it('exposes no abnormal loss or unaccounted fact', () => {
    const overview = buildDashboardOverview({
      trips: allTrips(),
      trucks: [],
      period: 'daily',
      dateRangeLabel: 'label',
      generatedAt: '2026-02-01T00:00:00.000Z',
      openAlerts: 0,
      criticalAlerts: 0,
      serviceRate: 0,
    })

    expect(overview).not.toHaveProperty('abnormalLossTM')
    expect(overview).not.toHaveProperty('unaccounted')
    expect(overview).not.toHaveProperty('totalReserveTM')
  })

  it('carries transported and delivered volume as unit-tagged quantities', () => {
    const overview = buildDashboardOverview({
      trips: allTrips(),
      trucks: [],
      period: 'daily',
      dateRangeLabel: 'label',
      generatedAt: '2026-02-01T00:00:00.000Z',
      openAlerts: 0,
      criticalAlerts: 0,
      serviceRate: 0,
    })

    expect(overview.transported.TM).toEqual(quantity(overview.transported.TM.value, 'TM'))
    expect(overview.delivered.btl).toEqual(
      quantity(overview.delivered.btl.value, 'btl'),
    )
  })
})

describe('buildDashboardMetrics', () => {
  it('wraps every metric value in a typed unit-safe value', () => {
    const trips = allTrips()
    const metrics = buildDashboardMetrics({
      trips,
      criticalAlerts: 1,
      activeTrips: 2,
      serviceRate: 80,
      t,
    })

    for (const metric of metrics) {
      if (metric.value.kind === 'quantity') {
        expect(['TM', 'btl']).toContain(metric.value.quantity.unit)
      } else {
        expect(['count', 'percent', 'days']).toContain(metric.value.kind)
      }
    }
  })

  it('never mixes TM and btl inside one metric value', () => {
    const metrics = buildDashboardMetrics({
      trips: allTrips(),
      criticalAlerts: 0,
      activeTrips: 0,
      serviceRate: 0,
      t,
    })
    const quantityMetrics = metrics.filter((metric) => metric.value.kind === 'quantity')

    expect(quantityMetrics.length).toBeGreaterThan(1)
    for (const metric of quantityMetrics) {
      expect(Object.keys(metric.value as object)).toEqual(['kind', 'quantity'])
    }
  })

  it('exposes no delta or trend projection on a metric', () => {
    const metrics = buildDashboardMetrics({
      trips: allTrips(),
      criticalAlerts: 0,
      activeTrips: 0,
      serviceRate: 0,
      t,
    })

    for (const metric of metrics) {
      expect(metric).not.toHaveProperty('deltaPercent')
      expect(metric).not.toHaveProperty('trend')
    }
  })
})

describe('buildPeriodFacts', () => {
  it('keeps period facts on the same unit-tagged totals as the overview', () => {
    const trips = allTrips()
    const facts = buildPeriodFacts({ trips, period: 'monthly', alertCount: 3, serviceRate: 75 })

    expect(facts.transported.TM.unit).toBe('TM')
    expect(facts.delivered.btl.unit).toBe('btl')
    expect(facts).not.toHaveProperty('transportedTM')
    expect(facts).not.toHaveProperty('deliveredBtl')
  })
})
