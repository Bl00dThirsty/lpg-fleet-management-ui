import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getRouteTripsView } from '@/features/tours/data/tour-activity'
import { parseLocalDate } from '../lib/local-date-range'
import { buildDashboardView } from './dashboard'

function allTripsQuery() {
  const dates = getRouteTripsView('ALL').flatMap((trip) => [
    parseLocalDate(trip.startedAt),
    parseLocalDate(trip.lastUpdatedAt),
  ])
  return {
    period: 'monthly' as const,
    range: {
      from: new Date(Math.min(...dates.map((date) => date.getTime()))),
      to: new Date(Math.max(...dates.map((date) => date.getTime()))),
    },
  }
}

const orchestrator = join(process.cwd(), 'src/features/dashboard/data/dashboard.ts')

describe('language purity of the orchestrator', () => {
  it('never reads the ambient language', () => {
    const source = readFileSync(orchestrator, 'utf8')

    expect(source).not.toMatch(/currentLang/)
    expect(source).not.toMatch(/from '@\/lib\/i18n\/formatters'/)
    expect(source).not.toMatch(/Intl\./)
  })

  it('returns the period range as structured calendar data', () => {
    const dashboard = buildDashboardView(undefined, undefined, {
      period: 'monthly',
      range: { from: new Date(2026, 0, 5), to: new Date(2026, 0, 31, 23, 59, 59, 999) },
    })

    expect(dashboard.overview.periodRange).toEqual({
      from: '2026-01-05',
      to: '2026-01-31',
    })
  })

  it('states an ISO calendar day whatever the range is', () => {
    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      const dashboard = buildDashboardView(
        undefined,
        undefined,
        { period, range: allTripsQuery().range },
        (key) => key,
      )

      expect(dashboard.overview.periodRange?.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(dashboard.overview.periodRange?.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('never formats a label itself, so the language stays a component concern', () => {
    const dashboard = buildDashboardView(undefined, undefined, allTripsQuery(), (key) =>
      key,
    )

    expect(dashboard.overview).not.toHaveProperty('dateRangeLabel')
  })
})
