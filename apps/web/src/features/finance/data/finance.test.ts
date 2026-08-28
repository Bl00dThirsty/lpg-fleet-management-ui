import { describe, expect, it } from 'vitest'
import {
  getFinanceSummary,
  getMonthlyTrend,
  getRedressementStatusRows,
} from './finance'

describe('finance view-model', () => {
  it('aggregates subsidy impact and gaps', () => {
    const summary = getFinanceSummary()
    expect(summary.declaredVolumeLabel).toContain('TM')
    expect(summary.trackedVolumeLabel).toContain('TM')
    expect(summary.subsidyImpactLabel).toContain('XAF')
    expect(summary.collectedLabel).toContain('XAF')
    expect(summary.gapPercentage).toBeGreaterThanOrEqual(0)
    expect(summary.collectionRate).toBeGreaterThanOrEqual(0)
  })

  it('builds one status row per redressement status with totals', () => {
    const rows = getRedressementStatusRows()
    expect(rows).toHaveLength(3)
    const totalCount = rows.reduce((acc, r) => acc + r.count, 0)
    expect(totalCount).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.statusLabel).toBeTruthy()
      expect(row.totalLabel).toContain('XAF')
    }
  })

  it('builds a chronological monthly trend with declared, tracked and gap', () => {
    const trend = getMonthlyTrend()
    expect(trend.length).toBeGreaterThanOrEqual(1)
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const orderKey = (label: string) => {
      const [monthName, year] = label.split(' ')
      return `${year}-${String(months.indexOf(monthName ?? '') + 1).padStart(2, '0')}`
    }
    const keys = trend.map((point) => orderKey(point.label))
    expect([...keys].sort()).toEqual(keys)
    for (const point of trend) {
      expect(point.declared).toBeGreaterThanOrEqual(0)
      expect(point.tracked).toBeGreaterThanOrEqual(0)
      expect(point.gap).toBeGreaterThanOrEqual(0)
    }
    const total = trend.reduce((acc, point) => acc + point.tracked, 0)
    expect(total).toBeGreaterThan(0)
  })
})