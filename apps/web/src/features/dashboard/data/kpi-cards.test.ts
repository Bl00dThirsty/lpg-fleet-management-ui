import { describe, expect, it } from 'vitest'
import type { Role } from '@/config/rbac/roles'
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

const ORG_ROLES: Role[] = ['MARKETEUR', 'TRANSPORTEUR']
const REGULATOR_ROLES: Role[] = ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'AGENT', 'INTEGRATEUR']

describe('buildKpiStrip', () => {
  it.each(ORG_ROLES)('%s never sees SCDP or SNH reserve cards', (role) => {
    const ids = buildKpiStrip(role).map((card) => card.id)
    const titles = buildKpiStrip(role).map((card) => card.title).join(' ')
    expect(ids).not.toContain('scdp')
    expect(ids).not.toContain('snh')
    expect(titles).not.toContain('SCDP')
    expect(titles).not.toContain('SNH')
  })

  it.each(REGULATOR_ROLES)('%s keeps the national reserve and conformity cards', (role) => {
    const strip = buildKpiStrip(role)
    const ids = strip.map((card) => card.id)
    expect(ids).toEqual(['vrac', 'bouteilles50kg', 'scdp', 'snh', 'conformite-pesee'])
  })

  it('reworks the last regulator card as "Conformité de pesée" with a point delta', () => {
    const strip = buildKpiStrip('SUPERADMIN')
    const card = strip[strip.length - 1]!
    expect(card.title).toBe('Conformité de pesée')
    expect(card.value).toBe('98,6 %')
    expect(card.delta).toMatchObject({ unit: 'pt', value: 0.9, tone: 'good' })
    expect(card.baseline).toBe('97,7 %')
  })

  it('keeps every regulator delta arithmetically consistent with its baseline', () => {
    for (const card of buildKpiStrip('SUPERADMIN')) {
      if (!card.delta || card.delta.unit !== '%' || !card.baseline) continue
      const baseline = Number(card.baseline.replace(/[^\d,−-]/g, '').replace(',', '.').replace('−', '-'))
      const current = Number(card.value.replace(/[^\d,−-]/g, '').replace(',', '.').replace('−', '-'))
      const expected = Math.round(((current - baseline) / baseline) * 1000) / 10
      expect(card.delta.value).toBe(expected)
    }
  })

  it('shows tournées with an active/closed split that sums to the total', () => {
    const card = buildKpiStrip('MARKETEUR', { active: 2 }).find((c) => c.id === 'tournees')!
    expect(card.value).toBe('46')
    expect(card.note).toBe('2 actives · 44 clôturées')
    const single = buildKpiStrip('MARKETEUR', { active: 1 }).find((c) => c.id === 'tournees')!
    expect(single.note).toBe('1 active · 45 clôturées')
  })

  it('returns "n/a" for the tracking rate when no truck is on tour', () => {
    const card = buildKpiStrip('TRANSPORTEUR', { activeTrucks: 0, totalTrucks: 18 }).find(
      (c) => c.id === 'camions-traces'
    )!
    expect(card.value).toBe('n/a')
    expect(card.delta).toBeNull()
    expect(card.baseline).toBeNull()
  })

  it('computes the tracking rate over trucks on an active tour', () => {
    const card = buildKpiStrip('TRANSPORTEUR', { activeTrucks: 12, totalTrucks: 18 }).find(
      (c) => c.id === 'camions-traces'
    )!
    expect(card.value).toBe('91,7 %')
    expect(card.note).toBe('11 / 12 camions · ping ≤ 5 min')
    expect(card.delta).toMatchObject({ unit: 'pt', value: 2 })
  })

  it('flags more open anomalies as bad and fewer as good', () => {
    const card = buildKpiStrip('TRANSPORTEUR').find((c) => c.id === 'anomalies-ouvertes')!
    expect(card.delta).toMatchObject({ direction: 'down', tone: 'good', value: -40 })
  })

  it('adjusts volume and deltas dynamically when planned tours are supplied', () => {
    const strip = buildKpiStrip('SUPERADMIN', { plannedVrac: 20 })
    const vrac = strip.find((c) => c.id === 'vrac')!
    expect(vrac.value).toMatch(/1.*448,5\s*TM/)
    expect(vrac.delta?.value).toBe(6.3)
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
