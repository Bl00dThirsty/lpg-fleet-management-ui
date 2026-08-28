import { describe, expect, it } from 'vitest'
import { getVisitSummary, getVisits, getVisitsByRegion } from './visits'

describe('visits view-model', () => {
  it('lists client sites with verification status', () => {
    const rows = getVisits()
    expect(rows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.siteName).toBeTruthy()
      expect(row.clientName).toBeTruthy()
      expect(['VERIFIE', 'PENDING']).toContain(row.status)
    }
  })

  it('computes verified/pending summary', () => {
    const summary = getVisitSummary()
    expect(summary.total).toBe(getVisits().length)
    expect(summary.verified + summary.pending).toBe(summary.total)
  })

  it('groups visits by region', () => {
    const byRegion = getVisitsByRegion()
    const total = Object.values(byRegion).reduce((acc, n) => acc + n, 0)
    expect(total).toBe(getVisits().length)
  })
})