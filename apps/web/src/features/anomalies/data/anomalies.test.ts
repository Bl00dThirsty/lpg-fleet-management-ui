import { describe, expect, it } from 'vitest'
import { getAnomalies, getAnomalySummary, anomalyTypeLabels, anomalyCategoryLabels } from './anomalies'

describe('anomalies view-model', () => {
  it('returns all anomalies with resolved labels', () => {
    const rows = getAnomalies()
    expect(rows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.type_label).toBeTruthy()
      expect(row.category_label).toBeTruthy()
      expect(row.status_label).toBeTruthy()
    }
  })

  it('splits the dual track', () => {
    const investigation = getAnomalies('INVESTIGATION')
    const technical = getAnomalies('TECHNICAL')
    expect(investigation.length).toBeGreaterThanOrEqual(1)
    expect(technical.length).toBeGreaterThanOrEqual(1)
    expect(investigation.every((a) => a.category === 'INVESTIGATION')).toBe(true)
    expect(technical.every((a) => a.category === 'TECHNICAL')).toBe(true)
  })

  it('resolves entity names', () => {
    const rows = getAnomalies()
    for (const row of rows) {
      expect(row.entity_name).toBeTruthy()
    }
  })

  it('summarizes buckets', () => {
    const summary = getAnomalySummary(getAnomalies())
    const sum = summary.nouveau + summary.encours + summary.resolu + summary.ferme
    expect(sum).toBe(summary.total)
  })

  it('labels every anomaly type', () => {
    expect(Object.keys(anomalyTypeLabels).length).toBeGreaterThanOrEqual(15)
    expect(anomalyCategoryLabels.INVESTIGATION).toBe('Investigation')
  })
})