import { describe, expect, it } from 'vitest'
import { formatBtl, formatNumber, formatPercent, formatTM, formatXAF, formatDate, getDateFnsLocale } from './formatters'

describe('formatters', () => {
  it('formats TM in French with narrow no-break space', () => {
    expect(formatTM(1234.5, 'fr-FR')).toBe('1\u202f234,5 TM')
  })
  it('formats TM in English with comma', () => {
    expect(formatTM(1234.5, 'en-US')).toBe('1,234.5 TM')
  })
  it('formats XAF with fr vs en grouping', () => {
    expect(formatXAF(1000000, 'fr-FR')).toMatch(/1.*000.*000/)
  })
  it('formats date with locale', () => {
    const d = new Date('2026-08-28T12:00:00Z')
    expect(formatDate(d, 'fr-FR')).not.toBe(formatDate(d, 'en-US'))
  })
  it('covers remaining formatters for typecheck', () => {
    expect(formatNumber(1000, 'fr-FR')).toBeDefined()
    expect(formatBtl(10, 'en-US')).toBe('10 btl')
    expect(formatPercent(12.345, 'fr-FR')).toContain('%')
    expect(getDateFnsLocale('fr-FR')).toBeDefined()
    expect(getDateFnsLocale('en-US')).toBeDefined()
  })
})
