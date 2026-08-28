import { reconciliations as rawReconciliations, declarations } from '@lpg/mock-data'
import {
  redressementStatusLabels,
  type RedressementStatus,
} from '@/features/redressements/data/redressements'
import { getReconciliations, gapToleranceThreshold } from '@/features/reconciliations/data/reconciliations'
import { getRedressements } from '@/features/redressements/data/redressements'

export type { RedressementStatus }

const CURRENCY = 'XAF'

function currencyLabel(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} ${CURRENCY}`
}

export interface FinanceSummary {
  declaredVolume: number
  declaredVolumeLabel: string
  trackedVolume: number
  trackedVolumeLabel: string
  totalGap: number
  totalGapLabel: string
  gapPercentage: number
  subsidyImpact: number
  subsidyImpactLabel: string
  outstanding: number
  outstandingLabel: string
  collected: number
  collectedLabel: string
  collectionRate: number
  redressementCount: number
  issuedCount: number
  paidCount: number
  waivedCount: number
  pendingCount: number
  flaggedCount: number
}

export function getFinanceSummary(): FinanceSummary {
  const reconciliations = getReconciliations()
  const redressements = getRedressements()

  const declaredVolume = reconciliations.reduce((acc, r) => acc + r.declared_volume, 0)
  const trackedVolume = reconciliations.reduce((acc, r) => acc + r.tracked_volume, 0)
  const totalGap = reconciliations.reduce((acc, r) => acc + Math.abs(r.volume_gap), 0)
  const subsidyImpact = reconciliations.reduce((acc, r) => acc + Math.abs(r.subsidy_impact), 0)
  const issued = redressements.filter((r) => r.status === 'ISSUED')
  const paid = redressements.filter((r) => r.status === 'PAID')
  const outstanding = issued.reduce((acc, r) => acc + r.amount, 0)
  const collected = paid.reduce((acc, r) => acc + r.amount, 0)
  const issuedTotal = issued.reduce((acc, r) => acc + r.amount, 0)
  const flagged = reconciliations.filter(
    (r) => r.gap_percentage > gapToleranceThreshold()
  ).length

  return {
    declaredVolume,
    declaredVolumeLabel: `${declaredVolume.toLocaleString('fr-FR')} TM`,
    trackedVolume,
    trackedVolumeLabel: `${trackedVolume.toLocaleString('fr-FR')} TM`,
    totalGap,
    totalGapLabel: `${totalGap.toLocaleString('fr-FR')} TM`,
    gapPercentage: declaredVolume > 0 ? (totalGap / declaredVolume) * 100 : 0,
    subsidyImpact,
    subsidyImpactLabel: currencyLabel(subsidyImpact),
    outstanding,
    outstandingLabel: currencyLabel(outstanding),
    collected,
    collectedLabel: currencyLabel(collected),
    collectionRate: issuedTotal > 0 ? (collected / issuedTotal) * 100 : 0,
    redressementCount: redressements.length,
    issuedCount: issued.length,
    paidCount: paid.length,
    waivedCount: redressements.filter((r) => r.status === 'WAIVED').length,
    pendingCount: reconciliations.filter((r) => r.status === 'PENDING').length,
    flaggedCount: flagged,
  }
}

export interface FinanceMonthlyPoint {
  label: string
  declared: number
  tracked: number
  gap: number
  subsidyImpact: number
}

const FR_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function monthLabel(month: string): string {
  const parts = month.split('-').map(Number)
  const year = parts[0] ?? 0
  const index = parts[1] ?? 0
  const name = FR_MONTHS[index - 1] ?? month
  return `${name} ${year}`
}

/** Monthly declared vs tracked volumes, grouped by declaration period (chronological). */
export function getMonthlyTrend(): FinanceMonthlyPoint[] {
  const declById = new Map(declarations.map((d) => [d.id, d]))
  const byMonth = new Map<string, FinanceMonthlyPoint>()
  for (const r of rawReconciliations) {
    const decl = declById.get(r.declaration_id)
    const period = decl?.period_start ?? r.created_at ?? ''
    const month = period.slice(0, 7)
    if (!month) continue
    const entry = byMonth.get(month) ?? {
      label: '',
      declared: 0,
      tracked: 0,
      gap: 0,
      subsidyImpact: 0,
    }
    entry.declared += decl?.declared_volume ?? 0
    entry.tracked += r.tracked_volume
    entry.gap += Math.abs(r.volume_gap)
    entry.subsidyImpact += r.subsidy_impact
    byMonth.set(month, entry)
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, point]) => ({ ...point, label: monthLabel(month) }))
}

export interface FinanceStatusRow {
  status: RedressementStatus
  statusLabel: string
  count: number
  totalLabel: string
}

export function getRedressementStatusRows(): FinanceStatusRow[] {
  const rows = getRedressements()
  const statuses = Object.keys(redressementStatusLabels) as RedressementStatus[]
  return statuses.map((status) => {
    const subset = rows.filter((r) => r.status === status)
    return {
      status,
      statusLabel: redressementStatusLabels[status],
      count: subset.length,
      totalLabel: currencyLabel(subset.reduce((acc, r) => acc + r.amount, 0)),
    }
  })
}

export interface FinanceMarketeurRow {
  marketeur: string
  declaredVolume: number
  volumeGap: number
  subsidyImpact: number
  reconciliationCount: number
}

/** Per-marketeur aggregation over real reconciliation rows (no fabricated data). */
export function getMarketeurImpactRows(): FinanceMarketeurRow[] {
  const rows = getReconciliations()
  const byMarketeur = new Map<string, FinanceMarketeurRow>()
  for (const r of rows) {
    const entry = byMarketeur.get(r.marketeur_name) ?? {
      marketeur: r.marketeur_name,
      declaredVolume: 0,
      volumeGap: 0,
      subsidyImpact: 0,
      reconciliationCount: 0,
    }
    entry.declaredVolume += r.declared_volume
    entry.volumeGap += Math.abs(r.volume_gap)
    entry.subsidyImpact += r.subsidy_impact
    entry.reconciliationCount += 1
    byMarketeur.set(r.marketeur_name, entry)
  }
  return [...byMarketeur.values()].sort((a, b) => b.subsidyImpact - a.subsidyImpact)
}

/** Real reconciliation rows flagged as over the tolerance threshold. */
export function getFlaggedReconciliations() {
  const rows = getReconciliations()
  return rows.filter((r) => r.gap_percentage > gapToleranceThreshold())
}