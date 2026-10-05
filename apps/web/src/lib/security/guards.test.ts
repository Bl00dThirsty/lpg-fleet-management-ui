import { describe, expect, it } from 'vitest'
import { hasEffectivePermission } from '@lpg/permissions'
import {
  assertPermission,
  assertSiteAccess,
  canActOnSite,
  assertActorPermission,
} from './guards'

describe('assertPermission', () => {
  it('throws PERMISSION_DENIED without the code', () => {
    expect(() => assertPermission('LIVREUR', 'trucks.create')).toThrow(
      'PERMISSION_DENIED'
    )
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
    expect(() => assertSiteAccess(siteScope, 'site-9')).toThrow(
      'PERMISSION_DENIED'
    )
  })
})

describe('effective permissions', () => {
  const grant = { is_active: true, permissions_json: { 'pickups.write': true } }
  it('combines base grants and active custom grants', () => {
    expect(hasEffectivePermission('MARKETEUR', 'pickups.create')).toBe(true)
    expect(hasEffectivePermission('LIVREUR', 'pickups.create', [grant])).toBe(
      true
    )
    expect(() =>
      assertActorPermission(
        { system_role: 'LIVREUR', custom_roles: [grant] },
        'pickups.create'
      )
    ).not.toThrow()
  })
  it('rejects inactive, deleted and read-only grants for creation', () => {
    for (const custom of [
      { ...grant, is_active: false },
      { ...grant, deleted_at: '2026-10-01' },
      { ...grant, permissions_json: { 'pickups.read': true } },
    ]) {
      expect(
        hasEffectivePermission('LIVREUR', 'pickups.create', [custom])
      ).toBe(false)
      expect(() =>
        assertActorPermission(
          { system_role: 'LIVREUR', custom_roles: [custom] },
          'pickups.create'
        )
      ).toThrow('PERMISSION_DENIED')
    }
  })
})
