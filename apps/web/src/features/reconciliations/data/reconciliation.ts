import { delivery_tours, getSettingNumber } from '@lpg/mock-data'
import type {
  Declaration,
  Reconciliation,
  DeliveryTour,
  DeliveryEvent,
} from '@lpg/types'
import { useToursStore } from '@/store/tours-store'

export interface ReconciliationComputation {
  declaration_id: string
  declared_volume: number
  tracked_volume: number
  tracked_bottles_out: number
  tracked_bottles_in: number
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

export function resolveTolerance(): number {
  return getSettingNumber(TOLERANCE_KEY) ?? DEFAULT_TOLERANCE
}

export function resolveSubsidyRate(): number {
  return getSettingNumber(SUBSIDY_RATE_KEY) ?? DEFAULT_SUBSIDY_RATE_PER_TM
}

/**
 * Tracked volume & bottle counts:
 * Aggregates delivery events (scans and completed dropoffs) from live tours,
 * falling back to stored tours and mock fixtures.
 *
 * - tracked_bottles_out = sum(DeliveryEvent.delivered)
 * - tracked_bottles_in  = sum(DeliveryEvent.returned)
 */
export function getTrackedTotals(): {
  tracked_volume: number
  tracked_bottles_out: number
  tracked_bottles_in: number
} {
  let storeTours: DeliveryTour[] = []
  let storeDeliveryEvents: DeliveryEvent[] = []

  try {
    const toursState = useToursStore?.getState?.()
    if (toursState) {
      storeTours = toursState.tours ?? []
      storeDeliveryEvents = toursState.deliveryEvents ?? []
    }
  } catch {
    // SSR / test environments
  }

  // Delivery events recorded during PDA stops (client delivery & consignes)
  const eventsOut = storeDeliveryEvents.reduce(
    (acc: number, e: DeliveryEvent) => acc + (e.delivered ?? 0),
    0
  )
  const eventsIn = storeDeliveryEvents.reduce(
    (acc: number, e: DeliveryEvent) => acc + (e.returned ?? 0),
    0
  )

  // Tour delivered quantity
  const toursDelivered = (storeTours.length > 0 ? storeTours : delivery_tours)
    .filter((t) => t.mission_kind !== 'PICKUP')
    .reduce(
      (acc: number, t: DeliveryTour) => acc + (t.delivered_quantity ?? 0),
      0
    )

  const tracked_bottles_out = eventsOut > 0 ? eventsOut : toursDelivered
  const tracked_bottles_in = eventsIn
  const tracked_volume = tracked_bottles_out

  return {
    tracked_volume,
    tracked_bottles_out,
    tracked_bottles_in,
  }
}

export function sumTrackedVolume(): number {
  return getTrackedTotals().tracked_volume
}

export function computeReconciliation(
  declaration: Declaration,
  trackedVolume?: number,
  toleranceOverride?: number,
  subsidyRateOverride?: number
): ReconciliationComputation {
  const tolerance = toleranceOverride ?? resolveTolerance()
  const subsidyRate = subsidyRateOverride ?? resolveSubsidyRate()
  const totals = getTrackedTotals()
  const tracked = trackedVolume ?? totals.tracked_volume
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
    tracked_bottles_out: totals.tracked_bottles_out,
    tracked_bottles_in: totals.tracked_bottles_in,
    volume_gap: volumeGap,
    gap_pct: Math.round(gapPct * 100) / 100,
    tolerance_pct: tolerance,
    within_tolerance: gapPct <= tolerance,
    subsidy_impact: Math.round(Math.abs(volumeGap) * subsidyRate),
  }
}

export function reconciliationFromDeclaration(
  decl: Declaration,
  existing?: Reconciliation
): Reconciliation {
  const comp = computeReconciliation(decl)
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? `rec-comp-${decl.id}`,
    declaration_id: decl.id,
    tracked_volume: comp.tracked_volume,
    tracked_bottles_out: comp.tracked_bottles_out,
    tracked_bottles_in: comp.tracked_bottles_in,
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
