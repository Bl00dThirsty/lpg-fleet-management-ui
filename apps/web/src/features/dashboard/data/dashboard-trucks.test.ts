import { describe, expect, it } from 'vitest'
import { getRouteTripsView } from '@/features/tours/data/tour-activity'
import { getTrucks } from '@/features/trucks/data/trucks'
import type { UserScope } from '@/features/scope/scope'
import {
  resolveDashboardTruckScope,
  visibleTrucksFromTrips,
} from './dashboard-trucks'

const SCTM_ORG = 'org-0002-sctm-0000-000000000001'

/** No site key the actor owns, so no tour and no vehicle can be evidenced. */
const UNSCOPED_AGENT: UserScope = {
  view: 'agent',
  orgId: SCTM_ORG,
  siteIds: ['site-does-not-exist'],
  userId: 'user-nobody',
}

/** A site key that the tours are actually keyed by, so vehicles are evidenced. */
const AGENT_WITH_SCOPED_SITE: UserScope = {
  view: 'agent',
  orgId: SCTM_ORG,
  siteIds: [SCTM_ORG],
  userId: 'user-nobody',
}

const MARKETER: UserScope = {
  view: 'site',
  orgId: SCTM_ORG,
  siteIds: ['site-0001-sctm-bonaberi'],
  userId: 'user-0007-sctm-marketeur',
}

describe('visibleTrucksFromTrips', () => {
  it('keeps only vehicles proven in scope by a visible tour', () => {
    const trips = getRouteTripsView('ALL', AGENT_WITH_SCOPED_SITE)
    const trucks = visibleTrucksFromTrips(trips)
    const visibleIds = new Set(trips.map((trip) => trip.truckId))

    expect(trips.length).toBeGreaterThan(0)
    expect(trucks.length).toBeGreaterThan(0)
    expect(trucks.every((truck) => visibleIds.has(truck.id))).toBe(true)
  })

  it('never repeats the same vehicle when it runs several tours', () => {
    const trips = getRouteTripsView('ALL')
    const trucks = visibleTrucksFromTrips(trips)

    expect(new Set(trucks.map((truck) => truck.id)).size).toBe(trucks.length)
  })

  it('returns no vehicle when no tour is visible', () => {
    expect(visibleTrucksFromTrips([])).toEqual([])
  })
})

describe('resolveDashboardTruckScope', () => {
  it('reports the truck scope as unavailable rather than as zero trucks', () => {
    const scope = resolveDashboardTruckScope({
      scope: UNSCOPED_AGENT,
      scopedTrucks: getTrucks(UNSCOPED_AGENT),
      scopedTrips: getRouteTripsView('ALL', UNSCOPED_AGENT),
    })

    expect(scope).toEqual({ available: false, evidence: 'none' })
  })

  it('never reports a count when the scope is unavailable', () => {
    const scope = resolveDashboardTruckScope({
      scope: UNSCOPED_AGENT,
      scopedTrucks: getTrucks(UNSCOPED_AGENT),
      scopedTrips: getRouteTripsView('ALL', UNSCOPED_AGENT),
    })

    expect(scope).not.toHaveProperty('total')
    expect(scope).not.toHaveProperty('active')
    expect(scope).not.toHaveProperty('risk')
  })

  it('evidences vehicles from the site keys of a regulator scope', () => {
    const scope = resolveDashboardTruckScope({
      scope: MARKETER,
      scopedTrucks: getTrucks(MARKETER),
      scopedTrips: getRouteTripsView('ALL', MARKETER),
    })

    expect(scope.available).toBe(true)
    expect(scope.evidence).toBe('site')
    if (!scope.available) return
    expect(scope.total).toBeGreaterThan(0)
  })

  it('evidences vehicles from the visible tours of a site-scoped actor', () => {
    const scope = resolveDashboardTruckScope({
      scope: AGENT_WITH_SCOPED_SITE,
      scopedTrucks: getTrucks(AGENT_WITH_SCOPED_SITE),
      scopedTrips: getRouteTripsView('ALL', AGENT_WITH_SCOPED_SITE),
    })

    expect(scope.available).toBe(true)
    expect(scope.evidence).toBe('tours')
    if (!scope.available) return
    expect(scope.total).toBeGreaterThan(0)
  })

  it('never exposes a vehicle outside the actor site set', () => {
    for (const actorScope of [UNSCOPED_AGENT, AGENT_WITH_SCOPED_SITE, MARKETER]) {
      const scope = resolveDashboardTruckScope({
        scope: actorScope,
        scopedTrucks: getTrucks(actorScope),
        scopedTrips: getRouteTripsView('ALL', actorScope),
      })
      if (!scope.available) continue
      const entitled = new Set([...actorScope.siteIds, actorScope.orgId ?? ''])
      for (const truck of scope.trucks) {
        expect(entitled.has(truck.org_id)).toBe(true)
      }
    }
  })

  it('exposes the vehicle rows only when the scope is available', () => {
    const unavailable = resolveDashboardTruckScope({
      scope: UNSCOPED_AGENT,
      scopedTrucks: getTrucks(UNSCOPED_AGENT),
      scopedTrips: getRouteTripsView('ALL', UNSCOPED_AGENT),
    })

    expect(unavailable).not.toHaveProperty('trucks')
  })
})
