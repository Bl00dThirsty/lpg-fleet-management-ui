import { describe, it, expect } from 'vitest'
import { getInitialLayers, buildLayerSpecs, type MapLayerKey } from './layers'
import { getNationalMapView } from '../data/national-map'
import type { MapTheme } from '../utils/map-theme'

const theme: MapTheme = 'light'

describe('getInitialLayers', () => {
  it('exposes a boolean toggle per layer', () => {
    const layers = getInitialLayers()
    expect(Object.keys(layers)).toHaveLength(7)
    for (const key of Object.keys(layers) as MapLayerKey[]) {
      expect(typeof layers[key]).toBe('boolean')
    }
  })
  it('shows sites, clientSites, regions, vrac, routes by default; hides zones + anomalies', () => {
    const layers = getInitialLayers()
    expect(layers.sites).toBe(true)
    expect(layers.clientSites).toBe(true)
    expect(layers.regions).toBe(true)
    expect(layers.vrac).toBe(true)
    expect(layers.routes).toBe(true)
    expect(layers.zones).toBe(false)
    expect(layers.anomalies).toBe(false)
  })
})

describe('buildLayerSpecs', () => {
  it('emits one spec per enabled layer', () => {
    const view = getNationalMapView()
    const layers = getInitialLayers()
    const specs = buildLayerSpecs(view, theme, layers)
    const enabled = (Object.keys(layers) as MapLayerKey[]).filter((k) => layers[k])
    expect(specs.length).toBe(enabled.length)
    expect(specs.every((s) => s.enabled)).toBe(true)
  })
  it('content callbacks are functions; markers carry an icon', () => {
    const specs = buildLayerSpecs(getNationalMapView(), theme, getInitialLayers())
    for (const spec of specs) {
      expect(typeof spec.content).toBe('function')
      expect(typeof spec.marker.icon).toBe('string')
    }
  })
})
