import { describe, expect, it } from 'vitest'
import { getIntegrationSummary, getIntegrations } from './integrations'

describe('integrations view-model', () => {
  it('maps integration auth records', () => {
    const integrations = getIntegrations()
    expect(integrations.length).toBeGreaterThanOrEqual(1)
    for (const integration of integrations) {
      expect(integration.serviceName).toBeTruthy()
      expect(integration.successCount).toBeGreaterThanOrEqual(0)
    }
  })

  it('computes summary', () => {
    const summary = getIntegrationSummary()
    expect(summary.total).toBe(getIntegrations().length)
    expect(summary.totalSuccess).toBeGreaterThanOrEqual(0)
  })
})