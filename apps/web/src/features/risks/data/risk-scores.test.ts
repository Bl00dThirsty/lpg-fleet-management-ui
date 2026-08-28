import { describe, expect, it } from 'vitest'
import {
  getRiskScores,
  getRiskSummary,
  getRiskByEntityType,
  riskLevelLabels,
  riskEntityLabels,
  riskLevelOrder,
} from './risk-scores'

describe('risk-scores view-model', () => {
  it('returns risk scores with resolved entities', () => {
    const rows = getRiskScores()
    expect(rows.length).toBeGreaterThanOrEqual(1)
    for (const row of rows) {
      expect(row.entity_name).toBeTruthy()
      expect(row.level_label).toBeTruthy()
      expect(row.score).toBeGreaterThanOrEqual(0)
    }
  })

  it('sorts by descending score', () => {
    const rows = getRiskScores()
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.score >= rows[i]!.score).toBe(true)
    }
  })

  it('summarizes level buckets', () => {
    const summary = getRiskSummary(getRiskScores())
    const sum = summary.faible + summary.modere + summary.eleve + summary.critique
    expect(sum).toBe(summary.total)
    expect(summary.average).toBeGreaterThanOrEqual(0)
  })

  it('labels every risk level and entity', () => {
    expect(riskLevelLabels.CRITIQUE).toBe('Critique')
    expect(riskEntityLabels.MARKETEUR).toBe('Marketeur')
  })

  it('aggregates counts and averages per entity type', () => {
    const byType = getRiskByEntityType(getRiskScores())
    expect(byType.length).toBeGreaterThanOrEqual(1)
    const total = byType.reduce((acc, row) => acc + row.count, 0)
    expect(total).toBe(getRiskScores().length)
    for (const row of byType) {
      expect(row.entity_label).toBeTruthy()
      expect(row.average).toBeGreaterThanOrEqual(0)
    }
  })

  it('orders risk levels for deterministic sorting', () => {
    expect(riskLevelOrder.FAIBLE).toBeLessThan(riskLevelOrder.MODERE)
    expect(riskLevelOrder.MODERE).toBeLessThan(riskLevelOrder.ELEVE)
    expect(riskLevelOrder.ELEVE).toBeLessThan(riskLevelOrder.CRITIQUE)
  })
})