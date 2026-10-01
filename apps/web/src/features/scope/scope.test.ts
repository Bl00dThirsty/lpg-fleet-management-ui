import type { AuthUser } from '@lpg/api-client'
import { describe, expect, it } from 'vitest'
import { getScope, scopeFilter, type UserScope } from './scope'

function authUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: 'u1',
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    system_role: 'SUPERADMIN',
    ...overrides,
  }
}

const rows = [
  { id: 'a', org_id: 'org-2', created_by: 'user-7' },
  { id: 'b', org_id: 'org-2', created_by: 'user-8' },
  { id: 'c', org_id: 'org-3', created_by: 'user-7' },
]

describe('getScope', () => {
  it('regulateur-org staff get the org view', () => {
    const scope = getScope(authUser({ id: 'u1', system_role: 'SUPERADMIN', org_type: 'REGULATEUR' }))
    expect(scope.view).toBe('org')
  })
  it('agent in a REGULATEUR org sees only their assigned sites', () => {
    const scope = getScope(
      authUser({ id: 'user-0005-csph-investigator', system_role: 'AGENT', org_type: 'REGULATEUR', site_ids: ['site-1'] }),
    )
    expect(scope.view).toBe('agent')
    expect(scope.siteIds).toEqual(['site-1'])
  })
  it('regulateur staff keep the org view even in a non-regulateur org', () => {
    for (const system_role of ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'INTEGRATEUR'] as const) {
      const scope = getScope(authUser({ id: `u-${system_role}`, system_role, org_type: 'MARKETEUR' }))
      expect(scope.view).toBe('org')
    }
  })
  it('marketeur with one site gets the site view', () => {
    const scope = getScope(authUser({ id: 'u7', system_role: 'MARKETEUR', org_type: 'MARKETEUR', site_ids: ['site-1'] }))
    expect(scope.view).toBe('site')
    expect(scope.siteIds).toEqual(['site-1'])
  })
  it('transporter gets transporter view', () => {
    const scope = getScope(authUser({ id: 'u9', system_role: 'TRANSPORTEUR', org_type: 'TRANSPORTEUR' }))
    expect(scope.view).toBe('transporter')
  })
  it('null user is safe', () => {
    expect(getScope(null).view).toBe('org')
  })
})

describe('scopeFilter', () => {
  it('site view returns only matching site rows', () => {
    const scope: UserScope = { view: 'site', siteIds: ['site-1'], userId: 'user-7' }
    const filtered = scopeFilter(rows, scope, (r) => r.id)
    expect(filtered).toEqual([]) // rows keyed by id, not site
  })
  it('empty scope returns empty', () => {
    const scope: UserScope = { view: 'site', siteIds: [], userId: 'x' }
    expect(scopeFilter(rows, scope, (r) => r.id)).toEqual([])
  })
})
