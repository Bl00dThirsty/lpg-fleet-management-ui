import { create } from 'zustand'
import { api, apiAdapter } from '@lpg/api-client'
import { curated } from '@lpg/mock-data'
import {
  assertPermission,
  assertActorPermission,
  PERMISSION_DENIED,
} from '@/lib/security/guards'
import {
  canViewAllTourCrew,
  canUseTourCrewMember,
  isTourLivreur,
} from '@/features/tours/lib/tour-create-helpers'
import { useUsersStore } from '@/store/users-store'
import { emitWs } from '@/lib/ws/mock-ws'
import { useContractsStore } from '@/store/contracts-store'
import { useAuthStore } from '@/store/auth-store'
import type { Role } from '@lpg/permissions'
import type {
  PickupPlan,
  Checkpoint,
  DeliveryTour,
  DeliveryEvent,
  ScanEvent,
  ExecutionMode,
  TourneeType,
} from '@lpg/types'
import { isHydrationFresh } from '@/lib/hydration'
import {
  toTourActivities,
  type TourActivity,
  type TourSlice,
} from '@/features/tours/data/tour-activity'
import {
  applyAction,
  tourActions,
  validateTour,
  ACTION_PERMISSION,
  canEditTour,
  type TourAction,
  type TourCrewPatch,
  type TourDraftCheckpoint,
} from '@/features/tours/data/tour-machine'

/**
 * Payload for creating a tour. Mirrors the schema's `chk_tournee_internal` /
 * `chk_tournee_external` constraints: INTERNAL requires the marketeur's own
 * crew+vehicle, EXTERNAL requires a transporter_org_id and leaves the crew
 * NULL for the transporter to assign at acknowledgement time.
 */
export interface TourDraft {
  id?: string
  tour_code?: string
  status?: DeliveryTour['status']
  marketeur_org_id: string
  execution_mode: ExecutionMode
  type: TourneeType
  requested_quantity: number
  sourceSiteId?: string | null
  source_site_id?: string | null
  transporter_org_id?: string | null
  vehicle_id?: string | null
  driver_id?: string | null
  livreur_user_id?: string | null
  checkpoints?: Array<
    TourDraftCheckpoint &
      Partial<Checkpoint> & {
        destination_site_id?: string
        planned_quantity?: number
      }
  >
}

export interface ActionExtraParams {
  reason?: string
  loadedQuantity?: number
  deliveredQuantity?: number
  driverId?: string
  driver_id?: string
  livreurPersonId?: string
  livreurUserId?: string
  livreur_user_id?: string
  vehicleId?: string
  vehicle_id?: string
  assigned_by_transporter_user_id?: string | null
  transporter_assigned_at?: string | null
}

interface ToursState {
  tours: DeliveryTour[]
  checkpoints: Checkpoint[]
  checkpointsByTour: Record<string, Checkpoint[]>
  checkpointsLoading: Record<string, boolean>
  loading: boolean
  error: string | null
  hasLoaded: boolean
  lastFetchedAt: number
  deliveryEvents: DeliveryEvent[]
  scanEvents: ScanEvent[]

  recordDeliveryEvent: (event: DeliveryEvent) => void
  recordScanEvent: (event: ScanEvent) => void
  recordBulkScanEvents: (events: ScanEvent[]) => void

  fetchTours: (force?: boolean, silent?: boolean) => Promise<void>
  createPickupAsync: (draft: PickupPlan) => Promise<DeliveryTour>
  fetchCheckpoints: (
    tourId: string,
    force?: boolean,
    silent?: boolean
  ) => Promise<Checkpoint[]>
  createTour: (draft: TourDraft) => TourActivity
  createTourAsync: (draft: TourDraft) => Promise<TourActivity>
  updateTourAsync: (
    id: string,
    patch: Partial<TourDraft>
  ) => Promise<TourActivity>
  performAction: (
    id: string,
    action: TourAction,
    patch?: TourCrewPatch | ActionExtraParams
  ) => TourActivity
  performActionAsync: (
    id: string,
    action: TourAction,
    extra?: ActionExtraParams
  ) => Promise<TourActivity>
  assignDriver: (
    id: string,
    driverId?: string,
    livreurPersonId?: string
  ) => Promise<TourActivity>
  assignVehicle: (id: string, vehicleId: string) => Promise<TourActivity>
  reachCheckpoint: (checkpointId: string) => Promise<Checkpoint>
  completeCheckpoint: (checkpointId: string) => Promise<Checkpoint>
  skipCheckpoint: (checkpointId: string, reason: string) => Promise<Checkpoint>
  views: (
    slice: TourSlice,
    missionKind?: 'DELIVERY' | 'PICKUP'
  ) => TourActivity[]
  viewById: (id: string) => TourActivity | undefined
}

function checkpointTourId(
  checkpoint: Pick<Checkpoint, 'tournee_id' | 'tour_id'>
): string | null {
  return checkpoint.tournee_id ?? checkpoint.tour_id ?? null
}

function normalizeCheckpointRow(row: unknown, tourId: string): Checkpoint {
  if (!row || typeof row !== 'object') {
    throw new Error('Réponse serveur invalide : point de contrôle illisible')
  }
  const record = row as Record<string, unknown>
  if (typeof record.id !== 'string' || typeof record.status !== 'string') {
    throw new Error(
      'Réponse serveur invalide : point de contrôle sans identifiant ni statut'
    )
  }
  return {
    ...(record as object),
    tournee_id:
      (record.tournee_id as string | undefined) ??
      (record.tour_id as string | undefined) ??
      tourId,
  } as Checkpoint
}

function applyCheckpointUpdate(
  checkpoints: Checkpoint[],
  updated: Checkpoint
): Checkpoint[] {
  const index = checkpoints.findIndex((c) => c.id === updated.id)
  if (index === -1) return [...checkpoints, updated]
  const next = [...checkpoints]
  next[index] = updated
  return next
}

function hasId(obj: unknown): obj is { id: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as { id?: unknown }).id === 'string'
  )
}

function assertTourOrganization(draft: TourDraft) {
  const user = useAuthStore.getState().user
  if (!user) throw new Error(PERMISSION_DENIED)
  assertPermission(user.system_role, 'tours.create')
  if (
    !canViewAllTourCrew(user) &&
    (!user.org_id || draft.marketeur_org_id !== user.org_id)
  ) {
    throw new Error(PERMISSION_DENIED)
  }
  return user
}

function assertTourCrew(
  draft: TourDraft,
  driver: Parameters<typeof canUseTourCrewMember>[1] | undefined,
  livreur: Parameters<typeof canUseTourCrewMember>[1] | undefined
) {
  const user = assertTourOrganization(draft)
  if (canViewAllTourCrew(user) || draft.execution_mode !== 'INTERNAL') return
  if (
    !driver ||
    !canUseTourCrewMember(user, driver) ||
    !livreur ||
    !canUseTourCrewMember(user, livreur) ||
    !isTourLivreur(livreur)
  ) {
    throw new Error(
      'Le chauffeur et le livreur doivent être actifs et appartenir à votre organisation.'
    )
  }
}

const remoteMode = ['http', 'mock'].includes(
  import.meta.env.VITE_API_MODE ?? ''
)

export const useToursStore = create<ToursState>()((set, get) => ({
  tours: remoteMode ? [] : curated.delivery_tours.map((t) => ({ ...t })),
  checkpoints: remoteMode ? [] : curated.checkpoints.map((c) => ({ ...c })),
  checkpointsByTour: {},
  checkpointsLoading: {},
  deliveryEvents: [],
  scanEvents: [],
  loading: false,
  error: null,
  hasLoaded: false,
  lastFetchedAt: 0,

  recordDeliveryEvent(event: DeliveryEvent) {
    set({ deliveryEvents: [...get().deliveryEvents, event] })
  },

  recordScanEvent(event: ScanEvent) {
    set({ scanEvents: [...get().scanEvents, event] })
  },

  recordBulkScanEvents(events: ScanEvent[]) {
    set({ scanEvents: [...get().scanEvents, ...events] })
  },

  async fetchTours(force = false, silent = false) {
    if (!force && get().hasLoaded && isHydrationFresh(get().lastFetchedAt))
      return
    if (!silent) set({ loading: true, error: null })
    try {
      const res = await api.tours.list(0, 100)
      if (remoteMode && res?.pagination?.pages > 1) {
        for (let page = 1; page < res.pagination.pages; page++) {
          const next = await api.tours.list(page, 100)
          res.data.push(...next.data)
        }
      }
      if (
        res &&
        Array.isArray(res.data) &&
        (remoteMode || res.data.length > 0)
      ) {
        const rows = res.data as (DeliveryTour & {
          checkpoints?: Checkpoint[]
        })[]
        const checkpoints = remoteMode
          ? rows.flatMap((tour) => tour.checkpoints ?? [])
          : get().checkpoints
        set({
          tours: rows,
          checkpoints,
          checkpointsByTour: {},
          loading: false,
          hasLoaded: true,
          lastFetchedAt: Date.now(),
        })
      } else {
        set({ loading: false, hasLoaded: true, lastFetchedAt: Date.now() })
      }
    } catch {
      if (!silent) {
        set({
          loading: false,
          hasLoaded: !remoteMode,
          error: remoteMode
            ? 'Impossible de charger les tournées du serveur.'
            : null,
          lastFetchedAt: Date.now(),
        })
      }
    }
  },

  async createPickupAsync(draft: PickupPlan) {
    const user = useAuthStore.getState().user
    if (!user) throw new Error(PERMISSION_DENIED)
    assertActorPermission(user, 'pickups.create')
    if (
      user.site_ids?.length &&
      !canViewAllTourCrew(user) &&
      !user.site_ids.includes(draft.destination_site_id)
    )
      throw new Error(PERMISSION_DENIED)
    if (!canViewAllTourCrew(user) && draft.marketeur_org_id !== user.org_id)
      throw new Error(PERMISSION_DENIED)
    const saved = await apiAdapter.request<DeliveryTour>('/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...draft,
        execution_mode: 'INTERNAL',
        tour_code: `ENL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      }),
    })
    set({
      tours: [saved, ...get().tours.filter((t) => t.id !== saved.id)],
      checkpoints: [...get().checkpoints, ...(saved.checkpoints ?? [])],
      lastFetchedAt: 0,
    })
    emitWs('pickup:update', { id: saved.id }, user.id)
    return saved
  },

  async fetchCheckpoints(tourId: string, force = false, silent = false) {
    if (!tourId) {
      throw new Error('Identifiant de tournée manquant')
    }
    if (!force && get().checkpointsByTour[tourId])
      return get().checkpointsByTour[tourId]!
    if (!silent)
      set({
        checkpointsLoading: { ...get().checkpointsLoading, [tourId]: true },
      })
    let list: Checkpoint[]
    try {
      const rows = await api.tours.getCheckpoints(tourId)
      list = (Array.isArray(rows) ? rows : []).map((row) =>
        normalizeCheckpointRow(row, tourId)
      )
    } catch {
      list = get().checkpoints.filter(
        (c) => (c.tournee_id ?? c.tour_id) === tourId
      )
    }
    const kept = get().checkpoints.filter((c) => checkpointTourId(c) !== tourId)
    set({
      checkpoints: [...kept, ...list],
      checkpointsByTour: { ...get().checkpointsByTour, [tourId]: list },
      checkpointsLoading: { ...get().checkpointsLoading, [tourId]: false },
      error: null,
    })
    return list
  },

  createTour(draft: TourDraft) {
    const user = assertTourOrganization(draft)
    assertTourCrew(
      draft,
      curated.drivers.find((driver) => driver.id === draft.driver_id),
      useUsersStore
        .getState()
        .users.find((livreur) => livreur.id === draft.livreur_user_id)
    )
    const now = new Date().toISOString()
    const initialStatus: DeliveryTour['status'] =
      draft.status ??
      (draft.execution_mode === 'INTERNAL'
        ? 'PLANNED'
        : 'PENDINGTRANSPORTERACK')
    const tourId = draft.id || newTourId()
    const tour: DeliveryTour = {
      id: tourId,
      tour_code: draft.tour_code?.trim() || undefined,
      marketeur_org_id: draft.marketeur_org_id,
      execution_mode: draft.execution_mode,
      source_site_id: draft.sourceSiteId ?? null,
      transporter_org_id: draft.transporter_org_id ?? null,
      vehicle_id: draft.vehicle_id ?? null,
      driver_id: draft.driver_id ?? null,
      livreur_user_id: draft.livreur_user_id ?? null,
      assigned_by_transporter_user_id: null,
      transporter_assigned_at: null,
      sent_to_transporter_at: draft.execution_mode === 'EXTERNAL' ? now : null,
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

    const checkpointsToAdd: Checkpoint[] = (draft.checkpoints ?? []).map(
      (cp, idx: number) => {
        const siteId =
          cp.site_id ??
          (cp.destination_site_id && !cp.client_site_id
            ? cp.destination_site_id
            : null)
        const clientSiteId = cp.client_site_id ?? null
        return {
          id: cp.id ?? newCheckpointId(tour.id, cp.sequence ?? idx + 1),
          tournee_id: tour.id,
          site_id: siteId,
          client_site_id: clientSiteId,
          sequence: cp.sequence ?? idx + 1,
          expected_quantity: cp.expected_quantity ?? cp.planned_quantity ?? 0,
          expected_arrival: cp.expected_arrival ?? null,
          actual_arrival: cp.actual_arrival ?? null,
          status: cp.status ?? 'PENDING',
          skip_reason: null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          created_by: null,
          updated_by: null,
        }
      }
    )

    const validation = validateTour(tour, {
      vehicles: curated.vehicles,
      contracts: useContractsStore.getState().all(),
      checkpoints: checkpointsToAdd.map((c) => ({
        site_id: c.site_id ?? undefined,
        client_site_id: c.client_site_id ?? undefined,
        sequence: c.sequence,
        expected_quantity: c.expected_quantity ?? 0,
      })),
    })
    if (!validation.valid) {
      throw new Error(validation.errors[0])
    }

    const previousTours = get().tours.map((t) => ({ ...t }))
    const previousCheckpoints = get().checkpoints.map((c) => ({ ...c }))
    const allCheckpoints = [...previousCheckpoints, ...checkpointsToAdd]
    try {
      set({
        tours: [tour, ...previousTours],
        checkpoints: allCheckpoints,
        checkpointsByTour: {
          ...get().checkpointsByTour,
          [tour.id]: checkpointsToAdd,
        },
      })
      emitWs('tour:update', { id: tour.id }, user?.id)
      return toTourActivities([tour], { checkpoints: allCheckpoints })[0]!
    } catch (error) {
      set({ tours: previousTours, checkpoints: previousCheckpoints })
      throw error
    }
  },

  async createTourAsync(draft: TourDraft) {
    const user = assertTourOrganization(draft)
    if (!canViewAllTourCrew(user) && draft.execution_mode === 'INTERNAL') {
      const [driver, livreur] = await Promise.all([
        draft.driver_id ? api.drivers.getById(draft.driver_id) : undefined,
        draft.livreur_user_id
          ? api.users.getById(draft.livreur_user_id)
          : undefined,
      ])
      assertTourCrew(draft, driver, livreur)
    }
    let saved: DeliveryTour | null = null
    try {
      const res = await api.tours.create(
        draft as unknown as Parameters<typeof api.tours.create>[0]
      )
      if (hasId(res)) {
        saved = res as unknown as DeliveryTour
      }
    } catch (error) {
      if (remoteMode) throw error
      // In-memory fallback
    }

    if (!saved && remoteMode)
      throw new Error(
        'Réponse du serveur invalide. Aucune modification locale effectuée.'
      )
    if (!saved) {
      return get().createTour(draft)
    }

    const serverCheckpoints = (
      saved as DeliveryTour & { checkpoints?: Checkpoint[] }
    ).checkpoints
    const newCheckpoints =
      serverCheckpoints ??
      ((draft.checkpoints ?? []).map((cp, idx) => ({
        id: cp.id ?? `cp-${saved!.id}-${idx + 1}`,
        tour_id: saved!.id,
        tournee_id: saved!.id,
        sequence: cp.sequence ?? idx + 1,
        site_id: cp.site_id ?? cp.destination_site_id ?? '',
        client_site_id: cp.client_site_id ?? null,
        expected_quantity: cp.expected_quantity ?? cp.planned_quantity ?? 0,
        status: cp.status ?? 'PENDING',
        expected_arrival: cp.expected_arrival ?? null,
        actual_arrival: cp.actual_arrival ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        created_by: null,
        updated_by: null,
      })) as Checkpoint[])

    set({
      tours: [saved, ...get().tours.filter((t) => t.id !== saved!.id)],
      checkpoints: [...newCheckpoints, ...get().checkpoints],
      checkpointsByTour: {
        ...get().checkpointsByTour,
        [saved.id]: newCheckpoints,
      },
      error: null,
    })
    return toTourActivities([saved], { checkpoints: get().checkpoints })[0]!
  },

  async updateTourAsync(id: string, patch: Partial<TourDraft>) {
    const user = useAuthStore.getState().user
    if (!user) throw new Error(PERMISSION_DENIED)
    assertPermission(user.system_role, 'tours.write')

    const current = get().tours.find((t) => t.id === id)
    if (!current) {
      throw new Error(`Tournée introuvable : ${id}`)
    }

    if (!canEditTour(current)) {
      throw new Error(
        `Cette tournée ne peut plus être modifiée (statut actuel: ${current.status}).`
      )
    }

    if (
      !canViewAllTourCrew(user) &&
      (!user.org_id || current.marketeur_org_id !== user.org_id)
    ) {
      throw new Error(PERMISSION_DENIED)
    }

    const mergedMode = patch.execution_mode ?? current.execution_mode
    if (!canViewAllTourCrew(user) && mergedMode === 'INTERNAL') {
      const driverId =
        patch.driver_id !== undefined ? patch.driver_id : current.driver_id
      const livreurUserId =
        patch.livreur_user_id !== undefined
          ? patch.livreur_user_id
          : current.livreur_user_id
      if (driverId || livreurUserId) {
        const [driver, livreur] = await Promise.all([
          driverId ? api.drivers.getById(driverId) : undefined,
          livreurUserId ? api.users.getById(livreurUserId) : undefined,
        ])
        assertTourCrew(
          {
            id: current.id,
            marketeur_org_id: current.marketeur_org_id,
            execution_mode: mergedMode,
            type: patch.type ?? current.type,
            requested_quantity:
              patch.requested_quantity ?? current.requested_quantity,
            driver_id: driverId,
            livreur_user_id: livreurUserId,
          },
          driver,
          livreur
        )
      }
    }

    let saved: DeliveryTour | null = null
    try {
      const res = await api.tours.update(id, patch)
      if (hasId(res)) {
        saved = res as unknown as DeliveryTour
      }
    } catch (error) {
      if (remoteMode) throw error
    }

    if (!saved && remoteMode) {
      throw new Error(
        'Réponse du serveur invalide. Aucune modification locale effectuée.'
      )
    }

    const now = new Date().toISOString()
    const updatedTour: DeliveryTour = saved ?? {
      ...current,
      ...(patch.execution_mode ? { execution_mode: patch.execution_mode } : {}),
      ...(patch.type ? { type: patch.type } : {}),
      ...(patch.requested_quantity !== undefined
        ? { requested_quantity: patch.requested_quantity }
        : {}),
      ...(patch.transporter_org_id !== undefined
        ? { transporter_org_id: patch.transporter_org_id }
        : {}),
      ...(patch.vehicle_id !== undefined
        ? { vehicle_id: patch.vehicle_id }
        : {}),
      ...(patch.driver_id !== undefined ? { driver_id: patch.driver_id } : {}),
      ...(patch.livreur_user_id !== undefined
        ? { livreur_user_id: patch.livreur_user_id }
        : {}),
      ...(patch.status ? { status: patch.status } : {}),
      updated_at: now,
      updated_by: user.id,
    }

    let updatedCheckpoints =
      get().checkpointsByTour[id] ??
      get().checkpoints.filter((c) => checkpointTourId(c) === id)

    if (patch.checkpoints && patch.checkpoints.length > 0) {
      const nextCps: Checkpoint[] = patch.checkpoints.map((cp, idx) => ({
        id: cp.id ?? newCheckpointId(id, cp.sequence ?? idx + 1),
        tournee_id: id,
        site_id:
          cp.site_id ??
          (cp.destination_site_id && !cp.client_site_id
            ? cp.destination_site_id
            : null),
        client_site_id: cp.client_site_id ?? null,
        sequence: cp.sequence ?? idx + 1,
        expected_quantity: cp.expected_quantity ?? cp.planned_quantity ?? 0,
        expected_arrival: cp.expected_arrival ?? null,
        actual_arrival: cp.actual_arrival ?? null,
        status: cp.status ?? 'PENDING',
        skip_reason: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        created_by: null,
        updated_by: null,
      }))
      updatedCheckpoints = nextCps
    }

    const otherCheckpoints = get().checkpoints.filter(
      (c) => checkpointTourId(c) !== id
    )
    const allCheckpoints = [...otherCheckpoints, ...updatedCheckpoints]

    set({
      tours: get().tours.map((t) => (t.id === id ? updatedTour : t)),
      checkpoints: allCheckpoints,
      checkpointsByTour: {
        ...get().checkpointsByTour,
        [id]: updatedCheckpoints,
      },
      error: null,
    })

    emitWs('tour:update', { id }, user.id)
    return toTourActivities([updatedTour], { checkpoints: allCheckpoints })[0]!
  },

  performAction(
    id: string,
    action: TourAction,
    patch?: TourCrewPatch | ActionExtraParams
  ) {
    const actor = useAuthStore.getState().user
    const role: Role = actor?.system_role ?? 'LIVREUR'
    assertPermission(role, ACTION_PERMISSION[action])
    const normalizedPatch: TourCrewPatch = {
      vehicle_id: patch?.vehicle_id ?? (patch as ActionExtraParams)?.vehicleId,
      driver_id: patch?.driver_id ?? (patch as ActionExtraParams)?.driverId,
      livreur_user_id:
        patch?.livreur_user_id ??
        (patch as ActionExtraParams)?.livreurUserId ??
        (patch as ActionExtraParams)?.livreurPersonId,
      assigned_by_transporter_user_id:
        patch?.assigned_by_transporter_user_id ?? undefined,
    }
    if (
      action === 'acknowledge' &&
      !(
        normalizedPatch.vehicle_id &&
        normalizedPatch.driver_id &&
        normalizedPatch.livreur_user_id
      )
    ) {
      throw new Error(
        "L'accusé de réception exige l'équipage du transporteur (véhicule, chauffeur, livreur)."
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

    const previous = tours.map((t) => ({ ...t }))
    try {
      const result = applyAction(current, action, new Date(), normalizedPatch)
      const next: DeliveryTour = { ...current, ...result }
      if ((patch as ActionExtraParams)?.loadedQuantity != null) {
        next.loaded_quantity = (patch as ActionExtraParams).loadedQuantity
      }
      if ((patch as ActionExtraParams)?.deliveredQuantity != null) {
        next.delivered_quantity = (patch as ActionExtraParams).deliveredQuantity
      }
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

  async performActionAsync(
    id: string,
    action: TourAction,
    extra?: ActionExtraParams
  ) {
    let saved: DeliveryTour | null = null
    try {
      let updated: unknown
      switch (action) {
        case 'plan':
          updated = await api.tours.plan(id)
          break
        case 'send-to-transporter':
          updated = await api.tours.sendToTransporter(id)
          break
        case 'acknowledge': {
          const ackBody = extra
            ? {
                vehicle_id: extra.vehicle_id ?? extra.vehicleId,
                driver_id: extra.driver_id ?? extra.driverId,
                livreur_user_id:
                  extra.livreur_user_id ??
                  extra.livreurUserId ??
                  extra.livreurPersonId,
              }
            : undefined
          updated = await api.tours.acknowledge(id, ackBody)
          break
        }
        case 'start':
          updated = await api.tours.start(id)
          break
        case 'close':
          updated = await api.tours.close(
            id,
            extra?.loadedQuantity,
            extra?.deliveredQuantity
          )
          break
        case 'cancel':
          updated = await api.tours.cancel(id, extra?.reason)
          break
      }
      if (hasId(updated)) {
        saved = updated as unknown as DeliveryTour
      }
    } catch (error) {
      if (remoteMode) throw error
      // In-memory fallback
    }

    if (!saved && remoteMode)
      throw new Error(
        'Réponse du serveur invalide. Aucune modification locale effectuée.'
      )
    if (!saved) {
      return get().performAction(id, action, extra)
    }

    set({
      tours: get().tours.map((t) => (t.id === id ? saved! : t)),
      error: null,
    })
    return toTourActivities([saved], { checkpoints: get().checkpoints })[0]!
  },

  async assignDriver(id: string, driverId?: string, livreurPersonId?: string) {
    let saved: DeliveryTour | null = null
    try {
      const updated = await api.tours.assignDriver(
        id,
        driverId,
        livreurPersonId
      )
      if (hasId(updated)) {
        saved = updated as unknown as DeliveryTour
      }
    } catch (error) {
      if (remoteMode) throw error
      // Fallback
    }

    if (!saved && remoteMode)
      throw new Error(
        'Réponse du serveur invalide. Aucune modification locale effectuée.'
      )
    if (!saved) {
      const current = get().tours.find((t) => t.id === id)
      if (current) {
        saved = {
          ...current,
          driver_id: driverId ?? current.driver_id,
          livreur_user_id: livreurPersonId ?? current.livreur_user_id,
        }
      }
    }

    if (!saved) throw new Error('Tournée introuvable')

    set({
      tours: get().tours.map((t) => (t.id === id ? saved! : t)),
      error: null,
    })
    return toTourActivities([saved], { checkpoints: get().checkpoints })[0]!
  },

  async assignVehicle(id: string, vehicleId: string) {
    let saved: DeliveryTour | null = null
    try {
      const updated = await api.tours.assignVehicle(id, vehicleId)
      if (hasId(updated)) {
        saved = updated as unknown as DeliveryTour
      }
    } catch (error) {
      if (remoteMode) throw error
      // Fallback
    }

    if (!saved && remoteMode)
      throw new Error(
        'Réponse du serveur invalide. Aucune modification locale effectuée.'
      )
    if (!saved) {
      const current = get().tours.find((t) => t.id === id)
      if (current) {
        saved = {
          ...current,
          vehicle_id: vehicleId,
        }
      }
    }

    if (!saved) throw new Error('Tournée introuvable')

    set({
      tours: get().tours.map((t) => (t.id === id ? saved! : t)),
      error: null,
    })
    return toTourActivities([saved], { checkpoints: get().checkpoints })[0]!
  },

  async reachCheckpoint(checkpointId: string) {
    let saved: Checkpoint | null = null
    try {
      const updated = await api.tours.reachCheckpoint(checkpointId)
      if (hasId(updated)) {
        saved = updated as unknown as Checkpoint
      }
    } catch (error) {
      if (remoteMode) throw error
      // Fallback
    }

    if (!saved && remoteMode)
      throw new Error(
        'Réponse du serveur invalide. Aucune modification locale effectuée.'
      )
    if (!saved) {
      const existing = get().checkpoints.find((c) => c.id === checkpointId)
      if (existing) {
        saved = {
          ...existing,
          status: 'REACHED',
          actual_arrival: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    }

    if (!saved)
      throw new Error(`Point de contrôle introuvable : ${checkpointId}`)

    const tourId =
      checkpointTourId(saved) ??
      get().checkpoints.find((c) => c.id === checkpointId)?.tournee_id ??
      null
    set({
      checkpoints: applyCheckpointUpdate(get().checkpoints, saved),
      checkpointsByTour:
        tourId != null
          ? {
              ...get().checkpointsByTour,
              [tourId]: applyCheckpointUpdate(
                get().checkpointsByTour[tourId] ?? [],
                saved
              ),
            }
          : get().checkpointsByTour,
      error: null,
    })
    return saved
  },

  async completeCheckpoint(checkpointId: string) {
    let saved: Checkpoint | null = null
    try {
      const updated = await api.tours.completeCheckpoint(checkpointId)
      if (hasId(updated)) {
        saved = updated as unknown as Checkpoint
      }
    } catch (error) {
      if (remoteMode) throw error
      // Fallback
    }

    if (!saved && remoteMode)
      throw new Error(
        'Réponse du serveur invalide. Aucune modification locale effectuée.'
      )
    if (!saved) {
      const existing = get().checkpoints.find((c) => c.id === checkpointId)
      if (existing) {
        saved = {
          ...existing,
          status: 'COMPLETED',
          updated_at: new Date().toISOString(),
        }
      }
    }

    if (!saved)
      throw new Error(`Point de contrôle introuvable : ${checkpointId}`)

    const tourId =
      checkpointTourId(saved) ??
      get().checkpoints.find((c) => c.id === checkpointId)?.tournee_id ??
      null
    const nextCheckpoints = applyCheckpointUpdate(get().checkpoints, saved)
    let nextTours = get().tours

    if (tourId) {
      const tourCheckpoints = nextCheckpoints.filter(
        (c) => (checkpointTourId(c) ?? c.tournee_id ?? c.tour_id) === tourId
      )
      const allTerminal =
        tourCheckpoints.length > 0 &&
        tourCheckpoints.every(
          (c) => c.status === 'COMPLETED' || c.status === 'SKIPPED'
        )

      const currentTour = nextTours.find((t) => t.id === tourId)
      if (
        currentTour &&
        currentTour.status !== 'CLOSED' &&
        currentTour.status !== 'CANCELLED'
      ) {
        if (allTerminal) {
          const loadedQty =
            currentTour.loaded_quantity ?? currentTour.requested_quantity ?? 0
          const updatedTour: DeliveryTour = {
            ...currentTour,
            status: 'CLOSED',
            closed_at: currentTour.closed_at ?? new Date().toISOString(),
            delivered_quantity: currentTour.delivered_quantity ?? loadedQty,
            updated_at: new Date().toISOString(),
          }
          nextTours = nextTours.map((t) => (t.id === tourId ? updatedTour : t))
          if (remoteMode) {
            try {
              api.tours
                .close(
                  tourId,
                  updatedTour.loaded_quantity ?? undefined,
                  updatedTour.delivered_quantity ?? undefined
                )
                .catch(() => {})
            } catch {
              // Remote fallback ignored
            }
          }
          emitWs(
            'tour:update',
            { id: tourId },
            useAuthStore.getState().user?.id
          )
        }
      }
    }

    set({
      checkpoints: nextCheckpoints,
      tours: nextTours,
      checkpointsByTour:
        tourId != null
          ? {
              ...get().checkpointsByTour,
              [tourId]: applyCheckpointUpdate(
                get().checkpointsByTour[tourId] ?? [],
                saved
              ),
            }
          : get().checkpointsByTour,
      error: null,
    })
    return saved
  },

  async skipCheckpoint(checkpointId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new Error('Motif obligatoire pour sauter un point de contrôle')
    }
    let saved: Checkpoint | null = null
    try {
      const updated = await api.tours.skipCheckpoint(
        checkpointId,
        reason.trim()
      )
      if (hasId(updated)) {
        saved = updated as unknown as Checkpoint
      }
    } catch (error) {
      if (remoteMode) throw error
      // Fallback
    }

    if (!saved && remoteMode)
      throw new Error(
        'Réponse du serveur invalide. Aucune modification locale effectuée.'
      )
    if (!saved) {
      const existing = get().checkpoints.find((c) => c.id === checkpointId)
      if (existing) {
        saved = {
          ...existing,
          status: 'SKIPPED',
          skip_reason: reason.trim(),
          updated_at: new Date().toISOString(),
        }
      }
    }

    if (!saved)
      throw new Error(`Point de contrôle introuvable : ${checkpointId}`)

    const tourId =
      checkpointTourId(saved) ??
      get().checkpoints.find((c) => c.id === checkpointId)?.tournee_id ??
      null
    const nextCheckpoints = applyCheckpointUpdate(get().checkpoints, saved)
    let nextTours = get().tours

    if (tourId) {
      const tourCheckpoints = nextCheckpoints.filter(
        (c) => (checkpointTourId(c) ?? c.tournee_id ?? c.tour_id) === tourId
      )
      const allTerminal =
        tourCheckpoints.length > 0 &&
        tourCheckpoints.every(
          (c) => c.status === 'COMPLETED' || c.status === 'SKIPPED'
        )

      const currentTour = nextTours.find((t) => t.id === tourId)
      if (
        currentTour &&
        currentTour.status !== 'CLOSED' &&
        currentTour.status !== 'CANCELLED'
      ) {
        if (allTerminal) {
          const loadedQty =
            currentTour.loaded_quantity ?? currentTour.requested_quantity ?? 0
          const updatedTour: DeliveryTour = {
            ...currentTour,
            status: 'CLOSED',
            closed_at: currentTour.closed_at ?? new Date().toISOString(),
            delivered_quantity: currentTour.delivered_quantity ?? loadedQty,
            updated_at: new Date().toISOString(),
          }
          nextTours = nextTours.map((t) => (t.id === tourId ? updatedTour : t))
          if (remoteMode) {
            try {
              api.tours
                .close(
                  tourId,
                  updatedTour.loaded_quantity ?? undefined,
                  updatedTour.delivered_quantity ?? undefined
                )
                .catch(() => {})
            } catch {
              // Remote fallback ignored
            }
          }
          emitWs(
            'tour:update',
            { id: tourId },
            useAuthStore.getState().user?.id
          )
        }
      }
    }

    set({
      checkpoints: nextCheckpoints,
      tours: nextTours,
      checkpointsByTour:
        tourId != null
          ? {
              ...get().checkpointsByTour,
              [tourId]: applyCheckpointUpdate(
                get().checkpointsByTour[tourId] ?? [],
                saved
              ),
            }
          : get().checkpointsByTour,
      error: null,
    })
    return saved
  },

  views(slice: TourSlice, missionKind = 'DELIVERY') {
    const tours = get().tours.filter(
      (t) => !t.deleted_at && (t.mission_kind ?? 'DELIVERY') === missionKind
    )
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
                return (
                  t.status === 'INPROGRESS' || t.status === 'CHECKPOINTACTIVE'
                )
              case 'HISTORY':
                return t.status === 'CLOSED' || t.status === 'CANCELLED'
              default:
                return true
            }
          })
    return toTourActivities(
      [...filtered].sort((a, b) =>
        (b.created_at ?? '').localeCompare(a.created_at ?? '')
      ),
      { checkpoints: get().checkpoints }
    )
  },

  viewById(id: string) {
    const index = get().tours.findIndex((t) => t.id === id)
    if (index === -1) return undefined
    return toTourActivities([get().tours[index]!], {
      checkpoints: get().checkpoints,
    })[0]
  },
}))

export function newTourId(): string {
  return `tournee-${Date.now()}`
}

export function newCheckpointId(tourId: string, sequence: number): string {
  return `${tourId}-seq-${sequence}`
}

// A change of account must never reuse the previous user's hydrated tours.
useAuthStore.subscribe((state, previous) => {
  if (remoteMode && state.user?.id !== previous.user?.id) {
    useToursStore.setState({
      tours: [],
      checkpoints: [],
      checkpointsByTour: {},
      checkpointsLoading: {},
      deliveryEvents: [],
      scanEvents: [],
      hasLoaded: false,
      lastFetchedAt: 0,
      error: null,
    })
  }
})
