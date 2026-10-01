import { describe, expect, it } from 'vitest'
import { getTransporterContracts, getTransporterContractSummary } from './transporter-contracts'

describe('transporter-contracts view-model', () => {
  it('returns contracts with resolved orgs', () => {
    const rows = getTransporterContracts()
    expect(rows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.marketeur_name).toBeTruthy()
      expect(row.transporter_name).toBeTruthy()
      expect(row.reference).toMatch(/^CTR-/)
    }
  })

  it('summarizes derived active, pending, and primary contracts', () => {
    const summary = getTransporterContractSummary(getTransporterContracts())
    expect(summary.active).toBeGreaterThanOrEqual(0)
    expect(summary.pending).toBeGreaterThanOrEqual(0)
    expect(summary.active + summary.pending).toBeLessThanOrEqual(summary.total)
    expect(summary.primary).toBeGreaterThanOrEqual(0)
  })
})
