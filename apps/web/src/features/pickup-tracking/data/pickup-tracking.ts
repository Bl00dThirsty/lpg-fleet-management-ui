import { getPickups, pickupStatusLabels, type Pickup, type PickupStatus } from '@/features/pickups/data/pickups'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'

export interface PickupTrackView {
  id: string
  reference: string
  source_name: string
  destination_name: string
  marketeur_name: string
  quantity_label: string
  status: PickupStatus
  status_label: string
  requested_at: string
  validated_at: string | null
  started_at: string | null
  completed_at: string | null
  stage: number
}

const STAGE_BY_STATUS: Record<PickupStatus, number> = {
  DRAFT: 0,
  VALIDATED: 1,
  INPROGRESS: 2,
  COMPLETED: 3,
  CANCELLED: -1,
}

const STAGE_LABELS = ['Demandée', 'Validée', 'En cours', 'Terminée'] as const

export const PICKUP_STAGES = STAGE_LABELS

export function pickupStageLabel(status: PickupStatus): string {
  const stage = STAGE_BY_STATUS[status]
  return stage === -1 ? 'Annulée' : STAGE_LABELS[stage] ?? status
}

function toView(p: Pickup): PickupTrackView {
  return {
    id: p.id,
    reference: p.reference,
    source_name: p.source_name,
    destination_name: p.destination_name,
    marketeur_name: p.marketeur_name,
    quantity_label: `${p.requested_quantity.toLocaleString('fr-FR')} TM`,
    status: p.pickup_status,
    status_label: pickupStatusLabels[p.pickup_status],
    requested_at: p.requested_at,
    validated_at: p.validated_at,
    started_at: p.started_at,
    completed_at: p.completed_at,
    stage: STAGE_BY_STATUS[p.pickup_status],
  }
}

export function getLivePickupTrack(
  rows: Pickup[] = getPickups(getScope(useAuthStore.getState().user)),
): PickupTrackView[] {
  return rows
    .filter((p) => p.pickup_status === 'VALIDATED' || p.pickup_status === 'INPROGRESS')
    .map(toView)
}

export function getRecentPickupTrack(
  limit = 6,
  rows: Pickup[] = getPickups(getScope(useAuthStore.getState().user)),
): PickupTrackView[] {
  return rows
    .filter((p) => p.pickup_status !== 'DRAFT')
    .map(toView)
    .sort((a, b) => b.requested_at.localeCompare(a.requested_at))
    .slice(0, limit)
}

export interface SitePickupLoad {
  site_id: string
  site_name: string
  inbound: number
  outbound: number
}

export function getSitePickupLoad(
  rows: Pickup[] = getPickups(getScope(useAuthStore.getState().user)),
): SitePickupLoad[] {
  const counts = new Map<string, { inbound: number; outbound: number }>()
  const touch = (id: string) => {
    if (!counts.has(id)) counts.set(id, { inbound: 0, outbound: 0 })
  }

  for (const p of rows) {
    if (p.pickup_status === 'CANCELLED' || p.pickup_status === 'DRAFT') continue
    touch(p.source_name)
    touch(p.destination_name)
    const src = counts.get(p.source_name)!
    src.outbound += p.requested_quantity
    const dst = counts.get(p.destination_name)!
    dst.inbound += p.requested_quantity
  }

  return Array.from(counts.entries())
    .map(([site_name, v]) => ({
      site_id: site_name,
      site_name,
      inbound: v.inbound,
      outbound: v.outbound,
    }))
    .sort((a, b) => b.outbound + b.inbound - (a.outbound + a.inbound))
}

export function getPickupTrackSummary(rows: PickupTrackView[]) {
  return {
    inProgress: rows.filter((r) => r.status === 'INPROGRESS').length,
    validated: rows.filter((r) => r.status === 'VALIDATED').length,
  }
}