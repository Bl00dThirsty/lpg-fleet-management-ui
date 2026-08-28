import { describe, it, expect } from 'vitest'
import { aggregateVracVolume } from './vrac-volume'

describe('aggregateVracVolume', () => {
  it('returns a finite TM total', () => {
    const summary = aggregateVracVolume()
    expect(typeof summary.totalTM).toBe('number')
    expect(Number.isFinite(summary.totalTM)).toBe(true)
    expect(summary.totalTM).toBeGreaterThanOrEqual(0)
  })

  it('never reports kg', () => {
    const summary = aggregateVracVolume()
    expect(summary.unit).toBe('TM')
  })
})
