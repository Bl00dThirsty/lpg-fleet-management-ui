import { describe, expect, it } from 'vitest'
import type { ZodType } from 'zod'
import { Route as DashboardRoute } from './index'
import { Route as FleetDetailRoute } from './fleets/$fleetName'
import { Route as ReserveRoute } from './sites/$siteId'
import { parseDashboardSearch } from '@/features/dashboard/data/dashboard-query'

type SearchSchema = ZodType<{ period: string }>

function schemaOf(route: {
  options?: { validateSearch?: unknown }
}): SearchSchema {
  const validate = route.options?.validateSearch
  if (!validate || typeof (validate as SearchSchema).parse !== 'function') {
    throw new Error('route does not validate its search payload')
  }
  return validate as SearchSchema
}

describe('dashboard search contract', () => {
  it('validates the dashboard search so period, fleet and range travel in the URL', () => {
    expect(
      schemaOf(DashboardRoute).parse({
        period: 'monthly',
        fleet: 'Fleet A',
        from: '2026-01-05',
        to: '2026-01-31',
      }),
    ).toEqual({
      period: 'monthly',
      fleet: 'Fleet A',
      from: '2026-01-05',
      to: '2026-01-31',
    })
  })

  it('validates the same payload on the fleet detail route', () => {
    expect(
      schemaOf(FleetDetailRoute).parse({ period: 'weekly', fleet: 'Fleet A' }),
    ).toEqual({ period: 'weekly', fleet: 'Fleet A' })
  })

  it('rejects an unknown period instead of rendering it', () => {
    expect(() => schemaOf(DashboardRoute).parse({ period: 'yearly' })).toThrow()
  })

  it('restores the originating query context on the way back', () => {
    const context = {
      period: 'monthly',
      fleet: 'Fleet A',
      from: '2026-01-05',
      to: '2026-01-31',
    }

    expect(
      parseDashboardSearch(
        schemaOf(FleetDetailRoute).parse(context) as never,
      ),
    ).toEqual(
      parseDashboardSearch(schemaOf(DashboardRoute).parse(context) as never),
    )
  })
})

describe('unsupported reserve route', () => {
  it('still redirects to the dashboard instead of rendering reserve details', () => {
    let thrown: unknown
    try {
      ReserveRoute.options.beforeLoad?.({} as never)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toMatchObject({
      options: { to: '/dashboard', statusCode: 307 },
    })
  })
})
