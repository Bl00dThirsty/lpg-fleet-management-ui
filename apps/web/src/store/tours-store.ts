import { create } from 'zustand'
import { curated } from '@lpg/mock-data'
import type { DeliveryTour, Checkpoint, ExecutionMode, TourneeType } from '@lpg/types'
import { type Role } from '@lpg/permissions'
import { toTourActivities, type TourActivity, type TourSlice } from '@/features/tours/data/tour-activity'
import {
  ACTION_PERMISSION,
  applyAction,
  tourActions,
  validateTour,
  type TourAction,
  type TourCrewPatch,
  type TourDraftCheckpoint,
} from '@/features/tours/data/tour-machine'
import { assertPermission, PERMISSION_DENIED } from '@/lib/security/guards'
import { getScope, isRegulateurView } from '@/features/scope/scope'
import { emitWs } from '@/lib/ws/mock-ws'
import { useAuthStore } from '@/store/auth-store'
import { useContractsStore } from '@/store/contracts-store'

/**
 * Payload for creating a tour. Mirrors the schema's `chk_tournee_internal` /
 * `chk_tournee_external` constraints: INTERNAL requires the marketeur's own
 * crew+vehicle, EXTERNAL requires a transporter_org_id and leaves the crew
 * NULL for the transporter to assign at acknowledgement time.
 *
 * `checkpoints` are the planned route stops (site XOR client_site, per
 * `chk_checkpoint_exclusive`); they become `checkpoints` rows in status
 * PENDING. `sourceSiteId` is the loading point captured by the wizard.
 */
export interface TourDraft {
  marketeur_org_id: string
  execution_mode: ExecutionMode
  type: TourneeType
  requested_quantity: number
  sourceSiteId?: string
  transporter_org_id?: string | null
  vehicle_id?: string | null
  driver_id?: string | null
  livreur_user_id?: string | null
  checkpoints?: TourDraftCheckpoint[]
}

interface ToursState {
  tours: DeliveryTour[]
  checkpoints: Checkpoint[]
  createTour: (draft: TourDraft) => TourActivity
  performAction: (id: string, action: TourAction, patch?: TourCrewPatch) => TourActivity
  views: (slice: TourSlice) => TourActivity[]
  viewById: (id: string) => TourActivity | undefined
}

export const useToursStore = create<ToursState>()((set, get) => ({
  tours: curated.delivery_tours.map((t) => ({ ...t })),
  checkpoints: curated.checkpoints.map((c) => ({ ...c })),

  createTour(draft: TourDraft) {
    // Defense in depth: the UI already gates the create button; a direct store
    // call must be permission-gated too. An unauthenticated caller defaults to
    // LIVREUR. Site-level access (assertSiteAccess) is intentionally not wired
    // here yet — it lands with a later Plan 5 step.
    const user = useAuthStore.getState().user
    const role: Role = user?.system_role ?? 'LIVREUR'
    assertPermission(role, 'tours.create')
    // Spec §8.1: a non-REGULATEUR user may only create tours for their own org.
    const scope = getScope(user)
    if (!isRegulateurView(scope) && draft.marketeur_org_id !== scope.orgId) {
      throw new Error(PERMISSION_DENIED)
    }
    const now = new Date().toISOString()
    // Initial status follows the schema §3.1 entry point per mode: INTERNAL is
    // created already crewed → PLANNED; EXTERNAL is created awaiting the
    // transporter's acknowledgement → PENDINGTRANSPORTERACK. The machine's
    // `plan` / `send-to-transporter` actions remain for the re-plan / re-send
    // paths on later editions of a tour.
    const initialStatus: DeliveryTour['status'] =
      draft.execution_mode === 'INTERNAL' ? 'PLANNED' : 'PENDINGTRANSPORTERACK'
    const tour: DeliveryTour = {
      id: newTourId(),
      marketeur_org_id: draft.marketeur_org_id,
      execution_mode: draft.execution_mode,
      source_site_id: draft.sourceSiteId ?? null,
      transporter_org_id: draft.transporter_org_id ?? null,
      vehicle_id: draft.vehicle_id ?? null,
      driver_id: draft.driver_id ?? null,
      livreur_user_id: draft.livreur_user_id ?? null,
      assigned_by_transporter_user_id: null,
      transporter_assigned_at: null,
      sent_to_transporter_at: null,
      type: draft.type,
      status: initialStatus,
      requested_quantity: draft.requested_quantity,
      loaded_quantity: null,
      delivered_quantity: null,
      started_at: null,
      closed_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      created_by: user?.id ?? null,
      updated_by: null,
    }
    // Validate the tour AND its planned checkpoints (route stops) before any
    // write; `checkpoints` carries the draft's site XOR client_site etc.
    const validation = validateTour(tour, {
      vehicles: curated.vehicles,
      contracts: useContractsStore.getState().all(),
      checkpoints: draft.checkpoints,
    })
    if (!validation.valid) {
      throw new Error(validation.errors[0])
    }

    // Draft checkpoints become checkpoints rows in status PENDING (the seeded
    // fixture statuses are PENDING/REACHED/COMPLETED/SKIPPED; a new tour starts
    // every stop pending).
    const checkpointsToAdd: Checkpoint[] = (draft.checkpoints ?? []).map((cp) => ({
      id: newCheckpointId(tour.id, cp.sequence),
      tournee_id: tour.id,
      site_id: cp.site_id ?? null,
      client_site_id: cp.client_site_id ?? null,
      sequence: cp.sequence,
      expected_quantity: cp.expected_quantity,
      expected_arrival: null,
      actual_arrival: null,
      status: 'PENDING',
      skip_reason: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      created_by: null,
      updated_by: null,
    }))

    // Optimistic apply with rollback: snapshot the rows before the write, and
    // on any failure restore the prior state and rethrow. The WS emit stays on
    // the success path only.
    const previousTours = get().tours.map((t) => ({ ...t }))
    const previousCheckpoints = get().checkpoints.map((c) => ({ ...c }))
    const allCheckpoints = [...previousCheckpoints, ...checkpointsToAdd]
    try {
      set({ tours: [tour, ...previousTours], checkpoints: allCheckpoints })
      emitWs('tour:update', { id: tour.id }, user?.id)
      return toTourActivities([tour], { checkpoints: allCheckpoints })[0]!
    } catch (error) {
      set({ tours: previousTours, checkpoints: previousCheckpoints })
      throw error
    }
  },

  performAction(id: string, action: TourAction, patch?: TourCrewPatch) {
    const actor = useAuthStore.getState().user
    const role: Role = actor?.system_role ?? 'LIVREUR'
    assertPermission(role, ACTION_PERMISSION[action])
    if (action === 'acknowledge' && !(patch?.vehicle_id && patch.driver_id && patch.livreur_user_id)) {
      throw new Error(
        "L'accusé de réception exige l'équipage du transporteur (véhicule, chauffeur, livreur).",
      )
    }
    const tours = get().tours
    const index = tours.findIndex((t) => t.id === id)
    if (index === -1) {
      throw new Error(`Tournée introuvable : ${id}`)
    }
    const current = tours[index]!
    const allowed = tourActions(current)
    if (!allowed.includes(action)) {
      throw new Error(`Transition interdite à l'état ${current.status}`)
    }
    const validation = validateTour(current, {
      vehicles: curated.vehicles,
      contracts: useContractsStore.getState().all(),
    })
    if (!validation.valid && action !== 'cancel') {
      throw new Error(validation.errors[0])
    }

    // Optimistic apply with rollback: snapshot the full rows array before the
    // write so a failure (e.g. the acknowledge org check or an emit throwing)
    // restores the prior state and rethrows. The WS emit stays on the success
    // path only.
    const previous = tours.map((t) => ({ ...t }))
    try {
      const result = applyAction(current, action, new Date(), patch)
      const next: DeliveryTour = { ...current, ...result }
      const nextTours = [...previous]
      nextTours[index] = next
      set({ tours: nextTours })
      emitWs('tour:update', { id: next.id }, actor?.id)
      return toTourActivities([next], { checkpoints: get().checkpoints })[0]!
    } catch (error) {
      set({ tours: previous })
      throw error
    }
  },

  views(slice: TourSlice) {
    const tours = get().tours
    const filtered =
      slice === 'ALL'
        ? tours
        : tours.filter((t) => {
            switch (slice) {
              case 'INTERNAL':
                return t.execution_mode === 'INTERNAL'
              case 'EXTERNAL':
                return t.execution_mode === 'EXTERNAL'
              case 'PENDING':
                return t.status === 'PENDINGTRANSPORTERACK'
              case 'ACTIVE':
                return t.status === 'INPROGRESS' || t.status === 'CHECKPOINTACTIVE'
              case 'HISTORY':
                return t.status === 'CLOSED' || t.status === 'CANCELLED'
              default:
                return true
            }
          })
    return toTourActivities(
      [...filtered].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
      { checkpoints: get().checkpoints },
    )
  },

  viewById(id: string) {
    const index = get().tours.findIndex((t) => t.id === id)
    if (index === -1) return undefined
    return toTourActivities([get().tours[index]!], { checkpoints: get().checkpoints })[0]
  },
}))

export function newTourId(): string {
  return `tournee-${Date.now()}`
}

export function newCheckpointId(tourId: string, sequence: number): string {
  return `${tourId}-seq-${sequence}`
}
