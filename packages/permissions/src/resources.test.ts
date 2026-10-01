import { describe, expect, it } from 'vitest'
import { PERMISSION_CATALOG, ROLE_GRANTS, type Role, type PermissionCode } from './index'
import { SCHEMA_TABLES, TABLE_TO_RESOURCE } from './resources'

const ALL_CODES = new Set<string>(PERMISSION_CATALOG.map((e) => e.code))

describe('table→resource completeness', () => {
  it('every schema table maps to a permission resource', () => {
    for (const table of SCHEMA_TABLES) {
      expect(TABLE_TO_RESOURCE[table], `table ${table}`).toBeDefined()
    }
    expect(Object.keys(TABLE_TO_RESOURCE)).toHaveLength(SCHEMA_TABLES.length)
  })

  it('every mapped resource has a read code in the catalog', () => {
    for (const resource of new Set(Object.values(TABLE_TO_RESOURCE))) {
      expect(ALL_CODES.has(`${resource}.read`), `missing ${resource}.read`).toBe(true)
    }
  })

  it('every resource with write columns has write/create codes', () => {
    const writable = new Set([
      'orgs', 'users', 'sites', 'clients', 'trucks', 'drivers', 'devices',
      'rfid', 'contracts', 'pickups', 'tours', 'checkpoints', 'scans',
      'declarations', 'reconciliations', 'redressements',
    ])
    for (const resource of writable) {
      expect(ALL_CODES.has(`${resource}.write`), `missing ${resource}.write`).toBe(true)
    }
    const withCreate = new Set([
      'orgs', 'users', 'sites', 'clients', 'trucks', 'drivers', 'devices',
      'contracts', 'pickups', 'tours',
    ])
    for (const resource of withCreate) {
      expect(ALL_CODES.has(`${resource}.create`), `missing ${resource}.create`).toBe(true)
    }
  })

  it('no grants reference a code missing from the catalog', () => {
    const roles = Object.keys(ROLE_GRANTS) as Role[]
    for (const role of roles) {
      for (const code of ROLE_GRANTS[role] as readonly PermissionCode[]) {
        expect(ALL_CODES.has(code), `${code} in ${role}`).toBe(true)
      }
    }
  })
})
