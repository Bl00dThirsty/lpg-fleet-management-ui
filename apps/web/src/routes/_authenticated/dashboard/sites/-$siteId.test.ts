import { describe, expect, it } from 'vitest'
import { Route } from './$siteId'

describe('unsupported reserve-site route', () => {
  it('redirects to the dashboard instead of rendering reserve details', () => {
    let thrown: unknown
    try {
      Route.options.beforeLoad?.({} as never)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toMatchObject({
      options: { to: '/dashboard', statusCode: 307 },
    })
  })
})
