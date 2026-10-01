import { describe, expect, it } from 'vitest'
import { getDriverPerformance, getPerformanceSummary } from './performance'

describe('performance view-model', () => {
  it('computes per-driver completion', () => {
    const rows = getDriverPerformance()
    expect(rows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.driverName).toBeTruthy()
      expect(row.completionRate).toBeGreaterThanOrEqual(0)
      expect(row.completionRate).toBeLessThanOrEqual(100)
      expect(row.totalTours).toBe(row.completed + row.inFlight)
    }
  })

  it('derives summary completion rate', () => {
    const summary = getPerformanceSummary()
    expect(summary.drivers).toBe(getDriverPerformance().length)
    expect(summary.avgCompletion).toBeGreaterThanOrEqual(0)
  })
})