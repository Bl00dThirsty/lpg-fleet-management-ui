import { useToursStore } from '@/store/tours-store'
import { apiAdapter } from '@lpg/api-client'
import type { Site, Organization, Vehicle, Driver, AppUser } from '@lpg/types'
import { client_sites, organizations, sites } from '@lpg/mock-data'
import type { PickupRequest, PickupStatus } from '@lpg/types'
import type { UserScope } from '@/features/scope/scope'
import {
  scopeBySiteOrCreator,
  scopeWithOrgId,
} from '@/features/scope/site-creator'
import { usePickupsStore } from '@/store/pickups-store'

export type { PickupStatus }

export interface Pickup {
  unit?: 'TM' | 'btl'
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

export const pickupStatusOptions: readonly {
  label: string
  value: PickupStatus
}[] = (Object.keys(pickupStatusLabels) as PickupStatus[]).map((v) => ({
  label: pickupStatusLabels[v],
  value: v,
}))

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
    validated_at:
      row.approved_quantity != null ? (row.created_at ?? null) : null,
    started_at: null,
    completed_at: row.status === 'COMPLETED' ? (row.updated_at ?? null) : null,
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
  rows?: PickupRequest[]
): Pickup[] {
  if (!rows && import.meta.env.VITE_API_MODE === 'http') {
    return useToursStore
      .getState()
      .tours.filter((t) => t.mission_kind === 'PICKUP' && !t.deleted_at)
      .map((t) => ({
        id: t.id,
        reference: t.tour_code ?? t.id,
        marketeur_org_id: t.marketeur_org_id,
        created_by: t.created_by ?? null,
        source_name: siteName(t.source_site_id ?? ''),
        destination_name: siteName(t.destination_site_id ?? ''),
        marketeur_name: orgName(t.marketeur_org_id),
        requested_quantity: t.requested_quantity,
        approved_quantity: t.requested_quantity,
        pickup_status: t.pickup_status ?? 'VALIDATED',
        requested_at: t.created_at ?? '',
        validated_at: t.created_at ?? null,
        started_at: t.started_at ?? null,
        completed_at: t.closed_at ?? null,
        proof_url: null,
        unit: t.type === 'VRAC' ? ('TM' as const) : ('btl' as const),
      }))
  }
  const views = (rows ?? usePickupsStore.getState().pickups)
    .filter((p) => !p.deleted_at)
    .map((p, i) => pickupView(p, i))
  if (!scope) return views
  return scopeBySiteOrCreator(
    views,
    scopeWithOrgId(scope),
    (row) => row.marketeur_org_id,
    (row) => row.created_by ?? undefined
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
export interface PickupOptions {
  sources: Site[]
  destinations: Site[]
  organizations: Organization[]
  vehicles: Vehicle[]
  drivers: Driver[]
  users: AppUser[]
}
export function getPickupOptions(): Promise<PickupOptions> {
  return apiAdapter.request<PickupOptions>('/pickup-options')
}
