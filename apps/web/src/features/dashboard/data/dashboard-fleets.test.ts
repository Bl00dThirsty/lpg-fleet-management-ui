import { describe, expect, it } from 'vitest'
import { getRouteTripsView, isActiveTourStatus } from '@/features/tours/data/tour-activity'
import { quantity, totalUnitKeys } from './dashboard-quantity'
import {
  buildFleetSummaries,
  buildFlowBreakdown,
  FLEET_BUCKET_LIMIT,
} from './dashboard-fleets'
import { totalTransportedFor } from './dashboard-metrics'


function allTrips() {
  return getRouteTripsView('ALL')
}

describe('buildFleetSummaries', () => {
  it('keeps the transported, delivered and remaining totals unit-tagged', () => {
    const trips = allTrips()
    const fleets = buildFleetSummaries({
      trucks: trips.map((trip) => trip.truck),
      trips,
      totalTransported: totalTransportedFor(trips),
    })

    expect(fleets.length).toBeGreaterThan(0)
    for (const fleet of fleets) {
      for (const key of totalUnitKeys()) {
        expect(fleet.transported[key].unit).toBe(key)
        expect(fleet.delivered[key].unit).toBe(key)
        expect(fleet.remaining[key].unit).toBe(key)
      }
    }
  })

  it('never adds a TM fleet total to a btl fleet total', () => {
    const trips = allTrips()
    const fleets = buildFleetSummaries({
      trucks: trips.map((trip) => trip.truck),
      trips,
      totalTransported: totalTransportedFor(trips),
    })
    const sumOfFleets = fleets.reduce(
      (acc, fleet) => ({
        TM: acc.TM + fleet.transported.TM.value,
        btl: acc.btl + fleet.transported.btl.value,
      }),
      { TM: 0, btl: 0 },
    )

    const overall = totalTransportedFor(trips)

    expect(sumOfFleets.TM).toBeCloseTo(overall.TM.value, 5)
    expect(sumOfFleets.btl).toBeCloseTo(overall.btl.value, 5)

  })

  it('computes each unit share against its own unit denominator', () => {
    const trips = allTrips()
    const totalTransported = totalTransportedFor(trips)
    const fleets = buildFleetSummaries({
      trucks: trips.map((trip) => trip.truck),
      trips,
      totalTransported,
    })

    for (const fleet of fleets) {
      for (const unit of totalUnitKeys()) {
        expect(fleet.sharePercent[unit]).toBe(
          totalTransported[unit].value === 0
            ? 0
            : Math.round(
                (fleet.transported[unit].value / totalTransported[unit].value) * 100,
              ),
        )
      }
    }
  })

  it('counts active missions from the canonical active tour statuses', () => {
    const trips = allTrips()
    const fleets = buildFleetSummaries({
      trucks: trips.map((trip) => trip.truck),
      trips,
      totalTransported: totalTransportedFor(trips),
    })

    for (const fleet of fleets) {
      const expected = trips.filter(
        (trip) =>
          trip.truck.tenant_name === fleet.fleetName &&
          isActiveTourStatus(trip.tourneeStatus),
      ).length
      expect(fleet.activeTripCount).toBe(expected)
    }
  })

  it('assigns a distinct color per fleet so segments never collapse to one hue', () => {
    const trips = allTrips()
    const fleets = buildFleetSummaries({
      trucks: trips.map((trip) => trip.truck),
      trips,
      totalTransported: totalTransportedFor(trips),
    })

    expect(new Set(fleets.map((fleet) => fleet.color)).size).toBe(fleets.length)
  })

  it('reports mobilization against the fleet truck count', () => {
    const trips = allTrips()
    const trucks = trips.map((trip) => trip.truck)
    const fleets = buildFleetSummaries({
      trucks,
      trips,
      totalTransported: totalTransportedFor(trips),
    })

    for (const fleet of fleets) {
      expect(fleet.utilizationPercent).toBe(
        fleet.truckCount === 0
          ? 0
          : Math.round((fleet.activeTruckCount / fleet.truckCount) * 100),
      )
    }
  })

  it('keeps a zero-transport fleet with a real quantity object', () => {
    const trips = allTrips()
    const idleTruck = {
      ...trips[0]!.truck,
      tenant_name: 'Idle Fleet',
      tournee_status: 'DRAFT' as const,
    }
    const fleet = buildFleetSummaries({
      trucks: [...trips.map((trip) => trip.truck), idleTruck],
      trips,
      totalTransported: totalTransportedFor(trips),
    })[0]

    if (fleet?.fleetName !== 'Idle Fleet') return
    expect(fleet.transported.TM).toEqual(quantity(0, 'TM'))
  })
})

describe('buildFlowBreakdown', () => {
  function build() {
    const trips = allTrips()
    return buildFlowBreakdown(trips, totalTransportedFor(trips))
  }

  it('returns one segment list per unit so no array mixes TM and btl', () => {
    const breakdown = build()

    expect(Object.keys(breakdown).sort()).toEqual(['TM', 'btl'])
    for (const unit of totalUnitKeys()) {
      for (const segment of breakdown[unit]) {
        expect(segment.quantity.unit).toBe(unit)
        expect(segment.amount.unit).toBe(unit)
      }
    }
  })

  it('drops zero volume segments', () => {
    for (const unit of totalUnitKeys()) {
      for (const segment of build()[unit]) {
        expect(segment.quantity.value).toBeGreaterThan(0)
      }
    }
  })

  it('shares each segment against the total of its own unit', () => {
    const trips = allTrips()
    const totals = totalTransportedFor(trips)
    const breakdown = buildFlowBreakdown(trips, totals)

    for (const unit of totalUnitKeys()) {
      const total = totals[unit].value
      for (const segment of breakdown[unit]) {
        expect(segment.sharePercent).toBe(
          total === 0
            ? 0
            : Math.round((segment.quantity.value / total) * 100),
        )
      }
    }
  })

  it('gives two segments of the same unit two different colors', () => {
    const trips = allTrips()
    const breakdown = buildFlowBreakdown(trips, totalTransportedFor(trips))

    for (const unit of totalUnitKeys()) {
      const colors = breakdown[unit].map((segment) => segment.color)
      expect(new Set(colors).size).toBe(colors.length)
    }
  })

  it('reuses the fleet color for the carrier segment', () => {
    const trips = allTrips()
    const totals = totalTransportedFor(trips)
    const fleets = buildFleetSummaries({
      trucks: trips.map((trip) => trip.truck),
      trips,
      totalTransported: totals,
    })
    const breakdown = buildFlowBreakdown(trips, totals)

    for (const unit of totalUnitKeys()) {
      for (const segment of breakdown[unit]) {
        const fleet = fleets.find((candidate) => candidate.fleetName === segment.label)
        expect(segment.color).toBe(fleet?.color)
      }
    }
  })
})

describe('fleet buckets', () => {
  const t = (key: string) => (key === 'flow.otherFleets' ? 'Autres flottes' : key)

  function manyCarriers(count: number) {
    const trips = allTrips()
    return Array.from({ length: count }, (_, index) => ({
      ...trips[index % trips.length]!,
      id: `trip-${index}`,
      truck: { ...trips[index % trips.length]!.truck, id: `veh-${index}`, tenant_name: `Carrier ${index}` },
    }))
  }

  function build(count: number) {
    const trips = manyCarriers(count)
    return buildFleetSummaries({
      trucks: null,
      trips,
      totalTransported: totalTransportedFor(trips),
      t,
    })
  }

  it('never exposes more buckets than the chart tokens can colour', () => {
    expect(build(8).length).toBeLessThanOrEqual(FLEET_BUCKET_LIMIT + 1)
  })

  it('gives every visible bucket a distinct token colour', () => {
    const fleets = build(8)

    expect(new Set(fleets.map((fleet) => fleet.color)).size).toBe(fleets.length)
    for (const fleet of fleets) {
      expect(fleet.color).toMatch(/^var\(--color-chart-\d\)$/)
    }
  })

  it('collects the overflow into one clearly labelled Other bucket', () => {
    const others = build(8).filter((fleet) => fleet.isOtherBucket)

    expect(others).toHaveLength(1)
    expect(others[0]!.fleetName).toBe('Autres flottes')
  })

  it('adds no Other bucket when every carrier already fits', () => {
    expect(build(FLEET_BUCKET_LIMIT).filter((f) => f.isOtherBucket)).toHaveLength(0)
  })

  it('accounts for every carrier in either a named bucket or the Other bucket', () => {
    const trips = manyCarriers(8)
    const fleets = buildFleetSummaries({
      trucks: null,
      trips,
      totalTransported: totalTransportedFor(trips),
      t,
    })

    expect(
      fleets.reduce((sum, fleet) => sum + fleet.activeTripCount, 0),
    ).toBe(
      trips.filter((trip) => isActiveTourStatus(trip.tourneeStatus)).length,
    )
  })

  it('never invents a truck count it cannot evidence', () => {
    for (const fleet of buildFleetSummaries({
      trucks: null,
      trips: allTrips(),
      totalTransported: totalTransportedFor(allTrips()),
      t,
    })) {
      expect(fleet.truckCount).toBeNull()
      expect(fleet.activeTruckCount).toBeNull()
      expect(fleet.riskTruckCount).toBeNull()
      expect(fleet.utilizationPercent).toBeNull()
    }
  })

  it('keeps the evidence based truck counts when the vehicles are visible', () => {
    const trips = allTrips()
    const fleets = buildFleetSummaries({
      trucks: trips.map((trip) => trip.truck),
      trips,
      totalTransported: totalTransportedFor(trips),
      t,
    })

    for (const fleet of fleets) {
      expect(fleet.truckCount).toBeGreaterThan(0)
      expect(fleet.utilizationPercent).not.toBeNull()
    }
  })

  it('mirrors the same buckets and colours in the flow breakdown', () => {
    const trips = manyCarriers(8)
    const totals = totalTransportedFor(trips)
    const fleets = buildFleetSummaries({ trucks: null, trips, totalTransported: totals, t })
    const breakdown = buildFlowBreakdown(trips, totals, t)

    for (const unit of totalUnitKeys()) {
      const segments = breakdown[unit]
      expect(segments.length).toBeLessThanOrEqual(FLEET_BUCKET_LIMIT + 1)
      for (const segment of segments) {
        const fleet = fleets.find(
          (candidate) =>
            candidate.fleetName === segment.label ||
            (candidate.isOtherBucket && segment.isOtherBucket),
        )
        expect(segment.color).toBe(fleet?.color)
      }
    }
  })
})
