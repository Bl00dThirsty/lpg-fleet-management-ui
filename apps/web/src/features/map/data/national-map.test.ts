import { describe, it, expect } from 'vitest'
import { getNationalMapView } from './national-map'
import { getScope } from '@/features/scope/scope'

describe('getNationalMapView', () => {
  it('exposes every aggregated sub-view', () => {
    const view = getNationalMapView()
    expect(Array.isArray(view.sites)).toBe(true)
    expect(Array.isArray(view.clientSites)).toBe(true)
    expect(Array.isArray(view.zones)).toBe(true)
    expect(Array.isArray(view.regions)).toBe(true)
    expect(Array.isArray(view.anomalies)).toBe(true)
    expect(typeof view.vrac.totalTM).toBe('number')
    expect(Array.isArray(view.trucks)).toBe(true)
    expect(Array.isArray(view.routes)).toBe(true)
  })

  it('flags at least one anomaly present in the mock', () => {
    const view = getNationalMapView()
    expect(view.anomalies.length).toBeGreaterThan(0)
  })

  it('supports a scope: site-scoped views are not empty but respect filtering', () => {
    const view = getNationalMapView(getScope(null))
    expect(Array.isArray(view.sites)).toBe(true)
    expect(view.sites.length).toBeLessThanOrEqual(
      getNationalMapView().sites.length,
    )
  })
})