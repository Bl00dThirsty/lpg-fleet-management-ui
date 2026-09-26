import { describe, expect, it } from 'vitest'
import { getRouteTripsView } from '@/features/tours/data/tour-activity'
import { parseLocalDate } from '../lib/local-date-range'
import { buildDashboardView } from './dashboard'
import { buildDashboardCsvRows, dashboardCsvFileName } from './dashboard-export-rows'
import { filterByDateRange } from './dashboard-query'
import type { DashboardTranslator } from './dashboard'

const identity: DashboardTranslator = (key) => key

function fullRange() {
  const dates = getRouteTripsView('ALL').flatMap((trip) => [
    parseLocalDate(trip.startedAt),
    parseLocalDate(trip.lastUpdatedAt),
  ])
  return {
    from: new Date(Math.min(...dates.map((date) => date.getTime()))),
    to: new Date(Math.max(...dates.map((date) => date.getTime()))),
  }
}

function fullDashboard() {
  return buildDashboardView(
    undefined,
    undefined,
    { period: 'monthly', range: fullRange() },
    identity,
  )
}

describe('buildDashboardCsvRows', () => {
  it('starts from a real localized header without a duplicated namespace prefix', () => {
    expect(buildDashboardCsvRows(fullDashboard(), identity)[0]).toEqual([
      'export.section',
      'export.indicator',
      'export.value',
      'export.unit',
      'export.context',
    ])
  })

  it('localizes the unit column instead of leaking a raw unit token', () => {
    const rows = buildDashboardCsvRows(fullDashboard(), identity)
    const withValue = rows.slice(1).filter((row) => row[2] !== '')

    expect(withValue.length).toBeGreaterThan(0)
    for (const row of withValue) {
      expect(row[3]).toMatch(/^export\.units\./)
    }
    for (const row of rows.slice(1).filter((row) => row[2] === '')) {
      expect(row[3]).toBe('')
    }
  })

  it('emits one fleet row per unit that actually carries volume', () => {
    const dashboard = fullDashboard()
    const rows = buildDashboardCsvRows(dashboard, identity)
    const fleetRows = rows.filter((row) => row[0] === 'export.fleet')

    for (const fleet of dashboard.fleets) {
      for (const unit of ['TM', 'btl'] as const) {
        if (fleet.transported[unit].value <= 0) continue
        expect(fleetRows).toEqual(
          expect.arrayContaining([
            expect.arrayContaining([
              fleet.fleetName,
              String(fleet.transported[unit].value),
              `export.units.${unit}`,
            ]),
          ]),
        )
      }
    }
  })

  it('emits a route row per mission with its own unit', () => {
    const dashboard = fullDashboard()
    const rows = buildDashboardCsvRows(dashboard, identity)
    const routeRows = rows.filter((row) => row[0] === 'export.route')

    expect(routeRows).toHaveLength(dashboard.routeContributions.length)
    for (const row of routeRows) {
      expect(['TM', 'btl'].map((unit) => `export.units.${unit}`)).toContain(row[3])
    }
  })

  it('emits an activity row without a volume cell when no volume was measured', () => {
    const dashboard = fullDashboard()
    const rows = buildDashboardCsvRows(dashboard, identity)
    const activityRows = rows.filter((row) => row[0] === 'export.activity')

    for (const activity of dashboard.recentActivities) {
      const row = activityRows.find((candidate) => candidate[1] === activity.id)
      expect(row).toBeDefined()
      expect(row?.[3]).toBe(activity.volume ? `export.units.${activity.volume.unit}` : '')
    }
  })

  it('never emits a zero where a measurement is unavailable', () => {
    const dashboard = fullDashboard()
    const rows = buildDashboardCsvRows(dashboard, identity)

    for (const activity of dashboard.recentActivities) {
      const row = rows.find(
        (candidate) => candidate[0] === 'export.activity' && candidate[1] === activity.id,
      )
      if (activity.volume) {
        expect(row?.[2]).toBe(String(activity.volume.value))
      } else {
        expect(row?.[2]).toBe('')
        expect(row?.[3]).toBe('')
      }
    }
  })
})

describe('dashboardCsvFileName', () => {
  it('derives a safe file name from the generated timestamp', () => {
    expect(
      dashboardCsvFileName({
        ...fullDashboard(),
        overview: {
          ...fullDashboard().overview,
          generatedAt: '2026-02-18T09:30:00.000Z',
        },
      }),
    ).toBe('dashboard-2026-02-18.csv')
  })

  it('falls back to a stable name when no timestamp is available', () => {
    const dashboard = fullDashboard()
    expect(
      dashboardCsvFileName({
        ...dashboard,
        overview: { ...dashboard.overview, generatedAt: '' },
      }),
    ).toBe('dashboard.csv')
  })
})

describe('filterByDateRange integration', () => {
  it('keeps a narrow slice for the export builder', () => {
    const rows = filterByDateRange(getRouteTripsView('ALL'), fullRange())
    expect(rows).toHaveLength(getRouteTripsView('ALL').length)
  })
})
