import { describe, expect, it } from 'vitest'
import { formatPeriodRangeLabel } from './period-range-label'
import type { DashboardPeriodRange } from '../data/dashboard'

const range: DashboardPeriodRange = { from: '2026-01-05', to: '2026-01-31' }
const t = (key: string) => (key === 'period.current' ? 'Période courante' : key)

function parseCalendarDay(value: string): Date {
  const [year, month, day] = value.split('-').map(Number) as [number, number, number]
  return new Date(year!, month! - 1, day!)
}

describe('formatPeriodRangeLabel', () => {
  it('renders both bounds in the requested language', () => {
    const fr = formatPeriodRangeLabel(range, 'fr-FR', t)
    const en = formatPeriodRangeLabel(range, 'en-US', t)

    expect(fr).not.toBe(en)
    expect(fr).toContain('2026')
    expect(en).toContain('2026')
  })

  it('keeps a single day range readable', () => {
    const label = formatPeriodRangeLabel(
      { from: '2026-01-05', to: '2026-01-05' },
      'fr-FR',
      t,
    )

    expect(label).not.toContain('–')
    expect(label).toContain('2026')
  })

  it('falls back to the translated current period when there is no range', () => {
    expect(formatPeriodRangeLabel(null, 'fr-FR', t)).toBe('Période courante')
  })

  it('does not read the ambient language itself', () => {
    expect(
      formatPeriodRangeLabel(range, 'fr-FR', t),
    ).not.toBe(formatPeriodRangeLabel(range, 'en-US', t))
  })

  it('parses the ISO bounds as local calendar days', () => {
    expect(parseCalendarDay('2026-01-05').getDate()).toBe(5)
  })
})
