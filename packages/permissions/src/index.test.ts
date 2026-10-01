import { describe, it, expect } from 'vitest'
import {
  PERMISSION_CATALOG,
  PERMISSION_CATEGORIES,
  ROLE_GRANTS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  HIERARCHY_LEVEL,
  ROLES,
  can,
  hasPermission,
  defineAbilitiesFor,
  defineAbilityFor,
  parseCode,
  getCreatableRoles,
  canCreate,
} from './index'

const ALL_CODES = new Set(PERMISSION_CATALOG.map((e) => e.code))

describe('catalog integrity', () => {
  it('defines exactly 161 codes across 9 categories', () => {
    expect(PERMISSION_CATALOG).toHaveLength(161)
    expect(new Set(PERMISSION_CATALOG.map((e) => e.category))).toHaveLength(9)
    expect(PERMISSION_CATEGORIES).toHaveLength(9)
  })

  it('has no duplicate codes', () => {
    const codes = PERMISSION_CATALOG.map((e) => e.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('every code is resource.action and resolvable', () => {
    for (const entry of PERMISSION_CATALOG) {
      expect(entry.code).toMatch(/^[a-z-]+\.[a-z]+$/)
      expect(() => parseCode(entry.code)).not.toThrow()
      const { resource, action } = parseCode(entry.code)
      expect(resource).toBeTruthy()
      expect(action).toBeTruthy()
    }
  })

  it('produces the expected category counts', () => {
    const counts = Object.fromEntries(
      PERMISSION_CATEGORIES.map((c) => [
        c.id,
        PERMISSION_CATALOG.filter((e) => e.category === c.id).length,
      ])
    )
    expect(counts).toEqual({
      identity: 16,
      governance: 26,
      sites: 13,
      fleet: 26,
      supply: 9,
      tours: 19,
      compliance: 14,
      risk: 15,
      reporting: 23,
    })
  })
})

describe('grants', () => {
  it('covers every role with all required maps', () => {
    for (const role of ROLES) {
      expect(ROLE_GRANTS[role]).toBeDefined()
      expect(ROLE_LABELS[role]).toBeTruthy()
      expect(ROLE_DESCRIPTIONS[role]).toBeTruthy()
      expect(HIERARCHY_LEVEL[role]).toBeGreaterThan(0)
    }
    expect(ROLES).toContain('LIVREUR')
    expect(Object.keys(ROLE_GRANTS)).toHaveLength(ROLES.length)
  })

  it('SUPERADMIN holds every code in the catalog', () => {
    expect(new Set(ROLE_GRANTS.SUPERADMIN)).toEqual(ALL_CODES)
  })

  it('every granted code exists in the catalog', () => {
    for (const role of ROLES) {
      for (const code of ROLE_GRANTS[role]) {
        expect(ALL_CODES.has(code), `${code} in ${role}`).toBe(true)
      }
    }
  })
})

describe('can', () => {
  it('SUPERADMIN can read users', () => {
    expect(can('SUPERADMIN', 'read', 'users')).toBe(true)
  })

  it('LIVREUR reads missions but not reports', () => {
    expect(can('LIVREUR', 'read', 'missions')).toBe(true)
    expect(can('LIVREUR', 'read', 'reports')).toBe(false)
  })

  it('manage implies read/write/delete', () => {
    expect(can('MARKETEUR', 'read', 'trucks')).toBe(true)
    expect(can('MARKETEUR', 'write', 'trucks')).toBe(true)
    expect(can('MARKETEUR', 'create', 'trucks')).toBe(true)
    expect(can('MARKETEUR', 'delete', 'trucks')).toBe(true)
  })

  it('AGENT validates but not manages declarations', () => {
    expect(can('AGENT', 'validate', 'declarations')).toBe(true)
    expect(can('AGENT', 'delete', 'declarations')).toBe(false)
  })

  it('TRANSPORTEUR manages livreurs but cannot manage users', () => {
    expect(can('TRANSPORTEUR', 'manage', 'livreurs')).toBe(true)
    expect(can('TRANSPORTEUR', 'read', 'users')).toBe(false)
  })

  it('hasPermission matches can', () => {
    expect(hasPermission('ADMIN', 'users.reset')).toBe(true)
    expect(hasPermission('SUPERVISOR', 'reports.export')).toBe(true)
    expect(hasPermission('INTEGRATEUR', 'pda.sync')).toBe(true)
  })
})

describe('abilities', () => {
  it('GUEST denies everything', () => {
    const ability = defineAbilitiesFor('GUEST')
    expect(ability.can('read', 'users')).toBe(false)
  })

  it('SUPERADMIN ability allows read users', () => {
    expect(defineAbilityFor('SUPERADMIN').can('read', 'users')).toBe(true)
  })
})

describe('CRUD codes for M3', () => {
  it('ADMIN can create and delete drivers', () => {
    expect(can('ADMIN', 'create', 'drivers')).toBe(true)
    expect(can('ADMIN', 'delete', 'drivers')).toBe(true)
  })
  it('ADMIN can create and delete devices', () => {
    expect(can('ADMIN', 'create', 'devices')).toBe(true)
    expect(can('ADMIN', 'delete', 'devices')).toBe(true)
  })
  it('ADMIN can create and delete sites', () => {
    expect(can('ADMIN', 'create', 'sites')).toBe(true)
    expect(can('ADMIN', 'delete', 'sites')).toBe(true)
  })
  it('MARKETEUR can create and delete drivers (own fleet)', () => {
    expect(can('MARKETEUR', 'create', 'drivers')).toBe(true)
    expect(can('MARKETEUR', 'delete', 'drivers')).toBe(true)
  })
  it('INTEGRATEUR can create and delete devices', () => {
    expect(can('INTEGRATEUR', 'create', 'devices')).toBe(true)
    expect(can('INTEGRATEUR', 'delete', 'devices')).toBe(true)
  })
})

describe('hierarchy', () => {
  it('SUPERADMIN can create everyone; LIVREUR nobody', () => {
    for (const role of ROLES) expect(canCreate('SUPERADMIN', role)).toBe(true)
    expect(getCreatableRoles('SUPERADMIN')).toHaveLength(ROLES.length)
    expect(getCreatableRoles('LIVREUR')).toEqual(['LIVREUR'])
  })

  it('ADMIN cannot create SUPERADMIN', () => {
    expect(canCreate('ADMIN', 'SUPERADMIN')).toBe(false)
    expect(canCreate('ADMIN', 'ADMIN')).toBe(true)
    expect(canCreate('ADMIN', 'LIVREUR')).toBe(true)
  })
})