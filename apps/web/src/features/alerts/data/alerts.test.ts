import { describe, expect, it } from 'vitest'
import { getInfraAlertSummary, getInfraAlerts } from './alerts'

describe('infra alerts view-model', () => {
  it('builds device and anomaly alerts', () => {
    const alerts = getInfraAlerts()
    expect(alerts.length).toBeGreaterThanOrEqual(1)
    for (const alert of alerts) {
      expect(alert.title).toBeTruthy()
      expect(alert.severityLabel).toBeTruthy()
    }
  })

  it('computes summary by source', () => {
    const summary = getInfraAlertSummary()
    expect(summary.total).toBe(getInfraAlerts().length)
    expect(summary.devices + summary.anomalies).toBe(summary.total)
  })
})