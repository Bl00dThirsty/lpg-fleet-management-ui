import { describe, expect, it } from 'vitest'
import { getMarketeurQuotas, getQuotaSummary } from './quotas'

describe('quotas view-model', () => {
  it('computes usage per marketeur', () => {
    const rows = getMarketeurQuotas()
    expect(rows.length).toBeGreaterThanOrEqual(3)
    for (const row of rows) {
      expect(row.marketeurName).toBeTruthy()
      expect(row.usageRate).toBeGreaterThanOrEqual(0)
      expect(row.usageRate).toBeLessThanOrEqual(100)
    }
  })

  it('derives summary aggregates', () => {
    const summary = getQuotaSummary()
    expect(summary.marketeurs).toBe(getMarketeurQuotas().length)
    expect(summary.declared).toBeGreaterThan(0)
    expect(summary.avgUsage).toBeGreaterThanOrEqual(0)
  })
})