import { describe, expect, it } from 'vitest'
import { getReconciliations, getReconciliationSummary, reconciliationStatusLabels } from './reconciliations'

describe('reconciliations view-model', () => {
  it('returns reconciliations with linked declaration and gap', () => {
    const rows = getReconciliations()
    expect(rows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.declaration_reference).toMatch(/^DEC-\d{3}$/)
      expect(row.gap_percentage).toBeGreaterThanOrEqual(0)
    }
  })

  it('summarizes buckets and monetary impact', () => {
    const summary = getReconciliationSummary(getReconciliations())
    const sum = summary.pending + summary.verified + summary.redressement
    expect(sum).toBe(summary.total)
    expect(summary.totalGap).toBeGreaterThanOrEqual(0)
    expect(summary.totalSubsidy).toBeGreaterThanOrEqual(0)
  })

  it('labels statuses', () => {
    expect(reconciliationStatusLabels.VERIFIED).toBe('Vérifiée')
  })
})