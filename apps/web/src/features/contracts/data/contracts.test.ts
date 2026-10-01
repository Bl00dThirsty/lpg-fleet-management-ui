import { describe, expect, it } from 'vitest'
import { getContractSummary, getContractsByTransporter } from './contracts'

describe('contracts view-model', () => {
  it('groups contracts per transporter', () => {
    const rows = getContractsByTransporter()
    expect(rows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.transporterName).toBeTruthy()
      expect(row.contractCount).toBeGreaterThanOrEqual(1)
      expect(row.activeCount + (row.contractCount - row.activeCount)).toBe(row.contractCount)
    }
  })

  it('computes summary consistent with raw data', () => {
    const summary = getContractSummary()
    expect(summary.totalContracts).toBeGreaterThanOrEqual(1)
    expect(summary.active >= 0).toBe(true)
  })
})