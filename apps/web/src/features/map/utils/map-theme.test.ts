import { describe, it, expect } from 'vitest'
import {
  getArcgisBasemap,
  getArcgisViewTheme,
  getMarkerOutlineColor,
  getSiteOutlineColor,
  rgbaFromTuple,
} from './map-theme'

describe('map-theme', () => {
  it('returns dark basemap for dark theme', () => {
    expect(getArcgisBasemap('dark')).toBe('dark-gray-vector')
  })
  it('returns streets-navigation-vector for light theme', () => {
    expect(getArcgisBasemap('light')).toBe('streets-navigation-vector')
  })
  it('outline colors are 4-tuples', () => {
    expect(getMarkerOutlineColor('light', true)).toHaveLength(4)
    expect(getSiteOutlineColor('dark')).toHaveLength(4)
  })
  it('rgbaFromTuple renders RGBA', () => {
    expect(rgbaFromTuple([10, 20, 30, 0.5])).toBe('rgba(10, 20, 30, 0.5)')
  })
  it('view theme exposes accent + text', () => {
    expect(getArcgisViewTheme('dark').accentColor).toBeTruthy()
    expect(getArcgisViewTheme('light').textColor).toBeTruthy()
  })
})
