import { describe, it, expect } from 'vitest'
import { getInitialLayers, type MapLayerKey } from './layers'

describe('getInitialLayers', () => {
  it('exposes a boolean toggle per layer', () => {
    const layers = getInitialLayers()
    expect(Object.keys(layers)).toHaveLength(8)
    for (const key of Object.keys(layers) as MapLayerKey[]) {
      expect(typeof layers[key]).toBe('boolean')
    }
  })
  it('shows sites, clientSites, zoneBoundaries, anomalies, trucks by default; hides countryBoundaries, checkpoints, heatmap', () => {
    const layers = getInitialLayers()
    expect(layers.sites).toBe(true)
    expect(layers.clientSites).toBe(true)
    expect(layers.zoneBoundaries).toBe(true)
    expect(layers.anomalies).toBe(true)
    expect(layers.trucks).toBe(true)
    expect(layers.countryBoundaries).toBe(false)
    expect(layers.checkpoints).toBe(false)
    expect(layers.heatmap).toBe(false)
  })
})
