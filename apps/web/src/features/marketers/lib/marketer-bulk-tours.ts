import type { DeliveryTour } from '@lpg/types'
import type { TourActivity } from '@/features/tours/data/tour-activity'

export type BulkTourFilter = 'all' | 'active' | 'delivered' | 'delayed'

export function selectMarketerBulkTours(
  tours: readonly DeliveryTour[],
  marketerId: string
) {
  return tours.filter(
    (tour) =>
      tour.marketeur_org_id === marketerId &&
      tour.type === 'VRAC' &&
      !tour.deleted_at
  )
}

export function matchesBulkTourFilter(
  trip: TourActivity,
  filter: BulkTourFilter
) {
  if (filter === 'active')
    return (
      trip.tourneeStatus === 'INPROGRESS' ||
      trip.tourneeStatus === 'CHECKPOINTACTIVE'
    )
  if (filter === 'delivered') return trip.tourneeStatus === 'CLOSED'
  if (filter === 'delayed')
    return (
      !trip.onTime &&
      trip.tourneeStatus !== 'CLOSED' &&
      trip.tourneeStatus !== 'CANCELLED'
    )
  return true
}

export function filterBulkTours(
  trips: TourActivity[],
  filter: BulkTourFilter,
  query: string
) {
  const search = query.trim().toLocaleLowerCase('fr')
  return trips.filter(
    (trip) =>
      matchesBulkTourFilter(trip, filter) &&
      [
        trip.reference,
        trip.vehicle_plate,
        trip.driver_name,
        trip.customerName,
        trip.originSite.name,
        trip.destinationSite.name,
      ].some((value) => value?.toLocaleLowerCase('fr').includes(search))
  )
}

export function formatBulkTourDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Non renseignée'
    : new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
}
