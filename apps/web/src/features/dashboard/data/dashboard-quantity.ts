import type { VehicleType } from '@lpg/types'

/** The only two legal GPL volume units. A quantity is always one of them. */
export const dashboardUnits = ['TM', 'btl'] as const

export type DashboardUnit = (typeof dashboardUnits)[number]

/**
 * The single volume contract of the national dashboard: a number paired with
 * the unit it was measured in. No field and no array is allowed to hold a
 * volume without its unit, so TM and btl can never be added together.
 */
export type DashboardQuantity = {
  value: number
  unit: DashboardUnit
}

/** Volume split per unit. A keyed record, never a mixed array. */
export type DashboardUnitTotals = Record<DashboardUnit, DashboardQuantity>

/** A unitless ratio computed against one unit denominator. */
export type DashboardUnitPercents = Record<DashboardUnit, number>

/**
 * A KPI value is either a GPL volume or a unitless count. Never both, so a card
 * can never claim a TM figure for a bottle count.
 */
export type DashboardMetricValue =
  | { kind: 'quantity'; quantity: DashboardQuantity }
  | { kind: 'count'; count: number }
  | { kind: 'percent'; percent: number }
  | { kind: 'days'; days: number }

export function totalUnitKeys(): readonly DashboardUnit[] {
  return dashboardUnits
}

export function quantity(value: number, unit: DashboardUnit): DashboardQuantity {
  return { value, unit }
}

/** VRAC is metric tonnes, BOUTEILLES50KG is a bottle count. No third case. */
export function unitForTruckType(type: VehicleType): DashboardUnit {
  return type === 'VRAC' ? 'TM' : 'btl'
}

export function emptyUnitTotals(): DashboardUnitTotals {
  return { TM: quantity(0, 'TM'), btl: quantity(0, 'btl') }
}

export function emptyUnitPercents(): DashboardUnitPercents {
  return { TM: 0, btl: 0 }
}

export function addUnitTotals(
  left: DashboardUnitTotals,
  right: DashboardUnitTotals,
): DashboardUnitTotals {
  return {
    TM: quantity(left.TM.value + right.TM.value, 'TM'),
    btl: quantity(left.btl.value + right.btl.value, 'btl'),
  }
}

/** Accumulate a quantity into the bucket of its own unit. */
export function accumulateUnitTotals(
  totals: DashboardUnitTotals,
  value: DashboardQuantity,
): DashboardUnitTotals {
  return {
    ...totals,
    [value.unit]: quantity(totals[value.unit].value + value.value, value.unit),
  }
}

export function addUnitPercent(
  percents: DashboardUnitPercents,
  unit: DashboardUnit,
  value: number,
): DashboardUnitPercents {
  return { ...percents, [unit]: value }
}

/** Sum quantities that all share the same unit; mixing units is a bug. */
export function sumQuantities(
  quantities: readonly DashboardQuantity[],
): DashboardQuantity {
  const [first, ...rest] = quantities
  if (!first) return quantity(0, 'TM')
  for (const candidate of rest) {
    if (candidate.unit !== first.unit) {
      throw new Error(
        `Cannot mix units: a ${candidate.unit} quantity cannot join a ${first.unit} total`,
      )
    }
  }
  return quantity(
    quantities.reduce((total, item) => total + item.value, 0),
    first.unit,
  )
}

/** The units a set of totals actually carries volume in, so no empty column renders. */
export function activeUnits(totals: DashboardUnitTotals): DashboardUnit[] {
  return dashboardUnits.filter((unit) => totals[unit].value > 0)
}

/** Share of `value` inside `total`, as a whole percent, 0 when total is 0. */
export function sharePercent(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}
