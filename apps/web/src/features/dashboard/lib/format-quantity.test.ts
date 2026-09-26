import { describe, expect, it } from 'vitest'
import {
  formatDashboardMetricValue,
  formatDashboardQuantity,
} from './format-quantity'

describe('formatDashboardQuantity', () => {
  it('keeps metric tonnes and bottles on their canonical unit', () => {
    expect(formatDashboardQuantity(12.34, 'TM')).toMatch(/12[,.]34 TM$/)
    expect(formatDashboardQuantity(120, 'btl')).toMatch(/120 btl$/)
  })

  it('never mixes a bottle count into the TM unit', () => {
    expect(formatDashboardQuantity(120, 'btl')).not.toMatch(/TM$/)
    expect(formatDashboardQuantity(12.34, 'TM')).not.toMatch(/btl$/)
  })

  it('renders a dash for non finite values', () => {
    expect(formatDashboardQuantity(Number.NaN, 'TM')).toBe('—')
    expect(formatDashboardQuantity(Number.POSITIVE_INFINITY, 'btl')).toBe('—')
  })
})

describe('formatDashboardMetricValue', () => {
  const t = (key: string) => (key === 'units.days' ? 'j' : key)

  it('formats a quantity through the single quantity formatter', () => {
    expect(
      formatDashboardMetricValue(
        { kind: 'quantity', quantity: { value: 12.5, unit: 'TM' } },
        t,
      ),
    ).toMatch(/12[,.]5 TM$/)
    expect(
      formatDashboardMetricValue(
        { kind: 'quantity', quantity: { value: 8, unit: 'btl' } },
        t,
      ),
    ).toMatch(/8 btl$/)
  })

  it('formats a count as a plain number with no unit suffix', () => {
    expect(formatDashboardMetricValue({ kind: 'count', count: 42 }, t)).toMatch(
      /^42$/,
    )
  })

  it('formats a percent and a day count through their own unit', () => {
    expect(formatDashboardMetricValue({ kind: 'percent', percent: 87 }, t)).toBe('87 %')
    expect(formatDashboardMetricValue({ kind: 'days', days: 2.5 }, t)).toBe('2.5 j')
  })

  it('never renders a volume without its unit', () => {
    expect(
      formatDashboardMetricValue(
        { kind: 'quantity', quantity: { value: 3, unit: 'btl' } },
        t,
      ),
    ).toMatch(/btl/)
  })
})
