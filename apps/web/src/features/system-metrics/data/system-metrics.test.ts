import { describe, expect, it } from 'vitest'
import { getMetricGroups, getSystemMetrics } from './system-metrics'

describe('system-metrics view-model', () => {
  it('builds a metric card set', () => {
    const metrics = getSystemMetrics()
    expect(metrics.length).toBeGreaterThanOrEqual(6)
    for (const metric of metrics) {
      expect(metric.label).toBeTruthy()
      expect(metric.value).toBeTruthy()
    }
  })

  it('groups operations and health metrics', () => {
    const groups = getMetricGroups()
    expect(groups.operations.length).toBeGreaterThanOrEqual(2)
    expect(groups.health.length).toBeGreaterThanOrEqual(2)
  })
})