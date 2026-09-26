import { describe, expect, it } from 'vitest'
import { Route as AdminRoute } from './dashboard-admin'
import { Route as MarketeurRoute } from './dashboard-marketeur'
import { Route as SupervisorRoute } from './dashboard-supervisor'
import { Route as TransporteurRoute } from './dashboard-transporteur'

type RoleDashboardRoute = {
  id?: string
  options?: {
    component?: unknown
    beforeLoad?: (context: { search: unknown }) => never
    validateSearch?: { parse: (search: unknown) => unknown }
  }
}

const roleRoutes: Array<[string, RoleDashboardRoute]> = [
  ['/dashboard-admin/', AdminRoute],
  ['/dashboard-marketeur/', MarketeurRoute],
  ['/dashboard-supervisor/', SupervisorRoute],
  ['/dashboard-transporteur/', TransporteurRoute],
]

function redirectOf(route: RoleDashboardRoute, search: unknown) {
  let thrown: unknown
  try {
    route.options?.beforeLoad?.({ search })
  } catch (error) {
    thrown = error
  }
  return thrown
}

describe('role dashboard routes', () => {
  it.each(roleRoutes)('%s redirects to the national dashboard', (_id, route) => {
    expect(redirectOf(route, {})).toMatchObject({
      options: { to: '/dashboard', statusCode: 307 },
    })
  })

  it.each(roleRoutes)('%s renders no dashboard page of its own', (_id, route) => {
    expect(route.options?.component).toBeUndefined()
  })

  it.each(roleRoutes)('%s carries the dashboard search schema', (_id, route) => {
    expect(route.options?.validateSearch).toBeDefined()
  })

  it.each(roleRoutes)('%s preserves the dashboard query context', (_id, route) => {
    const search = { period: 'monthly', fleet: 'Fleet A' }

    expect(redirectOf(route, search)).toMatchObject({
      options: { to: '/dashboard', search },
    })
  })
})
