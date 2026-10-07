import { describe, expect, it } from 'vitest'
import { buildDeliveryFlowSeries } from './delivery-flow'

const NOW = new Date(2026, 9, 7)
const currentMonthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(NOW)

function sum(points: Array<{ vrac: number; bottles50kg: number; total: number }>) {
  return points.reduce(
    (acc, point) => ({
      vrac: acc.vrac + point.vrac,
      bottles50kg: acc.bottles50kg + point.bottles50kg,
      total: acc.total + point.total,
    }),
    { vrac: 0, bottles50kg: 0, total: 0 }
  )
}

describe('buildDeliveryFlowSeries', () => {
  const months = buildDeliveryFlowSeries('last-12-months', NOW)

  it('returns a rolling 12 months ending on the current month', () => {
    expect(months).toHaveLength(12)
    expect(months[months.length - 1]!.label).toBe(currentMonthLabel)
    expect(months[0]!.label).not.toBe(currentMonthLabel)
  })

  it('keeps every point self-consistent (total = vrac + bouteilles)', () => {
    for (const point of [...months, ...buildDeliveryFlowSeries('last-quarter', NOW), ...buildDeliveryFlowSeries('last-30-days', NOW)]) {
      expect(point.total).toBeCloseTo(point.vrac + point.bottles50kg, 5)
    }
  })

  it('derives quarters from the same months so totals match', () => {
    const quarters = buildDeliveryFlowSeries('last-quarter', NOW)
    expect(quarters).toHaveLength(4)
    expect(sum(quarters)).toEqual(sum(months))
    for (let group = 0; group < 4; group++) {
      const slice = months.slice(group * 3, group * 3 + 3)
      expect(quarters[group]).toMatchObject({
        vrac: sum(slice).vrac,
        bottles50kg: sum(slice).bottles50kg,
      })
    }
  })

  it('splits the last month into four weeks without losing volume', () => {
    const weeks = buildDeliveryFlowSeries('last-30-days', NOW)
    expect(weeks).toHaveLength(4)
    expect(sum(weeks)).toEqual(sum([months[months.length - 1]!]))
  })

  it('never shows a month above the 12-month total', () => {
    const total = sum(months).total
    for (const month of months) {
      expect(month.total).toBeLessThanOrEqual(total)
    }
  })
})
