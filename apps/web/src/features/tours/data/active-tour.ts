import { curated } from '@lpg/mock-data'
import type { TourneeStatus } from '@lpg/types'
import { buildTourActivity, type TourActivity } from './tour-activity'

export const ACTIVE_TOUR_STATUSES: readonly TourneeStatus[] = [
  'INPROGRESS',
  'CHECKPOINTACTIVE',
]

export function activeTourForVehicle(vehicleId: string): TourActivity | null {
  const matches = curated.delivery_tours
    .filter((t) => t.vehicle_id === vehicleId)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  const active = matches.find((t) =>
    (ACTIVE_TOUR_STATUSES as readonly TourneeStatus[]).includes(t.status),
  )
  if (!active) return null
  return buildTourActivity(active, curated.delivery_tours.indexOf(active))
}

export function vehicleActiveTourLink(vehicleId: string): string | null {
  const tour = activeTourForVehicle(vehicleId)
  return tour ? `/tour-tracking/${tour.id}` : null
}
