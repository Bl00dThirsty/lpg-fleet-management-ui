import type { DeliveryTour } from '@lpg/types'
import { missionDay } from '@/features/map/lib/mission-filters'
export type DeliveryFlowUnit = DeliveryTour['type']
export type DeliveryFlowPoint = { label: string; planned: number; delivered: number }
/** Input rows have already been scoped and filtered by the dashboard. */
export function buildDeliveryFlowSeries(tours: readonly DeliveryTour[], unit: DeliveryFlowUnit): DeliveryFlowPoint[] {
  const buckets = new Map<string, DeliveryFlowPoint>()
  for (const tour of tours) {
    if (tour.deleted_at || tour.mission_kind === 'PICKUP' || tour.type !== unit || ['DRAFT', 'CANCELLED'].includes(tour.status)) continue
    const day = missionDay(tour)
    if (!day) continue
    const row = buckets.get(day) ?? { label: day, planned: 0, delivered: 0 }
    if (['PLANNED', 'ACKNOWLEDGED', 'PENDINGTRANSPORTERACK'].includes(tour.status)) row.planned += Math.max(0, tour.requested_quantity ?? 0)
    if (['INPROGRESS', 'CHECKPOINTACTIVE', 'CLOSED'].includes(tour.status)) row.delivered += Math.max(0, tour.delivered_quantity ?? 0)
    buckets.set(day, row)
  }
  return [...buckets.values()].sort((a,b) => a.label.localeCompare(b.label))
}
