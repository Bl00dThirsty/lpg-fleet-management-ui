import { describe, expect, it } from 'vitest'
import { curated } from '@lpg/mock-data'
import { toTourActivities } from '@/features/tours/data/tour-activity'
import {
  filterBulkTours,
  selectMarketerBulkTours,
  formatBulkTourDate,
} from './marketer-bulk-tours'

const orgId = 'org-0002-sctm-0000-000000000001'
describe('marketer bulk tours', () => {
  it('only selects non-deleted VRAC tours for the exact organization', () => {
    const rows = selectMarketerBulkTours(curated.delivery_tours, orgId)
    expect(rows.length).toBeGreaterThan(0)
    expect(
      rows.every(
        (tour) =>
          tour.type === 'VRAC' &&
          tour.marketeur_org_id === orgId &&
          !tour.deleted_at
      )
    ).toBe(true)
    expect(
      selectMarketerBulkTours(
        [{ ...rows[0]!, deleted_at: '2026-01-01' }],
        orgId
      )
    ).toEqual([])
    expect(selectMarketerBulkTours(curated.delivery_tours, 'unknown')).toEqual(
      []
    )
  })
  it('filters by delivery status and searches reference and truck', () => {
    const trips = toTourActivities(
      selectMarketerBulkTours(curated.delivery_tours, orgId),
      { vehicles: curated.vehicles, checkpoints: curated.checkpoints }
    )
    expect(
      filterBulkTours(trips, 'delivered', '').every(
        (trip) => trip.tourneeStatus === 'CLOSED'
      )
    ).toBe(true)
    expect(
      filterBulkTours(trips, 'all', trips[0]!.reference.toLowerCase())
    ).toContainEqual(trips[0])
    expect(filterBulkTours(trips, 'all', 'no-such-truck')).toEqual([])
  })
  it('does not show closed tours as current delays', () => {
    const trips = toTourActivities(
      selectMarketerBulkTours(curated.delivery_tours, orgId)
    )
    expect(
      filterBulkTours(
        [{ ...trips[0]!, onTime: false, tourneeStatus: 'CLOSED' }],
        'delayed',
        ''
      )
    ).toEqual([])
  })
  it('uses the final checkpoint date and sequence for the ETA', () => {
    const tour = selectMarketerBulkTours(curated.delivery_tours, orgId)[0]!
    const checkpoints = curated.checkpoints.filter(
      (checkpoint) => checkpoint.tournee_id === tour.id
    )
    const ordered = [...checkpoints].sort((a, b) => a.sequence - b.sequence)
    const trip = toTourActivities([tour], {
      checkpoints: [...ordered].reverse(),
    })[0]!
    expect(trip.expectedArrivalAt).toBe(
      ordered[ordered.length - 1]!.expected_arrival
    )
    expect(trip.stops[0]!.id).toBe(ordered[0]!.id)
  })
  it('handles missing ETA without an invalid date', () => {
    expect(formatBulkTourDate('')).toBe('Non renseignée')
  })
})
