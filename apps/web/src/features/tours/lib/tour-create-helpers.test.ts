import type { AuthUser } from '@lpg/api-client'
import { describe, expect, it } from 'vitest'
import {
  filterTourCrew,
  isTourLivreur,
  buildCheckpointPayload,
  extractUserRoleCodes,
  nextCheckpointSequence,
  toRequestedQuantity,
} from './tour-create-helpers'

describe('3.5 toRequestedQuantity — TM/btl pass-through, never scaled', () => {
  it('returns VRAC tonnes unchanged (5 TM stays 5, not 5000)', () => {
    expect(toRequestedQuantity(5)).toBe(5)
  })

  it('returns bottle counts unchanged', () => {
    expect(toRequestedQuantity(120)).toBe(120)
  })

  it('keeps fractional tonnes', () => {
    expect(toRequestedQuantity(2.5)).toBe(2.5)
  })
})

describe('3.6 extractUserRoleCodes — list vs detail projections', () => {
  it('returns [] for list rows that carry no roles (no invented DRIVER)', () => {
    // mapBackendPersonToUser hands list rows back with role_codes: [] and the
    // LIVREUR fallback on system_role only — the raw row itself has nothing.
    expect(extractUserRoleCodes({ id: 'u-1', first_name: 'A' })).toEqual([])
    expect(extractUserRoleCodes({ id: 'u-1', role_codes: [] })).toEqual([])
  })

  it('reads the detail projection roles array of { roleCode } objects', () => {
    const detail = {
      id: 'abc',
      personId: 'chauffeur.abc1',
      roles: [{ roleCode: 'DRIVER', active: true }],
    }
    expect(extractUserRoleCodes(detail)).toEqual(['DRIVER'])
  })

  it('reads string roles and normalises case', () => {
    expect(extractUserRoleCodes({ roles: ['driver'] })).toEqual(['DRIVER'])
    expect(extractUserRoleCodes({ roles: ['LIVREUR'] })).toEqual(['LIVREUR'])
  })

  it('reads the mapped snake_case projection when present', () => {
    expect(
      extractUserRoleCodes({ role_codes: ['DRIVER'], system_role: 'DRIVER' }),
    ).toEqual(['DRIVER'])
  })

  it('keeps DRIVER and LIVREUR distinct', () => {
    expect(extractUserRoleCodes({ roles: [{ roleCode: 'LIVREUR' }] })).not.toContain('DRIVER')
    expect(extractUserRoleCodes({ roles: [{ roleCode: 'DRIVER' }] })).not.toContain('LIVREUR')
  })

  it('returns [] for non-objects', () => {
    expect(extractUserRoleCodes(null)).toEqual([])
    expect(extractUserRoleCodes('DRIVER')).toEqual([])
  })
})

describe('3.7 buildCheckpointPayload — exclusive destination + operator sequence', () => {
  it('maps a SITE row to { siteId, sequence } (camelCase contract)', () => {
    expect(
      buildCheckpointPayload({ kind: 'SITE', destinationId: 'site-1', sequence: 1, plannedQuantity: 5 }),
    ).toEqual({ siteId: 'site-1', sequence: 1 })
  })

  it('maps a CLIENT_SITE row to { clientSiteId, sequence }', () => {
    expect(
      buildCheckpointPayload({ kind: 'CLIENT_SITE', destinationId: 'cs-9', sequence: 2, plannedQuantity: 3 }),
    ).toEqual({ clientSiteId: 'cs-9', sequence: 2 })
  })

  it('never invents a sequence: rejects 0, negatives and NaN', () => {
    for (const bad of [0, -1, Number.NaN]) {
      expect(() =>
        buildCheckpointPayload({ kind: 'SITE', destinationId: 's', sequence: bad, plannedQuantity: 1 }),
      ).toThrow(/Séquence invalide/)
    }
  })

  it('rejects a row with no destination', () => {
    expect(() =>
      buildCheckpointPayload({ kind: 'SITE', destinationId: '  ', sequence: 1, plannedQuantity: 1 }),
    ).toThrow(/choisissez une destination/)
  })
})

describe('3.7 nextCheckpointSequence', () => {
  it('starts at 1 and follows max(entered) + 1', () => {
    expect(nextCheckpointSequence([])).toBe(1)
    expect(nextCheckpointSequence([{ sequence: 1 }, { sequence: 3 }])).toBe(4)
  })
})


describe('tour crew organization scope', () => {
  const marketer: AuthUser = { id: 'm', email: 'm@test.cm', first_name: 'M', last_name: 'S', system_role: 'MARKETEUR', org_id: 'sctm', org_type: 'MARKETEUR' }
  const rows = [{ id: 's', org_id: 'sctm' }, { id: 't', org_id: 'total' }, { id: 'unknown' }]
  it('restricts each marketer to their organization', () => {
    expect(filterTourCrew(rows, marketer).map((row) => row.id)).toEqual(['s'])
    expect(filterTourCrew(rows, { ...marketer, org_id: 'total' }).map((row) => row.id)).toEqual(['t'])
  })
  it('allows the regulator to see all organizations', () => {
    expect(filterTourCrew(rows, { ...marketer, system_role: 'SUPERVISOR', org_type: 'REGULATEUR' })).toEqual(rows)
  })
  it('fails closed without an authenticated organization', () => {
    expect(filterTourCrew(rows, null)).toEqual([])
    expect(filterTourCrew(rows, { ...marketer, org_id: undefined })).toEqual([])
  })
  it('accepts the organization alias and excludes unavailable personnel', () => {
    expect(filterTourCrew([
      { id: 'alias', organization_id: 'sctm' },
      { id: 'inactive', org_id: 'sctm', is_active: false },
      { id: 'deleted', org_id: 'sctm', deleted_at: '2026-01-01' },
    ], marketer).map((row) => row.id)).toEqual(['alias'])
  })
  it('does not interpret a missing or unrelated role as LIVREUR', () => {
    expect(isTourLivreur({})).toBe(false)
    expect(isTourLivreur({ system_role: 'MARKETEUR' })).toBe(false)
    expect(isTourLivreur({ system_role: 'LIVREUR' })).toBe(true)
  })
})
