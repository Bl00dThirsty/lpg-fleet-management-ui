import { describe, expect, it } from 'vitest'
import { getOverviewCards } from './overview'
import { buildDashboardView } from '@/features/dashboard/data/dashboard'

describe('overview view-model', () => {
  it('returns a non-empty KPI set for every role', () => {
    for (const role of [
      'SUPERADMIN',
      'ADMIN',
      'TRANSPORTEUR',
      'MARKETEUR',
      'SUPERVISOR',
      'INTEGRATEUR',
      'AGENT',
    ] as const) {
      const cards = getOverviewCards(role)
      expect(cards.length).toBeGreaterThan(0)
    }
  })

  it('shows organization/users KPIs for SUPERADMIN', () => {
    const cards = getOverviewCards('SUPERADMIN')
    const ids = cards.map((c) => c.id)
    expect(ids).toContain('organizations')
    expect(ids).toContain('users')
    expect(ids).toContain('sites')
    expect(ids).toContain('tours')
  })

  it('shows fleet/traceability KPIs for TRANSPORTEUR', () => {
    const cards = getOverviewCards('TRANSPORTEUR')
    const ids = cards.map((c) => c.id)
    expect(ids).toContain('tours-in-flight')
    expect(ids).toContain('traceability')
  })

  it('shows device + checkpoint KPIs for SUPERVISOR', () => {
    const cards = getOverviewCards('SUPERVISOR')
    const ids = cards.map((c) => c.id)
    expect(ids).toContain('devices-offline')
    expect(ids).toContain('checkpoints')
  })

  it('shows compliance KPIs for AGENT', () => {
    const cards = getOverviewCards('AGENT')
    const ids = cards.map((c) => c.id)
    expect(ids).toContain('reconciliations-gap')
    expect(ids).toContain('declared-vs-tracked')
  })

  it('uses the scoped dashboard values when provided', () => {
    const dashboard = buildDashboardView('TRANSPORTEUR')
    const cards = getOverviewCards('TRANSPORTEUR', dashboard)

    const tours = cards.find((c) => c.id === 'tours-in-flight')
    expect(tours?.value).toBe(
      dashboard.overview.activeTrips
    )

    const transported = cards.find((c) => c.id === 'transported')
    expect(transported).toBeDefined()

    const reserve = cards.find((c) => c.id === 'reserve')
    expect(reserve?.progress).toBe(dashboard.overview.reserveFillPercent)
  })

  it('every card carries a deep link and an icon', () => {
    for (const role of [
      'SUPERADMIN',
      'ADMIN',
      'TRANSPORTEUR',
      'MARKETEUR',
      'SUPERVISOR',
      'INTEGRATEUR',
      'AGENT',
      'LIVREUR',
    ] as const) {
      for (const card of getOverviewCards(role)) {
        expect(card.href.startsWith('/')).toBe(true)
        expect(card.icon).toBeTruthy()
      }
    }
  })
})
