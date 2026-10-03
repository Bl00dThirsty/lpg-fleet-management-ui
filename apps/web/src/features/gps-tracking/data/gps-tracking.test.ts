import { describe, expect, it } from 'vitest'
import { getGpsTrackSummary, getGpsTracks } from './gps-tracking'

describe('gps-tracking view-model', () => {
  it('lists GPS devices with positions', () => {
    const tracks = getGpsTracks()
    expect(tracks.length).toBeGreaterThanOrEqual(1)
    for (const track of tracks) {
      expect(track.serial).toBeTruthy()
      const located = track.position != null
      expect(located ? track.lat !== '—' : track.lat === '—').toBe(true)
    }
  })

  it('computes located vs unlocated summary', () => {
    const summary = getGpsTrackSummary()
    expect(summary.total).toBe(getGpsTracks().length)
    expect(summary.located + summary.unlocated).toBe(summary.total)
  })
})