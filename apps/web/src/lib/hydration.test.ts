import { describe, expect, it } from 'vitest'
import { HYDRATION_STALE_MS, isHydrationFresh } from './hydration'

describe('isHydrationFresh', () => {
  it('is false when never hydrated (0)', () => {
    expect(isHydrationFresh(0, 1_000_000)).toBe(false)
  })

  it('is true just after hydration', () => {
    const now = 1_000_000
    expect(isHydrationFresh(now - 1_000, now)).toBe(true)
  })

  it('is false once the window elapsed', () => {
    const now = 1_000_000
    expect(isHydrationFresh(now - HYDRATION_STALE_MS - 1, now)).toBe(false)
  })

  it('is false exactly at the boundary', () => {
    const now = 1_000_000
    expect(isHydrationFresh(now - HYDRATION_STALE_MS, now)).toBe(false)
  })
})
