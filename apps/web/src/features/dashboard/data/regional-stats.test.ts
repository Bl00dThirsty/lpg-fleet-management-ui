import { describe, expect, it } from 'vitest'
import {
  REGIONAL_MONTHLY_STATS,
  ROTATING_ACTIVE_VOLUME_TM,
  buildCadenceRegions,
  buildRegionalShareSummary,
  computeTotalRegionalVolume,
} from './regional-stats'

describe('regional-stats', () => {
  it('defines the 10 Cameroonian administrative regions', () => {
    expect(REGIONAL_MONTHLY_STATS).toHaveLength(10)
    const codes = REGIONAL_MONTHLY_STATS.map((r) => r.code)
    expect(codes).toEqual(['LT', 'CE', 'OU', 'SU', 'EN', 'SW', 'NO', 'AD', 'ES', 'NW'])
  })

  it('computes total volume matching canonical 2151.1 TM', () => {
    const total = computeTotalRegionalVolume()
    expect(total).toBe(2151.1)
  })

  it('builds regional share summary with Top 4 + Autres régions', () => {
    const summary = buildRegionalShareSummary()
    expect(summary.totalVolume).toBe(2151.1)
    expect(summary.chartData).toHaveLength(5)
    expect(summary.chartData[0]?.name).toBe('Littoral')
    expect(summary.chartData[0]?.formattedValue).toMatch(/642,8 TM/)
    expect(summary.chartData[0]?.percentage).toMatch(/29,9 %/)

    expect(summary.chartData[4]?.name).toBe('Autres régions')
    expect(summary.regionCards).toHaveLength(10)

    // Verify all regionCards have localized formatted volumes and shares
    for (const card of summary.regionCards) {
      expect(card.formattedVolume).toMatch(/TM/)
      expect(card.share).toMatch(/%/)
      // Must not contain raw period decimal
      expect(card.formattedVolume).not.toMatch(/\d+\.\d+ TM/)
    }
  })

  it('builds cadence regions with formatted values and dynamic shares', () => {
    const cadence = buildCadenceRegions()
    expect(ROTATING_ACTIVE_VOLUME_TM).toBe(58.4)
    expect(cadence.totalMonthVolumeTM).toBe(2151.1)
    expect(cadence.rotatingActiveVolumeFormatted).toBe('58,4')
    expect(cadence.topRegions).toHaveLength(4)
    expect(cadence.allRegions).toHaveLength(10)

    expect(cadence.topRegions[0]?.name).toBe('Littoral')
    expect(cadence.topRegions[0]?.share).toBe('29,9 %')
    expect(cadence.topRegions[0]?.formattedVolume).toMatch(/642,8 TM/)
  })
})
