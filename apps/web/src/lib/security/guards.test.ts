import { describe, expect, it } from 'vitest'
import { assertPermission, assertSiteAccess, canActOnSite } from './guards'

describe('assertPermission', () => {
  it('throws PERMISSION_DENIED without the code', () => {
    expect(() => assertPermission('LIVREUR', 'trucks.create')).toThrow('PERMISSION_DENIED')
  })
  it('passes with the code', () => {
    expect(() => assertPermission('MARKETEUR', 'tours.create')).not.toThrow()
  })
})

describe('site access', () => {
  const siteScope = { view: 'site' as const, siteIds: ['site-1'], userId: 'u1' }
  it('allows a site in scope', () => {
    expect(canActOnSite(siteScope, 'site-1')).toBe(true)
  })
  it('denies a site out of scope', () => {
    expect(canActOnSite(siteScope, 'site-9')).toBe(false)
  })
  it('org view allows anything', () => {
    const orgScope = { view: 'org' as const, siteIds: [], userId: 'u2' }
    expect(canActOnSite(orgScope, 'site-9')).toBe(true)
  })
  it('assertSiteAccess throws for out-of-scope site', () => {
    expect(() => assertSiteAccess(siteScope, 'site-9')).toThrow('PERMISSION_DENIED')
  })
})
