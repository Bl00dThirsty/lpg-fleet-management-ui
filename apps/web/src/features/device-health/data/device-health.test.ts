import { describe, expect, it } from 'vitest'
import { getDeviceHealth, getDeviceHealthSummary } from './device-health'

describe('device-health view-model', () => {
  it('lists devices needing attention', () => {
    const rows = getDeviceHealth()
    for (const row of rows) {
      expect(row.serial).toBeTruthy()
      expect(row.issue).toBeTruthy()
      expect(row.typeLabel).toBeTruthy()
    }
  })

  it('computes summary consistent with attention list', () => {
    const summary = getDeviceHealthSummary()
    const rows = getDeviceHealth()
    expect(summary.attention).toBe(rows.length)
    expect(summary.total).toBeGreaterThanOrEqual(summary.attention)
    expect(summary.operational).toBe(summary.total - summary.attention)
  })
})