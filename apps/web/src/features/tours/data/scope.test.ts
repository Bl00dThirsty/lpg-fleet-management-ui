import { describe, expect, it } from 'vitest'
import { curated } from '@lpg/mock-data'
import { agentScopedMarketeurOrgIds, followUpFor } from './scope'

describe('follow-up scoping', () => {
  it('SUPERADMIN sees every tournee', () => {
    expect(followUpFor({ role: 'SUPERADMIN' }).length).toBe(curated.delivery_tours.length)
  })

  it('AGENT with no assignments degrades gracefully', () => {
    const tours = followUpFor({ role: 'AGENT', userId: 'no-assignments-user' })
    expect(tours.length).toBeGreaterThan(0)
    expect(new Set(tours.map((t) => t.id)).size).toBe(tours.length)
  })

  it('MARKETEUR is constrained to its own org (or all when empty)', () => {
    const orgId = curated.delivery_tours[0]!.marketeur_org_id
    const own = curated.delivery_tours.filter((t) => t.marketeur_org_id === orgId)
    const tours = followUpFor({ role: 'MARKETEUR', orgId })
    expect(tours.length).toBe(own.length || curated.delivery_tours.length)
  })

  it('agentScopedMarketeurOrgIds returns a string array (possibly empty)', () => {
    expect(Array.isArray(agentScopedMarketeurOrgIds(undefined))).toBe(true)
    expect(Array.isArray(agentScopedMarketeurOrgIds('some-user'))).toBe(true)
  })
})
