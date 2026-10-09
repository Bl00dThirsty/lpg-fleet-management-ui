import type { DeliveryTour } from '@lpg/types'
import { missionDay } from '@/features/map/lib/mission-filters'

export function summarizeTours(tours: readonly DeliveryTour[]) {
  const rows = tours.filter(t => !t.deleted_at && t.mission_kind !== 'PICKUP')
  const count = (status: DeliveryTour['status']) => rows.filter(t => t.status === status).length
  const planned = rows.filter(t => ['PLANNED', 'ACKNOWLEDGED', 'PENDINGTRANSPORTERACK'].includes(t.status))
  const executing = rows.filter(t => ['INPROGRESS', 'CHECKPOINTACTIVE', 'CLOSED'].includes(t.status))
  const quantity = (items: readonly DeliveryTour[], field: 'requested_quantity' | 'delivered_quantity', type: DeliveryTour['type']) => items.filter(t => t.type === type).reduce((sum, t) => sum + Math.max(0, t[field] ?? 0), 0)
  const round1 = (n: number) => Math.round(n * 10) / 10
  return {
    total: rows.length,
    planned: count('PLANNED'),
    waiting: count('PENDINGTRANSPORTERACK'),
    acknowledged: count('ACKNOWLEDGED'),
    active: count('INPROGRESS') + count('CHECKPOINTACTIVE'),
    closed: count('CLOSED'),
    cancelled: count('CANCELLED'),
    draft: count('DRAFT'),
    plannedVrac: round1(quantity(planned, 'requested_quantity', 'VRAC')),
    plannedBottles: round1(quantity(planned, 'requested_quantity', 'BOUTEILLES50KG')),
    deliveredVrac: round1(quantity(executing, 'delivered_quantity', 'VRAC')),
    deliveredBottles: round1(quantity(executing, 'delivered_quantity', 'BOUTEILLES50KG')),
    undated: rows.filter(t => !missionDay(t)).length,
  }
}
