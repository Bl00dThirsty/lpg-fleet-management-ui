import { describe, expect, it } from 'vitest'
import { getRedressements, getRedressementSummary, redressementStatusLabels } from './redressements'

describe('redressements view-model', () => {
  it('returns redressements with linked reconciliation', () => {
    const rows = getRedressements()
    expect(rows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.reconciliation_reference).toMatch(/^REC-\d{3}$/)
    }
  })

  it('formats amounts and labels', () => {
    const rows = getRedressements()
    expect(rows[0]!.amount_label).toContain('XAF')
    expect(redressementStatusLabels.ISSUED).toBe('Émis')
  })

  it('summarizes outstanding amounts', () => {
    const summary = getRedressementSummary(getRedressements())
    expect(summary.issued + summary.paid + summary.waived).toBe(summary.total)
    expect(summary.totalOutstanding).toBeGreaterThanOrEqual(0)
  })
})