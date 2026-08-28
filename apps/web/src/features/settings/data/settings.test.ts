import { describe, expect, it } from 'vitest'
import { getSettings, getSettingsByCategory, getSettingSummary } from './settings'

describe('settings view-model', () => {
  it('maps settings with category labels', () => {
    const rows = getSettings()
    expect(rows.length).toBeGreaterThanOrEqual(8)
    for (const row of rows) {
      expect(row.key).toBeTruthy()
      expect(row.categoryLabel).toBeTruthy()
      expect(typeof row.value).toBe('string')
    }
  })

  it('groups settings by category', () => {
    const grouped = getSettingsByCategory()
    const total = Object.values(grouped).reduce((acc, list) => acc + list.length, 0)
    expect(total).toBe(getSettings().length)
    expect(Object.keys(grouped).length).toBeGreaterThanOrEqual(3)
  })

  it('computes summary', () => {
    const summary = getSettingSummary()
    expect(summary.total).toBe(getSettings().length)
    expect(summary.categories).toBeGreaterThanOrEqual(3)
  })
})