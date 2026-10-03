import { describe, expect, it } from 'vitest'
import { getInfraDashboards } from './infra'

describe('infra dashboards view-model', () => {
  it('lists grafana dashboard placeholders', () => {
    const dashboards = getInfraDashboards()
    expect(dashboards.length).toBeGreaterThanOrEqual(3)
    for (const dashboard of dashboards) {
      expect(dashboard.title).toBeTruthy()
      expect(dashboard.description).toBeTruthy()
    }
  })
})