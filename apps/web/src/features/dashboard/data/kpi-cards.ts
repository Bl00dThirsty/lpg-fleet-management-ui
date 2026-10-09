import type { Role } from '@/config/rbac/roles'
import { formatTm } from '@/features/map/utils/format'

export type DeltaUnit = '%' | 'pt'
export type DeltaTone = 'good' | 'bad' | 'neutral'
export type GoodDirection = 'up' | 'down' | 'neutral'

export type KpiDelta = {
  value: number
  unit: DeltaUnit
  direction: 'up' | 'down' | 'flat'
  tone: DeltaTone
}

export type KpiCard = {
  id: string
  title: string
  value: string
  delta: KpiDelta | null
  baseline: string | null
  note?: string
}

export interface KpiStripContext {
  activeTrips?: number
  plannedTrips?: number
  activeTrucks?: number
  totalTrucks?: number
  openAlerts?: number
  total?: number
  active?: number
  closed?: number
  planned?: number
  acknowledged?: number
  waiting?: number
  plannedVrac?: number
  plannedBottles?: number
  deliveredVrac?: number
  deliveredBottles?: number
  totalVolumeTM?: number
}

type ValueKind = 'tm' | 'btl' | 'percent' | 'count'
type MoveKind = 'percent' | 'points'

type KpiSpec = {
  id: string
  title: string
  current: number
  previous: number | null
  kind: ValueKind
  move: MoveKind
  good: GoodDirection
}

const num0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

export function isOrgDashboardRole(role: Role): boolean {
  return role === 'MARKETEUR' || role === 'TRANSPORTEUR'
}

export function computeDeltaPercent(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function computeDeltaPoints(current: number, previous: number | null): number | null {
  if (previous === null) return null
  return Math.round((current - previous) * 10) / 10
}

export function makeDelta(
  value: number | null,
  unit: DeltaUnit,
  good: GoodDirection
): KpiDelta | null {
  if (value === null) return null
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  let tone: DeltaTone = 'neutral'
  if (good === 'up' && direction !== 'flat') tone = direction === 'up' ? 'good' : 'bad'
  if (good === 'down' && direction !== 'flat') tone = direction === 'down' ? 'good' : 'bad'
  return { value, unit, direction, tone }
}

export function formatKpiValue(kind: ValueKind, value: number): string {
  if (kind === 'tm') return formatTm(value)
  if (kind === 'btl') {
    return value >= 1000 ? `${num1.format(value / 1000)} k btl` : `${num0.format(value)} btl`
  }
  if (kind === 'percent') return `${num1.format(value)} %`
  return num0.format(value)
}

export function formatKpiDelta(delta: KpiDelta): string {
  const sign = delta.direction === 'up' ? '+' : delta.direction === 'down' ? '−' : ''
  return `${sign}${num1.format(Math.abs(delta.value))} ${delta.unit}`
}

function buildCard(spec: KpiSpec, note?: string): KpiCard {
  const raw =
    spec.move === 'points'
      ? computeDeltaPoints(spec.current, spec.previous)
      : computeDeltaPercent(spec.current, spec.previous)
  const delta = makeDelta(raw, spec.move === 'points' ? 'pt' : '%', spec.good)
  return {
    id: spec.id,
    title: spec.title,
    value: formatKpiValue(spec.kind, spec.current),
    delta,
    baseline: spec.previous === null ? null : formatKpiValue(spec.kind, spec.previous),
    note,
  }
}

function pluralActive(count: number): string {
  return count === 1 ? 'active' : 'actives'
}

function regulatorCards(ctx?: KpiStripContext): KpiCard[] {
  const extraVrac = ctx?.plannedVrac ? round1(ctx.plannedVrac) : 0
  const extraBtl = ctx?.plannedBottles ? Math.round(ctx.plannedBottles) : 0
  const vracCurrent = round1(1428.5 + extraVrac)
  const btlCurrent = Math.round(15700 + extraBtl)
  const bottlesTM = (btlCurrent * 50) / 1000

  return [
    buildCard(
      {
        id: 'vrac',
        title: 'Volume GPL Vrac',
        current: vracCurrent,
        previous: 1362.8,
        kind: 'tm',
        move: 'percent',
        good: 'neutral',
      },
      'Cuves industrielles & gros consommateurs'
    ),
    buildCard(
      {
        id: 'bouteilles50kg',
        title: 'Bouteilles 50 kg traçables',
        current: btlCurrent,
        previous: 15200,
        kind: 'btl',
        move: 'percent',
        good: 'neutral',
      },
      `${formatTm(bottlesTM)} équiv. · 1 TM = 20 btl`
    ),
    buildCard(
      {
        id: 'scdp',
        title: 'Réserves GPL SCDP',
        current: 70.6,
        previous: 68.2,
        kind: 'tm',
        move: 'percent',
        good: 'neutral',
      },
      '64 % de remplissage · capacité 110 TM'
    ),
    buildCard(
      {
        id: 'snh',
        title: 'Disponibilité GPL SNH',
        current: 48.0,
        previous: 52.0,
        kind: 'tm',
        move: 'percent',
        good: 'neutral',
      },
      '80 % de remplissage · capacité 60 TM'
    ),
    buildCard(
      {
        id: 'conformite-pesee',
        title: 'Conformité de pesée',
        current: 98.6,
        previous: 97.7,
        kind: 'percent',
        move: 'points',
        good: 'up',
      },
      'Livraisons pesées avec un écart ≤ 0,5 %'
    ),
  ]
}

function marketeurCards(ctx: KpiStripContext = {}): KpiCard[] {
  const totalTours = (ctx.total ?? 46) + (ctx.planned ?? 0)
  const activeTours = ctx.active ?? ctx.activeTrips ?? 2
  const closedTours = Math.max(totalTours - activeTours, 0)
  const extraVrac = (ctx.deliveredVrac ?? 0) + (ctx.plannedVrac ?? 0)
  const extraBtls = (ctx.deliveredBottles ?? 0) + (ctx.plannedBottles ?? 0)
  const vracCurrent = round1(428.5 + extraVrac)
  const btlCurrent = Math.round(6400 + extraBtls)
  const bottlesTM = (btlCurrent * 50) / 1000

  const tourneeNote =
    (ctx.planned ?? 0) > 0
      ? `${activeTours} ${pluralActive(activeTours)} · ${closedTours} clôturées (${ctx.planned} planifiées)`
      : `${activeTours} ${pluralActive(activeTours)} · ${closedTours} clôturées`

  const tournees = buildCard(
    {
      id: 'tournees',
      title: 'Tournées du mois',
      current: totalTours,
      previous: 51,
      kind: 'count',
      move: 'percent',
      good: 'neutral',
    },
    tourneeNote
  )
  return [
    buildCard(
      {
        id: 'volume-livre',
        title: 'Volume livré',
        current: vracCurrent,
        previous: 409.2,
        kind: 'tm',
        move: 'percent',
        good: 'neutral',
      },
      'VRAC & bouteilles livrés à mes clients'
    ),
    buildCard(
      {
        id: 'bouteilles50kg',
        title: 'Bouteilles 50 kg livrées',
        current: btlCurrent,
        previous: 6100,
        kind: 'btl',
        move: 'percent',
        good: 'neutral',
      },
      `${formatTm(bottlesTM)} équiv. · 1 TM = 20 btl`
    ),
    tournees,
    buildCard(
      {
        id: 'taux-conforme',
        title: 'Taux de livraison conforme',
        current: 96.4,
        previous: 95.2,
        kind: 'percent',
        move: 'points',
        good: 'up',
      },
      'Livraisons certifiées sans litige'
    ),
    buildCard(
      {
        id: 'sites-clients',
        title: 'Sites clients actifs',
        current: 38,
        previous: 36,
        kind: 'count',
        move: 'percent',
        good: 'up',
      },
      'Sites avec au moins une livraison sur la période'
    ),
  ]
}

function transporteurCards(ctx: KpiStripContext = {}): KpiCard[] {
  const totalTrucks = ctx.totalTrucks ?? 18
  const onTour = ctx.activeTrucks ?? ctx.active ?? 12
  const trackedRate: KpiCard =
    onTour <= 0
      ? {
          id: 'camions-traces',
          title: 'Camions tracés en ligne',
          value: 'n/a',
          delta: null,
          baseline: null,
          note: 'Aucun camion en tournée · ping ≤ 5 min',
        }
      : (() => {
          const tracked = Math.max(onTour - 1, 0)
          const rate = Math.round((tracked / onTour) * 1000) / 10
          return buildCard(
            {
              id: 'camions-traces',
              title: 'Camions tracés en ligne',
              current: rate,
              previous: 89.7,
              kind: 'percent',
              move: 'points',
              good: 'up',
            },
            `${num0.format(tracked)} / ${num0.format(onTour)} camions · ping ≤ 5 min`
          )
        })()
  return [
    buildCard(
      {
        id: 'camions-en-tournee',
        title: 'Camions en tournée',
        current: onTour,
        previous: 11,
        kind: 'count',
        move: 'percent',
        good: 'up',
      },
      `sur ${num0.format(totalTrucks)} camions`
    ),
    trackedRate,
    buildCard(
      {
        id: 'tournees-assignees',
        title: 'Tournées assignées',
        current: 34 + (ctx.planned ?? 0),
        previous: 31,
        kind: 'count',
        move: 'percent',
        good: 'neutral',
      },
      `${ctx.active ?? ctx.activeTrips ?? 3} en cours · ${ctx.planned ?? ctx.plannedTrips ?? 5} planifiées`
    ),
    buildCard(
      {
        id: 'volume-achemine',
        title: 'Volume acheminé',
        current: round1(982.0 + (ctx.plannedVrac ?? 0) + (ctx.deliveredVrac ?? 0)),
        previous: 941.0,
        kind: 'tm',
        move: 'percent',
        good: 'neutral',
      },
      'TM chargées et acheminées pour les marketeurs'
    ),
    buildCard(
      {
        id: 'anomalies-ouvertes',
        title: 'Anomalies ouvertes',
        current: ctx.openAlerts ?? 3,
        previous: 5,
        kind: 'count',
        move: 'percent',
        good: 'down',
      },
      'Écarts, retards et litiges à traiter'
    ),
  ]
}

export function buildKpiStrip(role: Role, ctx: KpiStripContext = {}): KpiCard[] {
  if (role === 'MARKETEUR') return marketeurCards(ctx)
  if (role === 'TRANSPORTEUR') return transporteurCards(ctx)
  return regulatorCards(ctx)
}
