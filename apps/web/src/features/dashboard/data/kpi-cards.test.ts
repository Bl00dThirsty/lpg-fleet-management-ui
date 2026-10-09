import { describe, expect, it } from 'vitest'
import {
  buildKpiStrip,
  computeDeltaPercent,
  computeDeltaPoints,
  formatKpiDelta,
  isOrgDashboardRole,
  makeDelta,
} from './kpi-cards'

describe('delta helpers', () => {
  it('computes relative percent change from the same current and previous values', () => {
    expect(computeDeltaPercent(1428.5, 1362.8)).toBe(4.8)
    expect(computeDeltaPercent(128, 135)).toBe(-5.2)
    expect(computeDeltaPercent(15700, 15200)).toBe(3.3)
  })

  it('returns null when the previous value is zero or missing', () => {
    expect(computeDeltaPercent(10, 0)).toBeNull()
    expect(computeDeltaPercent(10, null)).toBeNull()
    expect(computeDeltaPoints(98.6, null)).toBeNull()
  })

  it('computes point changes for rates', () => {
    expect(computeDeltaPoints(98.6, 97.7)).toBe(0.9)
    expect(computeDeltaPoints(91.7, 89.7)).toBe(2)
    expect(computeDeltaPoints(96.4, 95.2)).toBe(1.2)
  })

  it('colours the badge by judgement, not by direction', () => {
    expect(makeDelta(4.8, '%', 'neutral')).toMatchObject({ direction: 'up', tone: 'neutral' })
    expect(makeDelta(40, '%', 'down')).toMatchObject({ direction: 'up', tone: 'bad' })
    expect(makeDelta(-40, '%', 'down')).toMatchObject({ direction: 'down', tone: 'good' })
    expect(makeDelta(-34.9, '%', 'neutral')).toMatchObject({ tone: 'neutral' })
    expect(makeDelta(0, '%', 'up')).toMatchObject({ direction: 'flat', tone: 'neutral' })
    expect(makeDelta(null, '%', 'up')).toBeNull()
  })

  it('formats deltas in French with their unit', () => {
    expect(formatKpiDelta(makeDelta(4.8, '%', 'neutral')!)).toBe('+4,8 %')
    expect(formatKpiDelta(makeDelta(-5.2, '%', 'neutral')!)).toBe('−5,2 %')
    expect(formatKpiDelta(makeDelta(0.9, 'pt', 'up')!)).toBe('+0,9 pt')
  })
})

describe('buildKpiStrip', () => {
  const mockContext = {
    total: 10,
    planned: 2,
    waiting: 1,
    acknowledged: 1,
    active: 3,
    closed: 2,
    cancelled: 1,
    draft: 0,
    plannedVrac: 25,
    plannedBottles: 150,
    deliveredVrac: 14.8,
    deliveredBottles: 200,
    undated: 0,
  }

  it('builds 5 KPI cards with live tour metrics', () => {
    const strip = buildKpiStrip('SUPERADMIN', mockContext)
    expect(strip).toHaveLength(5)
    const ids = strip.map((c) => c.id)
    expect(ids).toEqual(['tournees', 'planned', 'planned-volume', 'vrac', 'bouteilles50kg'])

    const tourneesCard = strip.find((c) => c.id === 'tournees')!
    expect(tourneesCard.title).toBe('Tournées de la période')
    expect(tourneesCard.value).toBe('10')
    expect(tourneesCard.note).toContain('3 en cours · 2 clôturées')

    const plannedCard = strip.find((c) => c.id === 'planned')!
    expect(plannedCard.title).toBe('Tournées planifiées')
    expect(plannedCard.value).toBe('2')
    expect(plannedCard.note).toContain('1 acceptées · 1 en attente transporteur')

    const plannedVolumeCard = strip.find((c) => c.id === 'planned-volume')!
    expect(plannedVolumeCard.title).toBe('Quantités à livrer')
    expect(plannedVolumeCard.value).toMatch(/25.*TM/)

    const vracCard = strip.find((c) => c.id === 'vrac')!
    expect(vracCard.title).toBe('Vrac effectivement livré')
    expect(vracCard.value).toMatch(/14,8.*TM/)

    const bottlesCard = strip.find((c) => c.id === 'bouteilles50kg')!
    expect(bottlesCard.title).toBe('Bouteilles 50 kg livrées')
    expect(bottlesCard.value).toMatch(/200.*btl/)
  })

  it('gracefully handles empty context', () => {
    const strip = buildKpiStrip('MARKETEUR')
    expect(strip).toHaveLength(5)
    expect(strip.find((c) => c.id === 'tournees')!.value).toBe('0')
  })
})

describe('isOrgDashboardRole', () => {
  it('marks only marketeur and transporteur as organisation accounts', () => {
    expect(isOrgDashboardRole('MARKETEUR')).toBe(true)
    expect(isOrgDashboardRole('TRANSPORTEUR')).toBe(true)
    expect(isOrgDashboardRole('SUPERADMIN')).toBe(false)
    expect(isOrgDashboardRole('ADMIN')).toBe(false)
    expect(isOrgDashboardRole('SUPERVISOR')).toBe(false)
    expect(isOrgDashboardRole('AGENT')).toBe(false)
    expect(isOrgDashboardRole('INTEGRATEUR')).toBe(false)
  })
})
