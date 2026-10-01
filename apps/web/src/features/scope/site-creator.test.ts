import { describe, expect, it } from 'vitest'
import { scopeBySiteOrCreator, scopeWithOrgId } from './site-creator'
import type { UserScope } from './scope'

const rows = [
  { id: 'a', site_id: 'site-1', org_id: 'org-2', created_by: 'user-7' },
  { id: 'b', site_id: 'site-1', org_id: 'org-2', created_by: 'user-8' },
  { id: 'c', site_id: 'site-2', org_id: 'org-3', created_by: 'user-7' },
]

describe('scopeBySiteOrCreator', () => {
  it('org view returns every row untouched', () => {
    const scope: UserScope = { view: 'org', siteIds: [] }
    expect(scopeBySiteOrCreator(rows, scope, (r) => r.site_id, (r) => r.created_by)).toEqual(rows)
  })

  it('site view keeps rows whose site is in scope or created by the user', () => {
    const scope: UserScope = { view: 'site', siteIds: ['site-1'], userId: 'user-7' }
    const filtered = scopeBySiteOrCreator(rows, scope, (r) => r.site_id, (r) => r.created_by)
    expect(filtered.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('site view with no site match still keeps creator rows', () => {
    const scope: UserScope = { view: 'site', siteIds: ['site-99'], userId: 'user-7' }
    const filtered = scopeBySiteOrCreator(rows, scope, (r) => r.site_id, (r) => r.created_by)
    expect(filtered.map((r) => r.id)).toEqual(['a', 'c'])
  })

  it('site view with neither a matching site nor creator returns empty', () => {
    const scope: UserScope = { view: 'site', siteIds: ['site-99'], userId: 'user-99' }
    expect(scopeBySiteOrCreator(rows, scope, (r) => r.site_id, (r) => r.created_by)).toEqual([])
  })
})

describe('scopeWithOrgId', () => {
  it('adds the org id to the site set so org-keyed rows match', () => {
    const scope: UserScope = { view: 'site', orgId: 'org-2', siteIds: ['site-1'], userId: 'user-99' }
    const extended = scopeWithOrgId(scope)
    expect(extended.siteIds).toContain('org-2')
    const filtered = scopeBySiteOrCreator(rows, extended, (r) => r.org_id, (r) => r.created_by)
    expect(filtered.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('leaves the org view and site-less scopes untouched', () => {
    const orgView: UserScope = { view: 'org', orgId: 'org-2', siteIds: [] }
    expect(scopeWithOrgId(orgView)).toBe(orgView)
    const noOrg: UserScope = { view: 'site', siteIds: ['site-1'] }
    expect(scopeWithOrgId(noOrg)).toBe(noOrg)
  })

  it('does NOT add the org for agent views (assigned sites only)', () => {
    const scope: UserScope = { view: 'agent', orgId: 'org-2', siteIds: ['site-1'], userId: 'user-9' }
    const extended = scopeWithOrgId(scope)
    expect(extended.siteIds).not.toContain('org-2')
    const filtered = scopeBySiteOrCreator(rows, extended, (r) => r.org_id, (r) => r.created_by)
    // No row's org_id is in the site set (site-1 only) → no org-wide rows leak.
    expect(filtered).toEqual([])
  })

  it('does NOT add the org for livreur views (assigned sites only)', () => {
    const scope: UserScope = { view: 'livreur', orgId: 'org-2', siteIds: ['site-1'], userId: 'user-9' }
    const extended = scopeWithOrgId(scope)
    expect(extended.siteIds).not.toContain('org-2')
  })

  it('still adds the org for transporter views', () => {
    const scope: UserScope = {
      view: 'transporter',
      orgId: 'org-2',
      siteIds: ['site-1'],
      userId: 'user-9',
    }
    const extended = scopeWithOrgId(scope)
    expect(extended.siteIds).toContain('org-2')
  })
})
