import { describe, expect, it } from 'vitest'
import { getServiceHealthSummary, getSystemHealth, systemHealthLabels } from './system-health'

describe('system-health view-model', () => {
  it('builds a service health matrix', () => {
    const health = getSystemHealth()
    expect(health.services.length).toBeGreaterThanOrEqual(4)
    for (const service of health.services) {
      expect(service.name).toBeTruthy()
      expect(service.statusLabel).toBeTruthy()
    }
  })

  it('derives overall status from services', () => {
    const health = getSystemHealth()
    const counts = health.services.reduce(
      (acc, s) => {
        acc[s.status] += 1
        return acc
      },
      { OPERATIONAL: 0, DEGRADED: 0, CRITICAL: 0 },
    )
    expect(health.operational).toBe(counts.OPERATIONAL)
    expect(health.degraded).toBe(counts.DEGRADED)
    expect(health.critical).toBe(counts.CRITICAL)
  })

  it('maps overall to a label', () => {
    const summary = getServiceHealthSummary()
    expect(Object.values(systemHealthLabels)).toContain(summary.overallLabel)
  })
})