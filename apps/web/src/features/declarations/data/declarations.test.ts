import { describe, expect, it } from 'vitest'
import { getDeclarations, getDeclarationSummary, declarationStatusLabels } from './declarations'

describe('declarations view-model', () => {
  it('returns all declarations with resolved org and labels', () => {
    const rows = getDeclarations()
    expect(rows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.marketeur_name).toBeTruthy()
      expect(row.status_label).toBeTruthy()
      expect(row.period).toMatch(/ au /)
    }
  })

  it('labels every status', () => {
    expect(declarationStatusLabels.DRAFT).toBeTruthy()
    expect(declarationStatusLabels.SUBMITTED).toBeTruthy()
  })

  it('summarizes buckets', () => {
    const summary = getDeclarationSummary(getDeclarations())
    const sum = summary.draft + summary.submitted + summary.reconciled + summary.disputed
    expect(sum).toBe(summary.total)
  })
})