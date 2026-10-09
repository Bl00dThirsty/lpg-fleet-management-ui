import { describe, expect, it } from 'vitest'
import type { DeliveryTour } from '@lpg/types'
import { buildDeliveryFlowSeries } from './delivery-flow'

function makeTestTour(partial: Partial<DeliveryTour>): DeliveryTour {
  return {
    id: 'tour-test-1',
    tour_code: 'TRP-001',
    type: 'VRAC',
    status: 'PLANNED',
    execution_mode: 'INTERNAL',
    marketeur_org_id: 'org-test',
    requested_quantity: 15,
    delivered_quantity: null,
    scheduled_at: null,
    started_at: null,
    closed_at: null,
    created_at: '2026-10-07T08:00:00Z',
    updated_at: '2026-10-07T08:00:00Z',
    created_by: 'user-test',
    updated_by: null,
    deleted_at: null,
    driver_id: null,
    livreur_user_id: null,
    vehicle_id: null,
    transporter_org_id: null,
    ...partial,
  } as DeliveryTour
}

describe('buildDeliveryFlowSeries', () => {
  it('aggregates planned quantities for PLANNED, ACKNOWLEDGED, and PENDINGTRANSPORTERACK tours', () => {
    const tours: DeliveryTour[] = [
      makeTestTour({ id: 't1', status: 'PLANNED', requested_quantity: 10, scheduled_at: '2026-10-08T08:00:00Z' }),
      makeTestTour({ id: 't2', status: 'ACKNOWLEDGED', requested_quantity: 15, scheduled_at: '2026-10-08T09:00:00Z' }),
      makeTestTour({ id: 't3', status: 'PENDINGTRANSPORTERACK', requested_quantity: 8, scheduled_at: '2026-10-09T08:00:00Z' }),
    ]
    const series = buildDeliveryFlowSeries(tours, 'VRAC')
    expect(series).toHaveLength(2)
    expect(series[0]).toEqual({ label: '2026-10-08', planned: 25, delivered: 0 })
    expect(series[1]).toEqual({ label: '2026-10-09', planned: 8, delivered: 0 })
  })

  it('aggregates delivered quantities for INPROGRESS, CHECKPOINTACTIVE, and CLOSED tours', () => {
    const tours: DeliveryTour[] = [
      makeTestTour({ id: 't1', status: 'INPROGRESS', delivered_quantity: 4, started_at: '2026-10-08T07:00:00Z' }),
      makeTestTour({ id: 't2', status: 'CLOSED', delivered_quantity: 16, started_at: '2026-10-08T08:00:00Z' }),
      makeTestTour({ id: 't3', status: 'CHECKPOINTACTIVE', delivered_quantity: 12, started_at: '2026-10-09T07:00:00Z' }),
    ]
    const series = buildDeliveryFlowSeries(tours, 'VRAC')
    expect(series).toHaveLength(2)
    expect(series[0]).toEqual({ label: '2026-10-08', planned: 0, delivered: 20 })
    expect(series[1]).toEqual({ label: '2026-10-09', planned: 0, delivered: 12 })
  })

  it('filters by unit (VRAC vs BOUTEILLES50KG)', () => {
    const tours: DeliveryTour[] = [
      makeTestTour({ id: 't1', type: 'VRAC', requested_quantity: 20, scheduled_at: '2026-10-08T08:00:00Z' }),
      makeTestTour({ id: 't2', type: 'BOUTEILLES50KG', requested_quantity: 100, scheduled_at: '2026-10-08T08:00:00Z' }),
    ]
    const vrac = buildDeliveryFlowSeries(tours, 'VRAC')
    expect(vrac).toEqual([{ label: '2026-10-08', planned: 20, delivered: 0 }])

    const bottles = buildDeliveryFlowSeries(tours, 'BOUTEILLES50KG')
    expect(bottles).toEqual([{ label: '2026-10-08', planned: 100, delivered: 0 }])
  })

  it('ignores deleted tours, pickups, drafts, and cancelled tours', () => {
    const tours: DeliveryTour[] = [
      makeTestTour({ id: 't1', deleted_at: '2026-10-08T00:00:00Z' }),
      makeTestTour({ id: 't2', mission_kind: 'PICKUP' } as unknown as Partial<DeliveryTour>),
      makeTestTour({ id: 't3', status: 'DRAFT' }),
      makeTestTour({ id: 't4', status: 'CANCELLED' }),
    ]
    expect(buildDeliveryFlowSeries(tours, 'VRAC')).toEqual([])
  })
})
