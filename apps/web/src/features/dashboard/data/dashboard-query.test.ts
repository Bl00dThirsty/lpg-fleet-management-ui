import { describe, expect, it } from 'vitest'
import { getRouteTripsView } from '@/features/tours/data/tour-activity'
import { parseLocalDate } from '../lib/local-date-range'
import {
  dashboardQueryToSearch,
  dashboardSearchSchema,
  parseDashboardSearch,
  periodLabelKey,
  resolveDashboardQuery,
  selectDashboardPeriod,
  selectDashboardFleet,
  filterByDateRange,
  filterByFleet,
} from './dashboard-query'
import type { DashboardQuery } from './dashboard-query'
import type { DashboardPeriod } from './dashboard-query'


function allTripsRange() {
  const dates = getRouteTripsView('ALL').flatMap((trip) => [
    parseLocalDate(trip.startedAt),
    parseLocalDate(trip.lastUpdatedAt),
  ])
  return {
    from: new Date(Math.min(...dates.map((date) => date.getTime()))),
    to: new Date(Math.max(...dates.map((date) => date.getTime()))),
  }
}

describe('resolveDashboardQuery', () => {
  it('falls back to the local period range when no range is given', () => {
    const now = new Date(2026, 1, 13, 23, 45, 12)
    const resolved = resolveDashboardQuery({ period: 'daily' }, now)

    expect(resolved.period).toBe('daily')
    expect(resolved.range.from).toEqual(new Date(2026, 1, 13, 0, 0, 0, 0))
    expect(resolved.range.to).toEqual(new Date(2026, 1, 13, 23, 59, 59, 999))
  })

  it('defaults to the daily period when the query omits it', () => {
    expect(resolveDashboardQuery({}, new Date(2026, 1, 13)).period).toBe('daily')
  })

  it('keeps an explicit custom range untouched', () => {
    const range = { from: new Date(2026, 0, 1), to: new Date(2026, 0, 2) }
    expect(resolveDashboardQuery({ period: 'weekly', range }, new Date()).range).toEqual(
      range,
    )
  })
})

describe('selectDashboardPeriod / selectDashboardFleet', () => {
  it('clears a custom date range when a period tab is selected', () => {
    const query: DashboardQuery = {
      period: 'daily',
      range: { from: new Date(2026, 0, 1), to: new Date(2026, 0, 2) },
      fleetName: 'Fleet A',
    }

    expect(selectDashboardPeriod(query, 'weekly')).toEqual({
      period: 'weekly',
      fleetName: 'Fleet A',
    })
  })

  it('drops the fleet selection when the all-fleets sentinel is chosen', () => {
    expect(
      selectDashboardFleet({ period: 'monthly', fleetName: 'Fleet A' }, 'all'),
    ).toEqual({ period: 'monthly' })
    expect(
      selectDashboardFleet({ period: 'monthly' }, 'Fleet B'),
    ).toEqual({ period: 'monthly', fleetName: 'Fleet B' })
  })
})

describe('filterByDateRange', () => {
  it('keeps trips whose local start day falls inside the range', () => {
    const trip = getRouteTripsView('ALL')[0]!
    const start = parseLocalDate(trip.startedAt)
    const range = {
      from: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
      to: new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        23,
        59,
        59,
        999,
      ),
    }

    expect(filterByDateRange(getRouteTripsView('ALL'), range)).toContainEqual(trip)
  })

  it('excludes trips outside the range', () => {
    expect(
      filterByDateRange(getRouteTripsView('ALL'), {
        from: new Date(1990, 0, 1),
        to: new Date(1990, 0, 2),
      }),
    ).toHaveLength(0)
  })
})

describe('filterByFleet', () => {
  it('keeps every trip when no fleet is selected', () => {
    const trips = getRouteTripsView('ALL')
    expect(filterByFleet(trips, undefined)).toHaveLength(trips.length)
  })

  it('keeps only the trips of the selected fleet', () => {
    const trips = getRouteTripsView('ALL')
    const fleetName = trips[0]!.truck.tenant_name
    const kept = filterByFleet(trips, fleetName)

    expect(kept.length).toBeGreaterThan(0)
    expect(
      kept.every((trip) => trip.truck.tenant_name === fleetName),
    ).toBe(true)
  })
})

describe('dashboard search round trip', () => {
  it('parses a dashboard search payload into a query', () => {
    expect(
      parseDashboardSearch({
        period: 'monthly',
        fleet: 'Fleet A',
        from: '2026-01-05',
        to: '2026-01-31',
      }),
    ).toEqual({
      period: 'monthly',
      fleetName: 'Fleet A',
      range: {
        from: new Date(2026, 0, 5),
        to: new Date(2026, 0, 31, 23, 59, 59, 999),
      },
    })
  })

  it('ignores unknown periods and inverted ranges', () => {
    expect(
      parseDashboardSearch({
        period: 'yearly' as DashboardPeriod,
        fleet: 'Fleet A',
      }),
    ).toEqual({ period: 'daily', fleetName: 'Fleet A' })
    expect(
      parseDashboardSearch({ from: '2026-02-10', to: '2026-01-10' }).range,
    ).toBeUndefined()
  })


  it('round trips period, fleet and range through the URL search payload', () => {
    const query: DashboardQuery = {
      period: 'weekly',
      fleetName: 'Fleet A',
      range: { from: new Date(2026, 0, 5), to: new Date(2026, 0, 11, 23, 59, 59, 999) },
    }

    expect(parseDashboardSearch(dashboardQueryToSearch(query))).toEqual(query)
  })

  it('serializes a period with an end of day range bound', () => {
    expect(
      dashboardQueryToSearch({
        period: 'monthly',
        range: {
          from: new Date(2026, 0, 5),
          to: new Date(2026, 0, 31, 23, 59, 59, 999),
        },
      }),
    ).toEqual({ period: 'monthly', from: '2026-01-05', to: '2026-01-31' })
  })


  it('keeps the fleet range reachable from the fleet detail route', () => {
    const query: DashboardQuery = {
      period: 'monthly',
      fleetName: 'Fleet A',
      range: {
        from: new Date(2026, 0, 5),
        to: new Date(2026, 0, 31, 23, 59, 59, 999),
      },
    }
    const search = dashboardQueryToSearch(query)

    expect(search.fleet).toBe('Fleet A')
    expect(parseDashboardSearch(search)).toEqual(query)
  })

})

describe('allTripsRange helper sanity', () => {
  it('produces a range that keeps every trip', () => {
    const range = allTripsRange()
    expect(filterByDateRange(getRouteTripsView('ALL'), range)).toHaveLength(
      getRouteTripsView('ALL').length,
    )
  })
})

describe('periodLabelKey', () => {
  it('maps every period to a translatable key, never the raw token', () => {
    expect(periodLabelKey('daily')).toBe('filters.day')
    expect(periodLabelKey('weekly')).toBe('filters.week')
    expect(periodLabelKey('monthly')).toBe('filters.month')
  })

  it('never returns a raw period token', () => {
    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      expect(periodLabelKey(period)).not.toBe(period)
    }
  })
})

describe('dashboardSearchSchema', () => {
  it('validates and defaults a search payload', () => {
    const parsed = dashboardSearchSchema.parse({})

    expect(parsed).toEqual({ period: 'daily' })

    expect(
      dashboardSearchSchema.parse({ period: 'monthly', fleet: 'Fleet A' }),
    ).toEqual({ period: 'monthly', fleet: 'Fleet A' })
  })

  it('rejects an unknown period instead of passing it through', () => {
    expect(() => dashboardSearchSchema.parse({ period: 'yearly' })).toThrow()
  })

  it('rejects a non date range payload', () => {
    expect(() => dashboardSearchSchema.parse({ from: 'not-a-date' })).toThrow()
  })
})
