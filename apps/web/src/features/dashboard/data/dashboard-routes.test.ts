import { describe, expect, it } from 'vitest'
import { getRouteTripsView } from '@/features/tours/data/tour-activity'
import { buildRouteContributions } from './dashboard-routes'
import { totalDeliveredFor, totalTransportedFor } from './dashboard-metrics'

function allTrips() {
  return getRouteTripsView('ALL')
}

/** TM first, then btl: the only ordering the table may use. */
const byUnitOrder = (left: 'TM' | 'btl', right: 'TM' | 'btl') =>
  left === right ? 0 : left === 'TM' ? -1 : 1

function build() {
  const trips = allTrips()
  return buildRouteContributions(trips, {
    totalTransported: totalTransportedFor(trips),
    totalDelivered: totalDeliveredFor(trips),
  })
}

describe('buildRouteContributions', () => {
  it('carries every volume as a unit-tagged quantity', () => {
    for (const row of build()) {
      expect(row.loaded.unit).toBe(row.unit)
      expect(row.delivered.unit).toBe(row.unit)
      expect(row.remaining.unit).toBe(row.unit)
    }
  })

  it('derives the row unit from the tour vehicle type', () => {
    const trips = allTrips()
    for (const row of build()) {
      const trip = trips.find((candidate) => candidate.id === row.id)
      expect(row.unit).toBe(trip?.truck.type === 'VRAC' ? 'TM' : 'btl')
    }
  })

  it('exposes no unaccounted quantity on a route row', () => {
    for (const row of build()) {
      expect(row).not.toHaveProperty('unaccounted')
    }
  })

  it('shares each row against its own unit denominator', () => {
    const trips = allTrips()
    const totalTransported = totalTransportedFor(trips)
    const totalDelivered = totalDeliveredFor(trips)

    for (const row of build()) {
      expect(row.transportedSharePercent).toBe(
        totalTransported[row.unit].value === 0
          ? 0
          : Math.round(
              (row.loaded.value / totalTransported[row.unit].value) * 100,
            ),
      )
      expect(row.deliveredSharePercent).toBe(
        totalDelivered[row.unit].value === 0
          ? 0
          : Math.round((row.delivered.value / totalDelivered[row.unit].value) * 100),
      )
    }
  })

  it('never sums a TM row into a btl row', () => {
    const rows = build()
    const sum = rows.reduce((acc, row) => acc + row.loaded.value, 0)
    const tmRows = rows.filter((row) => row.unit === 'TM')
    const btlRows = rows.filter((row) => row.unit === 'btl')

    expect(sum).toBe(
      tmRows.reduce((total, row) => total + row.loaded.value, 0) +
        btlRows.reduce((total, row) => total + row.loaded.value, 0),
    )
  })
})

describe('route ranking never compares two units', () => {
  it('groups the rows by unit before ranking them', () => {
    const units = build().map((row) => row.unit)

    expect(units).toEqual([...units].sort(byUnitOrder))
  })

  it('ranks inside a unit by that unit own share of its own total', () => {
    for (const unit of ['TM', 'btl'] as const) {
      const rows = build().filter((row) => row.unit === unit)
      for (let index = 1; index < rows.length; index += 1) {
        expect(rows[index - 1]!.transportedSharePercent).toBeGreaterThanOrEqual(
          rows[index]!.transportedSharePercent,
        )
      }
    }
  })

  it('never ranks a large bottle count above a small tonne count', () => {
    const rows = build()
    const firstBtl = rows.findIndex((row) => row.unit === 'btl')
    const lastTm = rows.map((row) => row.unit).lastIndexOf('TM')

    if (firstBtl === -1 || lastTm === -1) return
    expect(lastTm).toBeLessThan(firstBtl)
  })

  it('states the unit denominator of every share', () => {
    for (const row of build()) {
      expect(['TM', 'btl']).toContain(row.shareUnit)
      expect(row.shareUnit).toBe(row.unit)
    }
  })
})
