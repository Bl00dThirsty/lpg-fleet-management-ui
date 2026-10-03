import { describe, expect, it } from 'vitest'
import { curated } from '@lpg/mock-data'
import {
  activeTourForVehicle,
  ACTIVE_TOUR_STATUSES,
  vehicleActiveTourLink,
} from './active-tour'

describe('active-tour lookup', () => {
  it('picks the running tour for a vehicle that is on the road', () => {
    const vehicleId = curated.delivery_tours.find(
      (t) => t.status === 'INPROGRESS' || t.status === 'CHECKPOINTACTIVE',
    )?.vehicle_id
    if (!vehicleId) return
    const tour = activeTourForVehicle(vehicleId)
    expect(tour).not.toBeNull()
    expect(tour!.tourneeStatus).toMatch(/^(INPROGRESS|CHECKPOINTACTIVE)$/)
  })

  it('produces a /tour-tracking/<id> link for the running tour', () => {
    const vehicleId = curated.delivery_tours.find((t) => t.status === 'CHECKPOINTACTIVE')
      ?.vehicle_id
    if (!vehicleId) return
    expect(vehicleActiveTourLink(vehicleId)).toMatch(/^\/tour-tracking\//)
  })

  it('returns null for a vehicle with no active tour', () => {
    const orphan = curated.vehicles.find(
      (v) => !curated.delivery_tours.some((t) => t.vehicle_id === v.id),
    )
    if (!orphan) return
    expect(activeTourForVehicle(orphan.id)).toBeNull()
  })

  it('ACTIVE_TOUR_STATUSES covers INPROGRESS and CHECKPOINTACTIVE', () => {
    expect(ACTIVE_TOUR_STATUSES).toContain('INPROGRESS')
    expect(ACTIVE_TOUR_STATUSES).toContain('CHECKPOINTACTIVE')
  })
})
