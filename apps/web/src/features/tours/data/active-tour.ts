import { curated } from '@lpg/mock-data'
import type { TourneeStatus, DeliveryTour } from '@lpg/types'
import { buildTourActivity, type TourActivity } from './tour-activity'
import { useToursStore } from '@/store/tours-store'

export const ACTIVE_TOUR_STATUSES: readonly TourneeStatus[] = [
  'INPROGRESS',
  'CHECKPOINTACTIVE',
]

export function activeTourForVehicle(
  vehicleId: string,
  storeTours = useToursStore.getState().tours,
): TourActivity | null {
  const tours = (import.meta.env.VITE_API_MODE === 'http' || (storeTours && storeTours.length > 0)) ? storeTours : (curated.delivery_tours as DeliveryTour[])
  const matches = tours
    .filter((t) => t.vehicle_id === vehicleId)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  const active = matches.find((t) =>
    (ACTIVE_TOUR_STATUSES as readonly TourneeStatus[]).includes(t.status),
  )
  if (!active) return null
  return buildTourActivity(active, tours.indexOf(active))
}

export function vehicleActiveTourLink(vehicleId: string): string | null {
  const tour = activeTourForVehicle(vehicleId)
  return tour ? `/tour-tracking/${tour.id}` : null
}