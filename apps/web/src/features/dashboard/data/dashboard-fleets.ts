import { isActiveTourStatus, type RouteTripView } from '@/features/tours/data/tour-activity'
import type { Truck } from '@/features/trucks/data/trucks'
import {
  accumulateUnitTotals,
  emptyUnitPercents,
  emptyUnitTotals,
  quantity,
  sharePercent,
  totalUnitKeys,
  unitForTruckType,
  type DashboardQuantity,
  type DashboardUnit,
  type DashboardUnitPercents,
  type DashboardUnitTotals,
} from './dashboard-quantity'

/**
 * Distinct hues, one per fleet, so two segments of the same chart never collapse
 * onto the same colour. The palette is indexed by the fleet ranking, which every
 * builder in this module derives from the same helper.
 */
const fleetPalette = [
  '#0f766e',
  '#0284c7',
  '#ca8a04',
  '#7c3aed',
  '#be123c',
  '#15803d',
  '#c2410c',
  '#4338ca',
] as const

export type DashboardFleetSummary = {
  fleetName: string
  truckCount: number
  activeTruckCount: number
  activeTripCount: number
  transported: DashboardUnitTotals
  delivered: DashboardUnitTotals
  remaining: DashboardUnitTotals
  sharePercent: DashboardUnitPercents
  utilizationPercent: number
  onTimeRate: number
  riskTruckCount: number
  color: string
}

export type DashboardFlowSegment = {
  id: string
  label: string
  quantity: DashboardQuantity
  amount: DashboardQuantity
  sharePercent: number
  color: string
}

type FleetAccumulator = {
  fleetName: string
  truckCount: number
  activeTruckCount: number
  activeTripCount: number
  riskTruckCount: number
  onTimeTripCount: number
  settledTripCount: number
  transported: DashboardUnitTotals
  delivered: DashboardUnitTotals
  remaining: DashboardUnitTotals
}

function emptyAccumulator(fleetName: string): FleetAccumulator {
  return {
    fleetName,
    truckCount: 0,
    activeTruckCount: 0,
    activeTripCount: 0,
    riskTruckCount: 0,
    onTimeTripCount: 0,
    settledTripCount: 0,
    transported: emptyUnitTotals(),
    delivered: emptyUnitTotals(),
    remaining: emptyUnitTotals(),
  }
}

function hasSignal(entry: FleetAccumulator): boolean {
  return (
    entry.transported.TM.value > 0 ||
    entry.transported.btl.value > 0 ||
    entry.activeTripCount > 0
  )
}

function accumulateTrip(entry: FleetAccumulator, trip: RouteTripView): void {
  const unit = unitForTruckType(trip.truck.type)
  entry.transported = accumulateUnitTotals(
    entry.transported,
    quantity(trip.loadedQuantity, unit),
  )
  entry.delivered = accumulateUnitTotals(
    entry.delivered,
    quantity(trip.deliveredQuantity, unit),
  )
  entry.remaining = accumulateUnitTotals(
    entry.remaining,
    quantity(trip.remainingQuantity, unit),
  )
  if (isActiveTourStatus(trip.tourneeStatus)) entry.activeTripCount += 1
  if (trip.status !== 'planned') {
    entry.settledTripCount += 1
    if (trip.onTime) entry.onTimeTripCount += 1
  }
}

function accumulateTruck(entry: FleetAccumulator, truck: Truck): void {
  entry.truckCount += 1
  if (isActiveTourStatus(truck.tournee_status)) entry.activeTruckCount += 1
  if (truck.risk_level !== 'FAIBLE') entry.riskTruckCount += 1
}

/**
 * The single fleet ordering used by both the fleet summaries and the flow
 * segments, so a carrier keeps the same colour everywhere on the dashboard.
 */
export function resolveFleetRanking(
  trips: readonly RouteTripView[],
): string[] {
  const accumulators = new Map<string, FleetAccumulator>()
  for (const trip of trips) {
    const fleetName = trip.truck.tenant_name
    const entry = accumulators.get(fleetName) ?? emptyAccumulator(fleetName)
    accumulateTrip(entry, trip)
    accumulators.set(fleetName, entry)
  }
  return [...accumulators.values()]
    .filter(hasSignal)
    .sort(
      (left, right) =>
        right.activeTripCount - left.activeTripCount ||
        left.fleetName.localeCompare(right.fleetName),
    )
    .map((entry) => entry.fleetName)
}

export function fleetColorFor(fleetName: string, ranking: readonly string[]): string {
  const index = ranking.indexOf(fleetName)
  return fleetPalette[(index < 0 ? 0 : index) % fleetPalette.length]!
}

export function buildFleetSummaries(input: {
  trucks: readonly Truck[]
  trips: readonly RouteTripView[]
  totalTransported: DashboardUnitTotals
}): DashboardFleetSummary[] {
  const ranking = resolveFleetRanking(input.trips)
  const accumulators = new Map<string, FleetAccumulator>()

  for (const truck of input.trucks) {
    if (!ranking.includes(truck.tenant_name)) continue
    const entry =
      accumulators.get(truck.tenant_name) ?? emptyAccumulator(truck.tenant_name)
    accumulateTruck(entry, truck)
    accumulators.set(truck.tenant_name, entry)
  }
  for (const trip of input.trips) {
    const fleetName = trip.truck.tenant_name
    if (!ranking.includes(fleetName)) continue
    const entry = accumulators.get(fleetName) ?? emptyAccumulator(fleetName)
    accumulateTrip(entry, trip)
    accumulators.set(fleetName, entry)
  }

  return ranking.map((fleetName) => {
    const entry = accumulators.get(fleetName) ?? emptyAccumulator(fleetName)
    const shares = emptyUnitPercents()
    for (const unit of totalUnitKeys()) {
      shares[unit] = sharePercent(
        entry.transported[unit].value,
        input.totalTransported[unit].value,
      )
    }

    return {
      fleetName,
      truckCount: entry.truckCount,
      activeTruckCount: entry.activeTruckCount,
      activeTripCount: entry.activeTripCount,
      transported: entry.transported,
      delivered: entry.delivered,
      remaining: entry.remaining,
      sharePercent: shares,
      utilizationPercent: sharePercent(entry.activeTruckCount, entry.truckCount),
      onTimeRate: sharePercent(entry.onTimeTripCount, entry.settledTripCount),
      riskTruckCount: entry.riskTruckCount,
      color: fleetColorFor(fleetName, ranking),
    }
  })
}


/**
 * One segment list per unit. A segment never mixes units, and the segments of a
 * given unit share against that unit's own total.
 */
export function buildFlowBreakdown(
  trips: readonly RouteTripView[],
  totalTransported: DashboardUnitTotals,
): Record<DashboardUnit, DashboardFlowSegment[]> {
  const ranking = resolveFleetRanking(trips)
  const breakdown: Record<DashboardUnit, DashboardFlowSegment[]> = {
    TM: [],
    btl: [],
  }

  for (const fleetName of ranking) {
    const tripsForFleet = trips.filter(
      (trip) => trip.truck.tenant_name === fleetName,
    )
    for (const unit of totalUnitKeys()) {
      const total = tripsForFleet
        .filter((trip) => unitForTruckType(trip.truck.type) === unit)
        .reduce((sum, trip) => sum + trip.loadedQuantity, 0)
      if (total <= 0) continue
      const amount = quantity(total, unit)
      breakdown[unit].push({
        id: `fleet-${fleetName.toLowerCase().replace(/\s+/g, '-')}-${unit.toLowerCase()}`,
        label: fleetName,
        quantity: amount,
        amount,
        sharePercent: sharePercent(total, totalTransported[unit].value),
        color: fleetColorFor(fleetName, ranking),
      })
    }
  }

  return breakdown
}
