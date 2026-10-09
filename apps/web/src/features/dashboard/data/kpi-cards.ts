import { summarizeTours } from '../lib/tour-metrics'
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

export type KpiStripContext = ReturnType<typeof summarizeTours>

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

export function buildKpiStrip(_role: Role, ctx: KpiStripContext = summarizeTours([])): KpiCard[] {
  const card = (id: string, title: string, value: number, kind: ValueKind, note: string) => buildCard({ id, title, current: value, previous: null, kind, move: 'percent', good: 'neutral' }, note)
  return [
    card('tournees', 'Tournées de la période', ctx.total, 'count', ctx.active + ' en cours · ' + ctx.closed + ' clôturées'),
    card('planned', 'Tournées planifiées', ctx.planned, 'count', ctx.acknowledged + ' acceptées · ' + ctx.waiting + ' en attente transporteur'),
    card('planned-volume', 'Quantités à livrer', ctx.plannedVrac, 'tm', formatKpiValue('btl', ctx.plannedBottles) + ' prévues · planifiées, acceptées et en attente'),
    card('vrac', 'Vrac effectivement livré', ctx.deliveredVrac, 'tm', 'Quantités de livraison enregistrées'),
    card('bouteilles50kg', 'Bouteilles 50 kg livrées', ctx.deliveredBottles, 'btl', ctx.cancelled + ' annulées · ' + ctx.draft + ' brouillons'),
  ]
}
