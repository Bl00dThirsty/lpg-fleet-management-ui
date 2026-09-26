import { describe, expect, it } from 'vitest'
import type { UserScope } from '@/features/scope/scope'
import { getRouteTripsView } from '@/features/tours/data/tour-activity'
import { parseLocalDate } from '../lib/local-date-range'
import { buildDashboardView, type DashboardQuery } from './dashboard'

const t = (key: string, params?: Record<string, string | number>) =>
  params && Object.keys(params).length > 0
    ? `${key}(${Object.values(params).join('|')})`
    : key

function allTripsQuery(): DashboardQuery {
  const dates = getRouteTripsView('ALL').flatMap((trip) => [
    parseLocalDate(trip.startedAt),
    parseLocalDate(trip.lastUpdatedAt),
  ])
  return {
    period: 'monthly',
    range: {
      from: new Date(Math.min(...dates.map((date) => date.getTime()))),
      to: new Date(Math.max(...dates.map((date) => date.getTime()))),
    },
  }
}

function allFleets() {
  return [...new Set(getRouteTripsView('ALL').map((trip) => trip.truck.tenant_name))].sort()
}

describe('buildDashboardView', () => {
  it('exposes unit-tagged volumes and no unsupported fact on the overview', () => {
    const dashboard = buildDashboardView(undefined, undefined, allTripsQuery(), t)

    expect(dashboard.overview.transported.TM.unit).toBe('TM')
    expect(dashboard.overview.delivered.TM.unit).toBe('TM')
    expect(dashboard.overview.transported.btl.unit).toBe('btl')
    expect(dashboard.overview).not.toHaveProperty('abnormalLossTM')
    expect(dashboard.overview).not.toHaveProperty('totalReserveTM')
    expect(dashboard).not.toHaveProperty('reserveSites')
  })

  it('keeps fleet row volumes inside their own unit', () => {
    const dashboard = buildDashboardView(undefined, undefined, allTripsQuery(), t)
    const trips = getRouteTripsView('ALL')

    for (const fleet of dashboard.fleets) {
      const fleetTrips = trips.filter((trip) => trip.truck.tenant_name === fleet.fleetName)

      expect(fleet.transported.TM.value).toBeCloseTo(
        fleetTrips
          .filter((trip) => trip.truck.type === 'VRAC')
          .reduce((total, trip) => total + trip.loadedQuantity, 0),
        5,
      )
      expect(fleet.transported.btl.value).toBeCloseTo(
        fleetTrips
          .filter((trip) => trip.truck.type === 'BOUTEILLES50KG')
          .reduce((total, trip) => total + trip.loadedQuantity, 0),
        5,
      )
    }
  })

  it('splits the flow breakdown per unit so no segment array mixes TM and btl', () => {
    const dashboard = buildDashboardView(undefined, undefined, allTripsQuery(), t)

    for (const unit of ['TM', 'btl'] as const) {
      const segments = dashboard.flowBreakdown[unit]
      for (const segment of segments) {
        expect(segment.quantity.unit).toBe(unit)
        expect(segment.amount.value).toBe(segment.quantity.value)
      }
    }
    expect(dashboard.flowBreakdown).not.toHaveProperty('length')
  })

  it('gives each flow segment of the selected unit its own share of that unit', () => {
    const dashboard = buildDashboardView(undefined, undefined, allTripsQuery(), t)

    for (const unit of ['TM', 'btl'] as const) {
      const total = dashboard.overview.transported[unit].value
      const shares = dashboard.flowBreakdown[unit]
        .filter((segment) => segment.quantity.value > 0)
        .reduce((sum, segment) => sum + segment.sharePercent, 0)

      if (total === 0) {
        expect(shares).toBe(0)
      } else {
        expect(shares).toBeGreaterThan(0)
        expect(shares).toBeLessThanOrEqual(101)
      }
    }
  })

  it('exposes route contributions with a unit on every volume', () => {
    const dashboard = buildDashboardView(undefined, undefined, allTripsQuery(), t)
    const trips = getRouteTripsView('ALL')

    expect(dashboard.routeContributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          loaded: expect.objectContaining({ unit: expect.any(String) }),
        }),
      ]),
    )

    for (const contribution of dashboard.routeContributions) {
      const trip = trips.find((candidate) => candidate.id === contribution.id)
      expect(contribution.unit).toBe(trip?.truck.type === 'VRAC' ? 'TM' : 'btl')
      expect(contribution).not.toHaveProperty('unaccounted')
    }
  })

  it('never shows a measured impact on a checkpoint arrival activity', () => {
    const dashboard = buildDashboardView(undefined, undefined, allTripsQuery(), t)

    for (const activity of dashboard.recentActivities) {
      if (activity.volume) {
        expect(['TM', 'btl']).toContain(activity.volume.unit)
      } else {
        expect(activity).not.toHaveProperty('impact')
      }
    }
  })

  it('resolves every user facing string through the translator', () => {
    const dashboard = buildDashboardView(undefined, undefined, allTripsQuery(), t)

    for (const metric of dashboard.metrics) {
      expect(metric.title).toMatch(/^metrics\./)
      expect(metric.description).toMatch(/^metrics\./)
      expect(metric.highlight).toMatch(/^metrics\./)
    }
    for (const alert of dashboard.alerts) {
      expect(alert.title).toMatch(/^alerts\./)
      expect(alert.description).toMatch(/^alerts\./)
      expect(alert.metricValue).toMatch(/^alerts\./)
    }
    for (const activity of dashboard.recentActivities.filter((entry) =>
      entry.id.startsWith('activity-trip-'),
    )) {
      expect(activity.title).toMatch(/^activities\./)
      expect(activity.description).toMatch(/^activities\./)
    }
  })

  it('never leaks a raw period token into user facing copy', () => {
    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      const dashboard = buildDashboardView(
        undefined,
        undefined,
        { period, range: allTripsQuery().range },
        t,
      )
      const copy = [
        dashboard.overview.dateRangeLabel,
        ...dashboard.metrics.flatMap((metric) => [
          metric.title,
          metric.description,
          metric.highlight,
        ]),
        ...dashboard.flowBreakdown.TM.map((segment) => segment.label),
        ...dashboard.flowBreakdown.btl.map((segment) => segment.label),
      ]

      for (const value of copy) {
        expect(value).not.toBe(period)
        expect(value).not.toMatch(new RegExp(`\\b${period}\\b`))
      }
    }
  })

  it('keeps fleet options from the scoped inventory while rows use the selected fleet', () => {
    const fleetName = allFleets()[0]!
    const dashboard = buildDashboardView(
      undefined,
      undefined,
      { ...allTripsQuery(), fleetName },
      t,
    )
    const all = buildDashboardView(undefined, undefined, allTripsQuery(), t)

    expect(dashboard.fleetOptions).toEqual(all.fleetOptions)
    expect(dashboard.fleets).toHaveLength(1)
    expect(dashboard.fleets[0]?.fleetName).toBe(fleetName)
  })

  it('uses the current local period when no explicit range is provided', () => {
    const today = new Date()
    const dashboard = buildDashboardView(undefined, undefined, { period: 'daily' }, t)
    const expected = getRouteTripsView('ALL').filter((trip) => {
      const start = parseLocalDate(trip.startedAt)
      return (
        start.getFullYear() === today.getFullYear() &&
        start.getMonth() === today.getMonth() &&
        start.getDate() === today.getDate()
      )
    })

    expect(dashboard.routeContributions).toHaveLength(expected.length)
  })

  it('never lets a marketer site scope exceed the org wide view', () => {
    const scope: UserScope = {
      view: 'site',
      siteIds: ['site-0001-sctm-bonaberi'],
      orgId: 'org-0002-sctm-0000-000000000001',
      userId: 'user-0007-sctm-marketeur',
    }
    const scoped = buildDashboardView('MARKETEUR', scope, allTripsQuery(), t)
    const orgWide = buildDashboardView('SUPERADMIN', undefined, allTripsQuery(), t)

    expect(scoped.overview.transported.TM.value).toBeGreaterThan(0)
    expect(scoped.overview.transported.TM.value).toBeLessThanOrEqual(
      orgWide.overview.transported.TM.value,
    )
  })

  it('scopes truck KPIs through the same scope helper as the tours', () => {
    const scope: UserScope = {
      view: 'agent',
      siteIds: ['site-0001-sctm-bonaberi'],
      orgId: 'org-0002-sctm-0000-000000000001',
      userId: 'user-0007-sctm-marketeur',
    }
    const agentView = buildDashboardView('AGENT', scope, allTripsQuery(), t)

    expect(agentView.truckScope).toEqual({ available: false, evidence: 'none' })
    expect(agentView.fleetOptions).toEqual([])
  })

  it('never renders a misleading 0/0 truck KPI when the scope has no vehicle evidence', () => {
    const scope: UserScope = {
      view: 'agent',
      siteIds: ['site-does-not-exist'],
      orgId: 'org-0002-sctm-0000-000000000001',
      userId: 'user-nobody',
    }
    const agentView = buildDashboardView('AGENT', scope, allTripsQuery(), t)

    expect(agentView.overview).not.toHaveProperty('totalTrucks')
    expect(agentView.overview).not.toHaveProperty('activeTrucks')
    expect(agentView.overview).not.toHaveProperty('riskTrucks')
    expect(agentView.overview).not.toHaveProperty('fleetMOBILISATION')
  })

  it('exposes no truck or mobilization metric the scope cannot evidence', () => {
    const scope: UserScope = {
      view: 'agent',
      siteIds: ['site-does-not-exist'],
      orgId: 'org-0002-sctm-0000-000000000001',
      userId: 'user-nobody',
    }
    const agentView = buildDashboardView('AGENT', scope, allTripsQuery(), t)
    const copy = [
      ...agentView.metrics.map((metric) => metric.id),
      ...agentView.metrics.map((metric) => metric.highlight),
    ]

    expect(copy.join(' ')).not.toMatch(/mobilisation|mobilization|camion|truck/i)
  })

  it('evidences vehicles from the site keys the actor actually owns', () => {
    const scope: UserScope = {
      view: 'agent',
      siteIds: ['org-0002-sctm-0000-000000000001'],
      orgId: 'org-0002-sctm-0000-000000000001',
      userId: 'user-nobody',
    }
    const agentView = buildDashboardView('AGENT', scope, allTripsQuery(), t)

    expect(agentView.truckScope.available).toBe(true)
    if (!agentView.truckScope.available) return
    expect(agentView.truckScope.total).toBeGreaterThan(0)
    expect(agentView.overview.totalTrucks).toBeGreaterThan(0)
  })

  it('never exposes a truck outside the actor site set', () => {
    const scope: UserScope = {
      view: 'agent',
      siteIds: ['org-0002-sctm-0000-000000000001'],
      orgId: 'org-0002-sctm-0000-000000000001',
      userId: 'user-nobody',
    }
    const agentView = buildDashboardView('AGENT', scope, allTripsQuery(), t)
    if (!agentView.truckScope.available) return

    const entitled = new Set(scope.siteIds)
    expect(
      agentView.truckScope.trucks.every((truck) => entitled.has(truck.org_id)),
    ).toBe(true)
  })
})
