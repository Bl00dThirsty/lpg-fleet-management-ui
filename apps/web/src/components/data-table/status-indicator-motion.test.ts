/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { isTransientStatus, pingDotClasses, TRANSIENT_STATUSES } from './status-indicator-motion'

describe('TRANSIENT_STATUSES', () => {
  it('only lists statuses that change on their own without user action', () => {
    expect([...TRANSIENT_STATUSES].sort()).toEqual(['PENDINGSYNC', 'SYNCING'])
  })
})

describe('isTransientStatus', () => {
  it('is true for a syncing status', () => {
    expect(isTransientStatus('SYNCING')).toBe(true)
  })

  it('is true for a pending sync status', () => {
    expect(isTransientStatus('PENDINGSYNC')).toBe(true)
  })

  it('is false for a settled status', () => {
    expect(isTransientStatus('ACTIVE')).toBe(false)
  })

  it('is false for a failure status', () => {
    expect(isTransientStatus('SYNCFAILED')).toBe(false)
  })

  it('is false for an unknown status', () => {
    expect(isTransientStatus('NOT_A_STATUS')).toBe(false)
  })

  it('is false for a missing status', () => {
    expect(isTransientStatus(undefined)).toBe(false)
  })

  it('is case sensitive, so a lowercase status does not match', () => {
    expect(isTransientStatus('syncing')).toBe(false)
  })
})

describe('pingDotClasses', () => {
  it('returns null when the indicator does not pulse', () => {
    expect(pingDotClasses('bg-emerald-500', false)).toBeNull()
  })

  it('keeps the tone colour and animation when pulsing', () => {
    const classes = pingDotClasses('bg-rose-500', true)
    expect(classes).toContain('bg-rose-500')
    expect(classes).toContain('animate-ping')
  })

  it('hides the ping layer under reduced motion', () => {
    expect(pingDotClasses('bg-rose-500', true)).toContain('motion-reduce:hidden')
  })
})
