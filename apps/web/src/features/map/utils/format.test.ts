import { describe, it, expect } from 'vitest'
import { formatTm, formatBtl, formatPercent } from './format'

const NARROW_NO_BREAK_SPACE = '\u202f'

describe('formatTm', () => {
  it('formats a VRAC volume in TM with French separators', () => {
    expect(formatTm(1234.5)).toBe(`1${NARROW_NO_BREAK_SPACE}234,5 TM`)
  })
  it('returns the em-dash for non-finite values', () => {
    expect(formatTm(Number.NaN)).toBe('—')
    expect(formatTm(Infinity)).toBe('—')
  })
  it('never uses kg for VRAC quantities', () => {
    for (const sample of [0, 0.1, 1, 12.34, 1000, 99_999.999]) {
      expect(formatTm(sample)).not.toMatch(/kg/i)
    }
  })
})

describe('formatBtl', () => {
  it('formats a bottle count as integer with btl suffix', () => {
    expect(formatBtl(42)).toBe('42 btl')
  })
})

describe('formatPercent', () => {
  it('rounds to integer', () => {
    expect(formatPercent(73.4)).toBe('73 %')
  })
})
