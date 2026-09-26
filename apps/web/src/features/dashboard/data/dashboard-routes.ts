import type { RouteTripStatus, RouteTripView } from '@/features/tours/data/tour-activity'
import {
  quantity,
  sharePercent,
  unitForTruckType,
  type DashboardQuantity,
  type DashboardUnit,
  type DashboardUnitTotals,
} from './dashboard-quantity'

export type DashboardRouteContribution = {
  id: string
  reference: string
  carrierName: string
  truckId: string
  plateNumber: string
  driverName: string
  missionLead: string
  customerName: string
  originLabel: string
  destinationLabel: string
  unit: DashboardUnit
  loaded: DashboardQuantity
  delivered: DashboardQuantity
  remaining: DashboardQuantity
  transportedSharePercent: number
  deliveredSharePercent: number
  status: RouteTripStatus
  onTime: boolean
}

export function buildRouteContributions(
  trips: readonly RouteTripView[],
  totals: {
    totalTransported: DashboardUnitTotals
    totalDelivered: DashboardUnitTotals
  },
): DashboardRouteContribution[] {
  return trips
    .map((trip) => {
      const unit = unitForTruckType(trip.truck.type)

      return {
        id: trip.id,
        reference: trip.reference,
        carrierName: trip.truck.tenant_name,
        truckId: trip.truck.id,
        plateNumber: trip.truck.license_plate,
        driverName: trip.truck.assigned_driver ?? '',
        missionLead: trip.missionLead ?? '',
        customerName: trip.customerName ?? '',
        originLabel: trip.originSite.city,
        destinationLabel: trip.destinationSite.city,
        unit,
        loaded: quantity(trip.loadedQuantity, unit),
        delivered: quantity(trip.deliveredQuantity, unit),
        remaining: quantity(trip.remainingQuantity, unit),
        transportedSharePercent: sharePercent(
          trip.loadedQuantity,
          totals.totalTransported[unit].value,
        ),
        deliveredSharePercent: sharePercent(
          trip.deliveredQuantity,
          totals.totalDelivered[unit].value,
        ),
        status: trip.status,
        onTime: trip.onTime,
      }
    })
    .sort((left, right) => right.loaded.value - left.loaded.value)
}
