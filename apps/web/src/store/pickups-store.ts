import { create } from 'zustand'
import { curated, organizations, sites } from '@lpg/mock-data'
import type { PickupRequest, PickupStatus } from '@lpg/types'
import { type Role } from '@lpg/permissions'
import { assertPermission, assertSiteAccess } from '@/lib/security/guards'
import { getScope } from '@/features/scope/scope'
import { getPickupSourceFunctions } from '@/features/sites/lib/site-functions'
import { useAuthStore } from '@/store/auth-store'
import { emitWs } from '@/lib/ws/mock-ws'

/**
 * Payload for creating a Flux-1 pickup request. Mirrors the schema's
 * `pickup_requests` constraints: `requested_quantity > 0` and
 * `chk_pickup_sites_different` (source != destination). A new request is
 * created with status DRAFT; ADMIN confirmation later sets `approved_quantity`
 * and moves it to VALIDATED.
 */
export interface PickupDraft {
  marketeur_org_id: string
  source_site_id: string
  destination_site_id: string
  requested_quantity: number
}

export interface PickupValidationResult {
  valid: boolean
  errors: string[]
}

export interface PickupValidationOptions {
  /** site_function values allowed as the enlèvement origin (settings-driven default). */
  allowedSourceFunctions?: readonly string[]
}

const SOURCE_SITE_LOOKUP = new Map<string, { functions?: string[] | null }>()
function buildSiteIndex() {
  SOURCE_SITE_LOOKUP.clear()
  for (const s of sites) SOURCE_SITE_LOOKUP.set(s.id, { functions: s.functions ?? null })
}
buildSiteIndex()

export function validatePickup(
  input: PickupDraft,
  options?: PickupValidationOptions,
): PickupValidationResult {
  const errors: string[] = []

  if (input.source_site_id && input.destination_site_id && input.source_site_id === input.destination_site_id) {
    errors.push(
      'chk_pickup_sites_different: source and destination sites must differ',
    )
  }
  if (input.requested_quantity <= 0) {
    errors.push('chk_pickup_quantity: requested_quantity must be greater than 0')
  }
  if (!input.marketeur_org_id) {
    errors.push('pickup_requests.marketeur_org_id is mandatory')
  }
  if (!input.source_site_id || !input.destination_site_id) {
    errors.push('pickup_requests requires source_site_id and destination_site_id')
  }

  // Flux-1 rule: an enlèvement origin must be a supply point or a filling
  // centre (settings-driven). Mirrors the schema's site_function constraint.
  const allowed = options?.allowedSourceFunctions ?? getPickupSourceFunctions()
  if (input.source_site_id) {
    const source = SOURCE_SITE_LOOKUP.get(input.source_site_id)
    if (source && !source.functions?.some((f) => allowed.includes(f))) {
      errors.push(
        'chk_pickup_source_function: source must be a supply point or filling centre (CENTREEMPLISSEUR/POINTAPPROVISIONABLE), not a storage-only ENTREPOT',
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

interface PickupsState {
  pickups: PickupRequest[]
  createPickup: (draft: PickupDraft) => PickupRequest
  validatePickup: (id: string, approvedQuantity: number) => PickupRequest
  cancelPickup: (id: string) => PickupRequest
  all: () => PickupRequest[]
  viewById: (id: string) => PickupRequest | undefined
}

function seededIndex(key: string, modulus: number): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h % modulus
}

/**
 * Deterministic demo rows (DRAFT / VALIDATED / CANCELLED) that used to live in
 * the pickups view builder. They now seed the store so the store is the single
 * source of truth for the pickups screens while keeping the demo statuses.
 */
function demoSeed(): PickupRequest[] {
  const statuses: readonly PickupStatus[] = ['DRAFT', 'VALIDATED', 'CANCELLED']
  const marketeur = organizations.find((o) => o.type === 'MARKETEUR') ?? organizations[0]!
  const times: readonly [string, string][] = [
    ['2024-10-02T08:00:00Z', '2024-10-03T10:00:00Z'],
    ['2024-10-08T08:00:00Z', '2024-10-09T09:00:00Z'],
    ['2024-09-20T08:00:00Z', '2024-09-20T08:00:00Z'],
  ]
  return statuses.map((status, idx) => {
    const source = sites[seededIndex(`src-${idx}`, Math.max(sites.length, 1))] ?? sites[0]!
    const destination =
      sites[seededIndex(`dst-${idx}`, Math.max(sites.length, 1))] ?? sites[Math.min(1, sites.length - 1)]!
    const [requestedAt, updatedAt] = times[idx]!
    const requested = 15 + seededIndex(`qty-${idx}`, 4)
    return {
      id: `pickup-extra-${idx}`,
      marketeur_org_id: marketeur.id,
      source_site_id: source.id,
      destination_site_id: destination.id,
      requested_quantity: requested,
      approved_quantity: status === 'VALIDATED' ? requested : null,
      status,
      created_at: requestedAt,
      updated_at: updatedAt,
      deleted_at: null,
      created_by: null,
      updated_by: null,
    }
  })
}

export const usePickupsStore = create<PickupsState>()((set, get) => ({
  pickups: [...curated.pickup_requests, ...demoSeed()].map((p) => ({ ...p })),

  createPickup(draft: PickupDraft) {
    // Defense in depth: the UI already gates the create button; a direct store
    // call must be permission-gated too. An unauthenticated caller defaults to
    // LIVREUR. Site-level access is enforced against the source site: a
    // non-REGULATEUR user must hold source_site_id in their assigned scope.
    const user = useAuthStore.getState().user
    const role = (user?.system_role ?? 'LIVREUR') as Role
    assertPermission(role, 'pickups.create')
    const scope = getScope(user)
    assertSiteAccess(scope, draft.source_site_id)
    const validation = validatePickup(draft)
    if (!validation.valid) {
      throw new Error(validation.errors[0])
    }
    const now = new Date().toISOString()
    const pickup: PickupRequest = {
      id: newPickupId(),
      marketeur_org_id: draft.marketeur_org_id,
      source_site_id: draft.source_site_id,
      destination_site_id: draft.destination_site_id,
      requested_quantity: draft.requested_quantity,
      approved_quantity: null,
      status: 'DRAFT',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      created_by: user?.id ?? null,
      updated_by: null,
    }
    // Optimistic apply with rollback: snapshot the rows before the write, and
    // on any failure restore the prior state and rethrow. The WS emit stays on
    // the success path only.
    const previous = get().pickups.map((p) => ({ ...p }))
    try {
      set({ pickups: [pickup, ...previous] })
      emitWs('pickup:update', { id: pickup.id }, user?.id)
      return pickup
    } catch (error) {
      set({ pickups: previous })
      throw error
    }
  },

  validatePickup(id: string, approvedQuantity: number) {
    const user = useAuthStore.getState().user
    const role = (user?.system_role ?? 'LIVREUR') as Role
    // Only regulateur staff validate Flux-1 requests (pickups.validate is not
    // granted to MARKETEUR/TRANSPORTEUR/LIVREUR).
    assertPermission(role, 'pickups.validate')
    const index = get().pickups.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error(`Requête introuvable : ${id}`)
    }
    const current = get().pickups[index]!
    if (current.status !== 'DRAFT') {
      throw new Error(`Seule une requête en brouillon peut être validée (état ${current.status})`)
    }
    if (!Number.isFinite(approvedQuantity) || approvedQuantity <= 0) {
      throw new Error('La quantité approuvée doit être positive')
    }
    const previous = get().pickups.map((p) => ({ ...p }))
    const now = new Date().toISOString()
    try {
      const next: PickupRequest = {
        ...current,
        status: 'VALIDATED',
        approved_quantity: approvedQuantity,
        updated_at: now,
        updated_by: user?.id ?? null,
      }
      const rows = [...previous]
      rows[index] = next
      set({ pickups: rows })
      emitWs('pickup:update', { id }, user?.id)
      return next
    } catch (error) {
      set({ pickups: previous })
      throw error
    }
  },

  cancelPickup(id: string) {
    const user = useAuthStore.getState().user
    const role = (user?.system_role ?? 'LIVREUR') as Role
    assertPermission(role, 'pickups.write')
    const index = get().pickups.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error(`Requête introuvable : ${id}`)
    }
    const current = get().pickups[index]!
    if (current.status === 'CANCELLED' || current.status === 'COMPLETED') {
      throw new Error(`Une requête ${current.status.toLowerCase()} ne peut pas être annulée`)
    }
    const previous = get().pickups.map((p) => ({ ...p }))
    const now = new Date().toISOString()
    try {
      const next: PickupRequest = {
        ...current,
        status: 'CANCELLED',
        updated_at: now,
        updated_by: user?.id ?? null,
      }
      const rows = [...previous]
      rows[index] = next
      set({ pickups: rows })
      emitWs('pickup:update', { id }, user?.id)
      return next
    } catch (error) {
      set({ pickups: previous })
      throw error
    }
  },

  all() {
    return [...get().pickups].sort((a, b) =>
      (b.created_at ?? '').localeCompare(a.created_at ?? ''),
    )
  },

  viewById(id: string) {
    return get().pickups.find((p) => p.id === id)
  },
}))

export function newPickupId(): string {
  return `pickup-${Date.now()}`
}

export const pickupStatusLabels: Record<PickupStatus, string> = {
  DRAFT: 'Brouillon',
  VALIDATED: 'Validée',
  INPROGRESS: 'En cours',
  COMPLETED: 'Complétée',
  CANCELLED: 'Annulée',
}