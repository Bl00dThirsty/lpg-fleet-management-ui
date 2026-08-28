import { describe, it, expect } from 'vitest'
import { computeReconciliation, reconciliationFromDeclaration, sumTrackedVolume } from './reconciliation'
import { declarations } from '@lpg/mock-data'
import type { Declaration } from '@lpg/types'

const decl: Declaration = {
  id: 'decl-test-1',
  marketeur_org_id: 'org-001',
  period_start: '2024-11-01',
  period_end: '2024-11-30',
  declared_volume: 10000,
  status: 'SUBMITTED',
  created_at: '2024-11-01T00:00:00Z',
  updated_at: '2024-11-01T00:00:00Z',
  deleted_at: null,
  created_by: null,
  updated_by: null,
}

describe('computeReconciliation', () => {
  it('computes volume gap and gap percentage', () => {
    const result = computeReconciliation(decl, 9500, 2.5)
    expect(result.declared_volume).toBe(10000)
    expect(result.tracked_volume).toBe(9500)
    expect(result.volume_gap).toBe(500)
    expect(result.gap_pct).toBe(5)
    expect(result.within_tolerance).toBe(false)
    expect(result.subsidy_impact).toBe(500000)
  })

  it('flags within tolerance', () => {
    const result = computeReconciliation(decl, 9900, 2.5)
    expect(result.gap_pct).toBe(1)
    expect(result.within_tolerance).toBe(true)
  })

  it('reads tolerance from settings when not overridden', () => {
    const result = computeReconciliation(decl, 10000)
    expect(result.tolerance_pct).toBe(2.5)
    expect(result.volume_gap).toBe(0)
    expect(result.gap_pct).toBe(0)
    expect(result.within_tolerance).toBe(true)
  })
})

describe('reconciliationFromDeclaration', () => {
  it('builds a reconciliation from declaration', () => {
    const rec = reconciliationFromDeclaration(decl, undefined)
    expect(rec.declaration_id).toBe('decl-test-1')
    expect(rec.status).toBe('PENDING')
    expect(rec.verified_at).toBeNull()
  })

  it('preserves existing status when updating', () => {
    const first = reconciliationFromDeclaration(decl, undefined)
    const updated = reconciliationFromDeclaration(decl, { ...first, status: 'VERIFIED' })
    expect(updated.status).toBe('VERIFIED')
    expect(updated.id).toBe(first.id)
  })
})

describe('sumTrackedVolume', () => {
  it('returns a non-negative number', () => {
    const result = sumTrackedVolume()
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('uses meter_reading from scan events', () => {
    const result = sumTrackedVolume()
    expect(result).toBeGreaterThan(0)
  })
})

describe('declaration integration', () => {
  it('computes reconciliation for first declaration', () => {
    const first = declarations[0]
    if (!first) return
    const result = computeReconciliation(first, 9500)
    expect(result.declaration_id).toBe(first.id)
    expect(result.gap_pct).toBeGreaterThanOrEqual(0)
  })
})