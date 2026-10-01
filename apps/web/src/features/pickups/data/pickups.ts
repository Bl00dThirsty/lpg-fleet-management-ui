import { client_sites, organizations, sites } from '@lpg/mock-data'
import type { PickupRequest, PickupStatus } from '@lpg/types'
import type { UserScope } from '@/features/scope/scope'
import { scopeBySiteOrCreator, scopeWithOrgId } from '@/features/scope/site-creator'
import { usePickupsStore } from '@/store/pickups-store'

export type { PickupStatus }

export interface Pickup {
  id: string
  reference: string
  marketeur_org_id: string
  created_by: string | null
  source_name: string
  destination_name: string
  marketeur_name: string
  requested_quantity: number
  approved_quantity: number | null
  pickup_status: PickupStatus
  requested_at: string
  validated_at: string | null
  started_at: string | null
  completed_at: string | null
  proof_url: string | null
}

export const pickupStatusLabels: Record<PickupStatus, string> = {
  DRAFT: 'Brouillon',
  VALIDATED: 'Validée',
  INPROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
}

export const pickupStatusOptions: readonly { label: string; value: PickupStatus }[] = (
  Object.keys(pickupStatusLabels) as PickupStatus[]
).map((v) => ({ label: pickupStatusLabels[v], value: v }))

const allSites = [...sites, ...client_sites]

export function siteName(id: string): string {
  return allSites.find((s) => s.id === id)?.name ?? id
}

export function orgName(id: string): string {
  return organizations.find((o) => o.id === id)?.name ?? id
}

function pickupView(row: PickupRequest, index: number): Pickup {
  return {
    id: row.id,
    reference: `PU-${1001 + index}`,
    marketeur_org_id: row.marketeur_org_id,
    created_by: row.created_by ?? null,
    source_name: siteName(row.source_site_id),
    destination_name: siteName(row.destination_site_id),
    marketeur_name: orgName(row.marketeur_org_id),
    requested_quantity: row.requested_quantity,
    approved_quantity: row.approved_quantity ?? null,
    pickup_status: row.status,
    requested_at: row.created_at ?? '',
    validated_at: row.approved_quantity != null ? row.created_at ?? null : null,
    started_at: null,
    completed_at: row.status === 'COMPLETED' ? row.updated_at ?? null : null,
    proof_url: null,
  }
}

/**
 * Pickup list scoped to the user. The single source of truth is the pickups
 * store (seeded from the curated fixtures + demo rows + every request created,
 * validated or cancelled in the session), so mutations surface here.
 */
export function getPickups(
  scope?: UserScope,
  rows: PickupRequest[] = usePickupsStore.getState().pickups,
): Pickup[] {
  const views = rows.map((p, i) => pickupView(p, i))
  if (!scope) return views
  return scopeBySiteOrCreator(
    views,
    scopeWithOrgId(scope),
    (row) => row.marketeur_org_id,
    (row) => row.created_by ?? undefined,
  )
}

export function getPickupSummary(rows: Pickup[]) {
  return {
    total: rows.length,
    draft: rows.filter((r) => r.pickup_status === 'DRAFT').length,
    validated: rows.filter((r) => r.pickup_status === 'VALIDATED').length,
    inProgress: rows.filter((r) => r.pickup_status === 'INPROGRESS').length,
    completed: rows.filter((r) => r.pickup_status === 'COMPLETED').length,
    cancelled: rows.filter((r) => r.pickup_status === 'CANCELLED').length,
  }
}