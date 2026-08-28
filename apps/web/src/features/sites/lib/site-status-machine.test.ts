import { describe, expect, it } from 'vitest'
import { canTransition, type SiteStatus } from './site-status-machine'
import type { SiteFunction } from '@lpg/types'

const baseRow = (status: SiteStatus) => ({
  id: 's-1',
  name: 'Site test',
  status,
  region: 'CENTRE' as const,
  functions: [] as SiteFunction[],
  delivery_count: 0,
  geo_confidence_score: 0,
  is_client_site: false,
})

describe('canTransition', () => {
  it('AGENT can verify an ASSIGNED site', () => {
    const out = canTransition(baseRow('ASSIGNED'), 'AGENT', { kind: 'verify' })
    expect(out).toEqual({ ok: true, nextStatus: 'VERIFIED' })
  })

  it('AGENT can verify an ACTIVE site', () => {
    const out = canTransition(baseRow('ACTIVE'), 'AGENT', { kind: 'verify' })
    expect(out).toEqual({ ok: true, nextStatus: 'VERIFIED' })
  })

  it('MARKETEUR cannot verify (only AGENT/ADMIN/SUPERADMIN)', () => {
    const out = canTransition(baseRow('ASSIGNED'), 'MARKETEUR', { kind: 'verify' })
    expect(out.ok).toBe(false)
    expect(out.reason).toMatch(/role/i)
  })

  it('SUPERADMIN/ADMIN/AGENT can suspend from any state', () => {
    for (const status of ['UNASSIGNED','ASSIGNED','ACTIVE','VERIFIED'] as const) {
      const out = canTransition(baseRow(status), 'ADMIN', {
        kind: 'suspend',
        reason: 'evidence of fraud',
      })
      expect(out).toEqual({ ok: true, nextStatus: 'SUSPENDED' })
    }
  })

  it('MARKETEUR cannot suspend', () => {
    const out = canTransition(baseRow('ACTIVE'), 'MARKETEUR', {
      kind: 'suspend',
      reason: 'test',
    })
    expect(out.ok).toBe(false)
  })

  it('reject requires a non-empty reason', () => {
    const out = canTransition(baseRow('ACTIVE'), 'AGENT', { kind: 'reject', reason: '' })
    expect(out.ok).toBe(false)
    expect(out.reason).toMatch(/reason/i)
  })

  it('cannot verify a SUSPENDED row', () => {
    const out = canTransition(baseRow('SUSPENDED'), 'AGENT', { kind: 'verify' })
    expect(out.ok).toBe(false)
  })
})
