import { delivery_tours, getSettingNumber } from '@lpg/mock-data'
import type { Declaration, Reconciliation } from '@lpg/types'

export interface ReconciliationComputation {
  declaration_id: string
  declared_volume: number
  tracked_volume: number
  volume_gap: number
  gap_pct: number
  tolerance_pct: number
  within_tolerance: boolean
  subsidy_impact: number
}

const TOLERANCE_KEY = 'reconciliation.volume_gap_tolerance_percent'
const SUBSIDY_RATE_KEY = 'reconciliation.subsidy_rate_per_tm'
const DEFAULT_TOLERANCE = 2.5
const DEFAULT_SUBSIDY_RATE_PER_TM = 500000

function resolveTolerance(): number {
  return getSettingNumber(TOLERANCE_KEY) ?? DEFAULT_TOLERANCE
}

function resolveSubsidyRate(): number {
  return getSettingNumber(SUBSIDY_RATE_KEY) ?? DEFAULT_SUBSIDY_RATE_PER_TM
}

/**
 * Tracked volume = sum of delivered quantities (TM or btl depending on the tour's
 * type) across all delivery tours. Previously this naively summed every
 * `meter_reading` (an ever-increasing counter) on `OUT` scans, producing values
 * larger than the declared volume by orders of magnitude and breaking the gap
 * and subsidy math.
 * TODO: period + marketeur scoping and per-scan deltas are backend-owned; this
 * selector mirrors the frontend's available fixtures only.
 */
export function sumTrackedVolume(): number {
  return delivery_tours.reduce((acc, t) => acc + (t.delivered_quantity ?? 0), 0)
}

export function computeReconciliation(
  declaration: Declaration,
  trackedVolume?: number,
  toleranceOverride?: number,
  subsidyRateOverride?: number,
): ReconciliationComputation {
  const tolerance = toleranceOverride ?? resolveTolerance()
  const subsidyRate = subsidyRateOverride ?? resolveSubsidyRate()
  const tracked = trackedVolume ?? sumTrackedVolume()
  const volumeGap = declaration.declared_volume - tracked
  const gapPct =
    declaration.declared_volume > 0
      ? Math.abs((volumeGap / declaration.declared_volume) * 100)
      : volumeGap !== 0
        ? 100
        : 0
  return {
    declaration_id: declaration.id,
    declared_volume: declaration.declared_volume,
    tracked_volume: tracked,
    volume_gap: volumeGap,
    gap_pct: Math.round(gapPct * 100) / 100,
    tolerance_pct: tolerance,
    within_tolerance: gapPct <= tolerance,
    subsidy_impact: Math.round(Math.abs(volumeGap) * subsidyRate),
  }
}

export function reconciliationFromDeclaration(
  decl: Declaration,
  existing?: Reconciliation,
): Reconciliation {
  const comp = computeReconciliation(decl)
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? `rec-comp-${decl.id}`,
    declaration_id: decl.id,
    tracked_volume: comp.tracked_volume,
    volume_gap: comp.volume_gap,
    subsidy_impact: comp.subsidy_impact,
    status: existing?.status ?? 'PENDING',
    verified_by: existing?.verified_by ?? null,
    verified_at: existing?.verified_at ?? null,
    notes: existing?.notes ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
    created_by: null,
    updated_by: null,
  }
}