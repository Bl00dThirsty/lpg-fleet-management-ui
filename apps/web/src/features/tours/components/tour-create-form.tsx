import { useQueryClient } from '@tanstack/react-query'
import { invalidateResource } from '@/lib/api/invalidation'
/* eslint-disable react-hooks/set-state-in-effect */
import { lazy, Suspense, useEffect, useMemo, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  tourPlanningSchema,
  type TourPlanningValues,
} from '../lib/tour-planning-schema'
import { toast } from 'sonner'
import { api } from '@lpg/api-client'
import type { ClientSite, Site, ExecutionMode, TourneeType } from '@lpg/types'
import { Button } from '@lpg/ui'
import { Plus, X, Check, AlertTriangle } from 'lucide-react'
import { useToursStore, type TourDraft } from '@/store/tours-store'
import { useAuthStore } from '@/store/auth-store'
import {
  organizations as defaultOrganizations,
  vehicles as defaultVehicles,
  users as defaultUsers,
  drivers as defaultDrivers,
  sites as defaultSites,
  client_sites as defaultClientSites,
} from '@/lib/entity-data'
import {
  extractUserRoleCodes,
  canViewAllTourCrew,
  filterTourCrew,
  isTourLivreur,
  toRequestedQuantity,
} from '../lib/tour-create-helpers'

import { buildDraftTourActivity } from '../lib/tour-draft-preview'
const TourCorridorMap = lazy(() =>
  import('./tour-corridor-map').then((m) => ({ default: m.TourCorridorMap }))
)

interface TourCreateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface OrgOption {
  id: string
  name: string
  type: string
  code?: string
}

interface VehicleOption {
  id: string
  type: string
  license_plate: string
  org_id?: string
  organization_id?: string
  max_volume?: number | null
  max_bottle_count?: number | null
}

interface CandidateUser {
  org_id?: string
  organization_id?: string
  is_active?: boolean
  deleted_at?: string | null
  id: string
  first_name?: string
  last_name?: string
  license_number?: string
}

interface DriverOption {
  org_id?: string
  is_active?: boolean
  deleted_at?: string | null
  id: string
  first_name?: string
  last_name?: string
  license_number?: string
  organization_id?: string
  status?: string
}

interface RawSite {
  geo_point?: Site['geo_point']
  id: string
  name: string
  org_id?: string
  organization_id?: string
  region?: string
  functions?: string[]
  type?: string
  address?: string
}

interface RawClientSite {
  geo_point?: ClientSite['geo_point']
  id: string
  name: string
  client_org_id?: string
  region?: string
  address?: string
  current_marketeur_org_id?: string
}

const DRIVER_ROLE_CACHE_TTL_MS = 5 * 60 * 1000
const roleCodesCache = new Map<string, { codes: string[]; at: number }>()

function getCachedRoleCodes(id: string): string[] | undefined {
  const entry = roleCodesCache.get(id)
  if (!entry) return undefined
  if (Date.now() - entry.at > DRIVER_ROLE_CACHE_TTL_MS) {
    roleCodesCache.delete(id)
    return undefined
  }
  return entry.codes
}

async function resolveRoleCodesBatched(
  ids: string[],
  isCancelled: () => boolean
): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {}
  const BATCH_SIZE = 8
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    if (isCancelled()) break
    const batch = ids.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          const detail = await api.users.getById(id)
          const codes = extractUserRoleCodes(detail)
          roleCodesCache.set(id, { codes, at: Date.now() })
          return { id, codes }
        } catch {
          return { id, codes: null as string[] | null }
        }
      })
    )
    for (const r of results) {
      if (r.codes) out[r.id] = r.codes
    }
  }
  return out
}

export function TourCreateForm({
  open,
  onOpenChange,
  onSuccess,
}: TourCreateFormProps) {
  const queryClient = useQueryClient()
  const authUser = useAuthStore((s) => s.user)
  const isRegulator = canViewAllTourCrew(authUser)
  const [crewError, setCrewError] = useState<string | null>(null)
  const [tourCode, setTourCode] = useState(
    () => `TRP-${Math.floor(1000 + Math.random() * 9000)}`
  )
  const form = useForm<TourPlanningValues>({
    resolver: zodResolver(tourPlanningSchema),
    defaultValues: {
      scheduledAt: '',
      executionMode: 'INTERNAL',
      cargoType: 'BOUTEILLES50KG',
      quantity: 50,
      marketerId: '',
      depotSiteId: '',
      transporterId: '',
      vehicleId: '',
      driverId: '',
      livreurId: '',
      clientStops: [],
    },
  })
  const {
    executionMode,
    cargoType,
    quantity,
    marketerId,
    depotSiteId,
    transporterId,
    vehicleId,
    driverId,
    livreurId,
    clientStops,
  } = form.watch()
  const setExecutionMode = (value: TourPlanningValues['executionMode']) =>
    form.setValue('executionMode', value, {
      shouldValidate: form.formState.isSubmitted,
    })
  const setCargoType = (value: TourPlanningValues['cargoType']) =>
    form.setValue('cargoType', value, {
      shouldValidate: form.formState.isSubmitted,
    })
  const setQuantity = (value: TourPlanningValues['quantity']) =>
    form.setValue('quantity', value, {
      shouldValidate: form.formState.isSubmitted,
    })
  const setMarketerId = (value: TourPlanningValues['marketerId']) =>
    form.setValue('marketerId', value, {
      shouldValidate: form.formState.isSubmitted,
    })
  const setDepotSiteId = (value: TourPlanningValues['depotSiteId']) =>
    form.setValue('depotSiteId', value, {
      shouldValidate: form.formState.isSubmitted,
    })
  const setTransporterId = (value: TourPlanningValues['transporterId']) =>
    form.setValue('transporterId', value, {
      shouldValidate: form.formState.isSubmitted,
    })
  const setVehicleId = (value: TourPlanningValues['vehicleId']) =>
    form.setValue('vehicleId', value, {
      shouldValidate: form.formState.isSubmitted,
    })
  const setDriverId = (value: TourPlanningValues['driverId']) =>
    form.setValue('driverId', value, {
      shouldValidate: form.formState.isSubmitted,
    })
  const setLivreurId = (value: TourPlanningValues['livreurId']) =>
    form.setValue('livreurId', value, {
      shouldValidate: form.formState.isSubmitted,
    })
  const setClientStops = (
    value:
      | TourPlanningValues['clientStops'][number][]
      | ((
          prev: TourPlanningValues['clientStops'][number][]
        ) => TourPlanningValues['clientStops'][number][])
  ) =>
    form.setValue(
      'clientStops',
      typeof value === 'function'
        ? value(form.getValues('clientStops'))
        : value,
      { shouldValidate: form.formState.isSubmitted }
    )
  const [submitting, setSubmitting] = useState(false)

  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [candidates, setCandidates] = useState<CandidateUser[]>([])
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const [roleCodesById, setRoleCodesById] = useState<Record<string, string[]>>(
    {}
  )
  const [rolesResolving, setRolesResolving] = useState(false)
  const [rawSites, setRawSites] = useState<RawSite[]>([])
  const [rawClientSites, setRawClientSites] = useState<RawClientSite[]>([])
  const [dataError, setDataError] = useState<string | null>(null)

  // Checkpoints: Séquence 1 = Dépôt (chargement), Séquences 2..N = Client sites (livraisons)
  const [checkpointError, setCheckpointError] = useState<string | null>(null)

  const previewTrip = useMemo(
    () =>
      buildDraftTourActivity(
        {
          sourceSiteId: depotSiteId,
          type: cargoType,
          execution_mode: executionMode,
          requested_quantity: quantity,
          marketeur_org_id: marketerId,
          vehicle_id: vehicleId,
          checkpoints: clientStops.map((s, i) => ({
            site_id: '',
            client_site_id: s.destinationId,
            sequence: i + 2,
            expected_quantity: Number(s.plannedQuantity) || 0,
          })),
        },
        {
          sourceSites: rawSites as Site[],
          clientSites: rawClientSites as ClientSite[],
        }
      ),
    [
      depotSiteId,
      cargoType,
      executionMode,
      quantity,
      marketerId,
      vehicleId,
      clientStops,
      rawSites,
      rawClientSites,
    ]
  )

  // Fetch or fallback data
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setDataError(null)
    setCheckpointError(null)
    setCrewError(null)
    setDriverId('')
    setLivreurId('')
    setTourCode(`TRP-${Math.floor(1000 + Math.random() * 9000)}`)

    ;(async () => {
      try {
        const [orgRes, vehRes, usrRes, siteRes, csRes, drvRes] =
          await Promise.allSettled([
            api.organizations.list({ size: 200 }),
            api.vehicles.list({ size: 200 }),
            api.users.list({ size: 200 }),
            api.sites.list({ size: 200 }),
            api.clientSites.list({ size: 200 }),
            api.drivers.list({ size: 200 }),
          ])

        if (cancelled) return

        // Organizations (with fallback)
        const orgData =
          orgRes.status === 'fulfilled' &&
          Array.isArray(orgRes.value?.data) &&
          orgRes.value.data.length > 0
            ? orgRes.value.data
            : defaultOrganizations
        setOrgs(orgData as OrgOption[])

        // Vehicles (with fallback)
        const vehData =
          vehRes.status === 'fulfilled' &&
          Array.isArray(vehRes.value?.data) &&
          vehRes.value.data.length > 0
            ? vehRes.value.data
            : defaultVehicles
        setVehicles(vehData as VehicleOption[])

        // Users & Candidates (with fallback)
        const usrData =
          usrRes.status === 'fulfilled' &&
          Array.isArray(usrRes.value?.data) &&
          usrRes.value.data.length > 0
            ? usrRes.value.data
            : defaultUsers
        const rows = filterTourCrew(
          (usrData as CandidateUser[]).filter(
            (u) => !!u && typeof u.id === 'string'
          ),
          authUser
        )
        setCandidates(rows)

        // Drivers
        const drvData =
          drvRes.status === 'fulfilled' &&
          Array.isArray(drvRes.value?.data) &&
          drvRes.value.data.length > 0
            ? drvRes.value.data
            : defaultDrivers
        setDrivers(drvData as DriverOption[])

        // Sites (with fallback)
        let siteData =
          siteRes.status === 'fulfilled' &&
          Array.isArray(siteRes.value?.data) &&
          siteRes.value.data.length > 0
            ? siteRes.value.data
            : defaultSites
        if (!isRegulator && authUser?.org_id) {
          siteData = (siteData as RawSite[]).filter(
            (s) =>
              s.org_id === authUser.org_id ||
              s.organization_id === authUser.org_id
          )
        }
        setRawSites(siteData as RawSite[])

        // Client Sites (with fallback)
        let csData =
          csRes.status === 'fulfilled' &&
          Array.isArray(csRes.value?.data) &&
          csRes.value.data.length > 0
            ? csRes.value.data
            : defaultClientSites
        if (!isRegulator && authUser?.org_id) {
          csData = (csData as RawClientSite[]).filter(
            (s) =>
              s.current_marketeur_org_id === authUser.org_id ||
              s.client_org_id === authUser.org_id
          )
        }
        setRawClientSites(csData as RawClientSite[])

        // Keep marketers in their own organization; regulators may choose any marketer.
        const marketers = (orgData as OrgOption[]).filter(
          (o) =>
            o.type === 'MARKETEUR' ||
            o.type === 'MKT' ||
            o.type?.toUpperCase().includes('MARKET')
        )
        const defaultMkt =
          marketers.find((m) => m.id === authUser?.org_id) ??
          (canViewAllTourCrew(authUser) ? marketers[0] : undefined)
        setMarketerId(defaultMkt?.id ?? '')

        const transporters = (orgData as OrgOption[]).filter(
          (o) => o.type === 'TRANSPORTEUR'
        )
        if (transporters[0]) {
          setTransporterId(transporters[0].id)
        }

        // Roles resolution
        const base: Record<string, string[]> = {}
        const needsDetail: string[] = []
        for (const u of rows) {
          const cached = getCachedRoleCodes(u.id)
          if (cached) {
            base[u.id] = cached
            continue
          }
          const fromList = extractUserRoleCodes(u)
          if (fromList.length > 0) base[u.id] = fromList
          else needsDetail.push(u.id)
        }
        setRoleCodesById(base)

        if (needsDetail.length > 0 && !cancelled) {
          setRolesResolving(true)
          const resolved = await resolveRoleCodesBatched(
            needsDetail,
            () => cancelled
          )
          if (!cancelled) {
            setRoleCodesById((prev) => ({ ...prev, ...resolved }))
            setRolesResolving(false)
          }
        }
      } catch (err) {
        if (cancelled) return
        setDataError(
          err instanceof Error
            ? err.message
            : 'Erreur chargement données de référence.'
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, authUser])

  // Filter available Marketers (MKT vs MARKETEUR bug resolved)
  const availableMarketers = useMemo(() => {
    return orgs.filter(
      (o) =>
        (o.type === 'MARKETEUR' ||
          o.type === 'MKT' ||
          o.type?.toUpperCase().includes('MARKET')) &&
        (isRegulator || Boolean(authUser?.org_id && o.id === authUser.org_id))
    )
  }, [orgs, authUser, isRegulator])

  const availableTransporters = useMemo(() => {
    return orgs.filter((o) => o.type === 'TRANSPORTEUR')
  }, [orgs])

  const availableVehicles = useMemo(() => {
    return filterTourCrew(vehicles, authUser).filter(
      (v) => v.type === cargoType
    )
  }, [vehicles, cargoType, authUser])

  const availableDrivers = useMemo(
    () => filterTourCrew(drivers, authUser),
    [drivers, authUser]
  )
  const livreurs = useMemo(
    () =>
      filterTourCrew(candidates, authUser).filter((candidate) =>
        isTourLivreur(candidate, roleCodesById[candidate.id])
      ),
    [candidates, roleCodesById, authUser]
  )

  // Clear stale choices on identity/data changes; never retain out-of-scope IDs.
  useEffect(() => {
    if (!availableVehicles.some((vehicle) => vehicle.id === vehicleId)) {
      setVehicleId(availableVehicles[0]?.id ?? '')
    }
  }, [availableVehicles, vehicleId])

  useEffect(() => {
    if (!availableDrivers.some((driver) => driver.id === driverId)) {
      setDriverId(availableDrivers[0]?.id ?? '')
    }
  }, [availableDrivers, driverId])

  useEffect(() => {
    if (!livreurs.some((livreur) => livreur.id === livreurId)) {
      setLivreurId(livreurs[0]?.id ?? '')
    }
  }, [livreurs, livreurId])

  // Marketer's primary region & DEPOT selection
  // "choisir DÉPÔT de SA région en 1er ← site de son org, type DEP ou FIL"
  const marketerDepotOptions = useMemo(() => {
    if (!marketerId) return []
    // 1. Sites of this marketer org
    const orgSites = rawSites.filter(
      (s) => s.org_id === marketerId || s.organization_id === marketerId
    )
    const primaryRegion = orgSites[0]?.region || 'LITTORAL'

    // Strict isolation: non-regulators only see sites of their own marketer organisation.
    // Regulators who pick a marketer see that marketer's sites (or rawSites if none configured).
    const candidateSites =
      !isRegulator || orgSites.length > 0 ? orgSites : rawSites

    // Sort: sites in primary region first, then depots / filling centres, then alphabetical
    return [...candidateSites].sort((a, b) => {
      const aInRegion = a.region === primaryRegion ? 1 : 0
      const bInRegion = b.region === primaryRegion ? 1 : 0
      if (aInRegion !== bInRegion) return bInRegion - aInRegion

      const aIsDepot = a.functions?.some((f) =>
        ['CENTREEMPLISSEUR', 'ENTREPOT', 'DEP', 'FIL'].includes(f)
      )
        ? 1
        : 0
      const bIsDepot = b.functions?.some((f) =>
        ['CENTREEMPLISSEUR', 'ENTREPOT', 'DEP', 'FIL'].includes(f)
      )
        ? 1
        : 0
      if (aIsDepot !== bIsDepot) return bIsDepot - aIsDepot

      return a.name.localeCompare(b.name)
    })
  }, [marketerId, rawSites, isRegulator])

  // Auto-select first depot
  useEffect(() => {
    if (
      marketerDepotOptions.length > 0 &&
      (!depotSiteId || !marketerDepotOptions.some((d) => d.id === depotSiteId))
    ) {
      setDepotSiteId(marketerDepotOptions[0]?.id ?? '')
    }
  }, [marketerDepotOptions, depotSiteId])

  const selectedDepot = useMemo(() => {
    return rawSites.find((s) => s.id === depotSiteId)
  }, [rawSites, depotSiteId])

  const currentRegion = selectedDepot?.region || 'LITTORAL'

  // CLIENT SITES: "région d'abord, groupés par client_org_id (DOVV Douala 1er, DOVV OPEP 2e, DOVV Bastos 3e, DOVV Mvan 4e)"
  const clientOrgGroups = useMemo(() => {
    const clientOrgs = orgs.filter((o) => o.type === 'CLIENT')
    const orgMap = new Map(clientOrgs.map((o) => [o.id, o.name]))

    // Restrict client sites to this marketer's clients
    const targetMkt = !isRegulator ? authUser?.org_id : marketerId
    const relevantClientSites = targetMkt
      ? rawClientSites.filter(
          (s) =>
            s.current_marketeur_org_id === targetMkt ||
            s.client_org_id === targetMkt
        )
      : rawClientSites
    const sitesToUse =
      relevantClientSites.length > 0 ? relevantClientSites : rawClientSites

    // Group client sites
    const groups: Array<{
      clientOrgId: string
      clientName: string
      sites: RawClientSite[]
    }> = []

    // Sort sites: matching depot's region first!
    const sortedSites = [...sitesToUse].sort((a, b) => {
      const aSameRegion = a.region === currentRegion ? 1 : 0
      const bSameRegion = b.region === currentRegion ? 1 : 0
      if (aSameRegion !== bSameRegion) return bSameRegion - aSameRegion
      return a.name.localeCompare(b.name)
    })

    const sitesByOrg: Record<string, RawClientSite[]> = {}
    for (const site of sortedSites) {
      const cOrgId = site.client_org_id || 'autre'
      if (!sitesByOrg[cOrgId]) sitesByOrg[cOrgId] = []
      sitesByOrg[cOrgId]!.push(site)
    }

    for (const [cOrgId, sList] of Object.entries(sitesByOrg)) {
      const orgName =
        orgMap.get(cOrgId) ||
        (cOrgId.includes('dovv') ? 'Supermarchés DOVV SA' : 'Clients Réseau')
      groups.push({
        clientOrgId: cOrgId,
        clientName: orgName,
        sites: sList,
      })
    }

    // Sort groups: group containing same-region sites first
    return groups.sort((a, b) => {
      const aHasRegion = a.sites.some((s) => s.region === currentRegion) ? 1 : 0
      const bHasRegion = b.sites.some((s) => s.region === currentRegion) ? 1 : 0
      if (aHasRegion !== bHasRegion) return bHasRegion - aHasRegion
      return a.clientName.localeCompare(b.clientName)
    })
  }, [orgs, rawClientSites, currentRegion])

  const initializedStops = useRef(false)
  // Initialize client stops with default sites if empty
  useEffect(() => {
    if (open && !initializedStops.current && clientStops.length === 0 && rawClientSites.length > 0) {
      initializedStops.current = true
      // Find DOVV or same-region client sites
      const sameRegionClients = rawClientSites.filter(
        (s) => s.region === currentRegion
      )
      const initialSites =
        sameRegionClients.length >= 2
          ? sameRegionClients.slice(0, 2)
          : rawClientSites.slice(0, 2)

      const perStopQty = Math.round(quantity / (initialSites.length || 1))
      setClientStops(
        initialSites.map((s, idx) => ({
          kind: 'CLIENT_SITE',
          destinationId: s.id,
          sequence: idx + 2, // Séquence 1 est le dépôt !
          plannedQuantity: perStopQty,
        }))
      )
    }
  }, [open, rawClientSites, currentRegion, quantity, clientStops.length])

  function addClientStop() {
    const nextSeq = clientStops.length + 2 // After depot sequence 1
    const availableSite =
      rawClientSites.find(
        (s) => !clientStops.some((cs) => cs.destinationId === s.id)
      ) || rawClientSites[0]

    setClientStops((prev) => [
      ...prev,
      {
        kind: 'CLIENT_SITE',
        destinationId: availableSite?.id || '',
        sequence: nextSeq,
        plannedQuantity: cargoType === 'VRAC' ? 2.5 : 25,
      },
    ])
  }

  function updateClientStop(
    index: number,
    patch: Partial<TourPlanningValues['clientStops'][number]>
  ) {
    setClientStops((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    )
  }

  function removeClientStop(index: number) {
    setClientStops((prev) => {
      const filtered = prev.filter((_, i) => i !== index)
      return filtered.map((r, i) => ({ ...r, sequence: i + 2 }))
    })
  }

  const quantityUnit = cargoType === 'VRAC' ? 'TM' : 'btl'

  // Total planned by client stops
  const clientPlannedTotal = useMemo(() => {
    return clientStops.reduce(
      (sum, r) => sum + (Number(r.plannedQuantity) || 0),
      0
    )
  }, [clientStops])

  async function handleSubmit() {
    if (submitting) return
    setCrewError(null)
    if (!availableMarketers.some((marketer) => marketer.id === marketerId)) {
      setCrewError('Sélectionnez une organisation autorisée.')
      return
    }
    if (
      executionMode === 'INTERNAL' &&
      (!availableDrivers.some((driver) => driver.id === driverId) ||
        !livreurs.some((livreur) => livreur.id === livreurId) ||
        !availableVehicles.some((vehicle) => vehicle.id === vehicleId))
    ) {
      setCrewError(
        'Sélectionnez un véhicule, un chauffeur et un livreur autorisés pour votre organisation.'
      )
      return
    }
    if (!depotSiteId) {
      setCheckpointError('Sélectionnez le dépôt de chargement.')
      return
    }
    if (clientStops.length === 0) {
      setCheckpointError('Ajoutez au moins un site client pour la livraison')
      return
    }

    setSubmitting(true)
    setCheckpointError(null)

    try {
      // 1. Build Tour Checkpoints:
      // Séquence 1 = Dépôt (chargement), Séquences 2..N = Client sites (livraisons)
      const allCheckpointsPayload = [
        {
          id: `cp-${tourCode.trim()}-depot-1`,
          sequence: 1,
          destination_site_id: depotSiteId,
          site_id: depotSiteId,
          planned_quantity: quantity,
          expected_quantity: quantity,
          status: 'PENDING' as const,
        },
        ...clientStops.map((stop, idx) => ({
          id: `cp-${tourCode.trim()}-client-${idx + 2}`,
          sequence: idx + 2,
          destination_site_id: stop.destinationId,
          site_id: stop.destinationId,
          planned_quantity: stop.plannedQuantity,
          expected_quantity: stop.plannedQuantity,
          status: 'PENDING' as const,
        })),
      ]

      const draft: TourDraft = {
        scheduled_at: form.getValues('scheduledAt') ? new Date(form.getValues('scheduledAt')!).toISOString() : undefined,
        tour_code: tourCode.trim(),
        marketeur_org_id: marketerId,
        execution_mode: executionMode,
        type: cargoType,
        requested_quantity: toRequestedQuantity(quantity),
        transporter_org_id: executionMode === 'EXTERNAL' ? transporterId : null,
        vehicle_id: executionMode === 'INTERNAL' ? vehicleId || null : null,
        driver_id: executionMode === 'INTERNAL' ? driverId || null : null,
        livreur_user_id:
          executionMode === 'INTERNAL' ? livreurId || null : null,
        checkpoints: allCheckpointsPayload,
      }

      // Create Tour (creates DRAFT in store/backend)
      const created = await useToursStore.getState().createTourAsync(draft)
      const tourId = created.id

      // Séquence 1 (dépôt) + Séquences 2..N (clients) checkpoints registered
      for (const cp of import.meta.env.VITE_API_MODE === 'http'
        ? []
        : allCheckpointsPayload) {
        try {
          await api.tours.addCheckpoint(tourId, {
            siteId: cp.site_id,
            sequence: cp.sequence,
          })
        } catch {
          // Store already has them via createTourAsync fallback
        }
      }

      // Auto-transition:
      const currentTour = useToursStore
        .getState()
        .tours.find((t) => t.id === tourId)
      const currentStatus = currentTour?.status ?? created.tourneeStatus

      if (executionMode === 'INTERNAL') {
        if (currentStatus !== 'PLANNED') {
          try {
            await useToursStore.getState().performActionAsync(tourId, 'plan')
          } catch (error) {
            if (import.meta.env.VITE_API_MODE === 'http') throw error
            useToursStore.getState().performAction(tourId, 'plan')
          }
        }
        toast.success(
          `Tournée ${tourCode} planifiée avec succès ! Statut : PLANNED (1 Dépôt + ${clientStops.length} arrêts clients)`
        )
      } else {
        if (currentStatus !== 'PENDINGTRANSPORTERACK') {
          try {
            await useToursStore
              .getState()
              .performActionAsync(tourId, 'send-to-transporter')
          } catch (error) {
            if (import.meta.env.VITE_API_MODE === 'http') throw error
            useToursStore
              .getState()
              .performAction(tourId, 'send-to-transporter')
          }
        }
        toast.success(
          `Tournée ${tourCode} transmise au transporteur ! Statut : PENDINGTRANSPORTERACK`
        )
      }

      invalidateResource(queryClient, 'tours')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur création tournée'
      toast.error(msg)
      setCheckpointError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='mx-auto w-full max-w-5xl'>
      <Form {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
          className='space-y-6'
        >
          <fieldset disabled={submitting} className='space-y-6'>
            <header className='space-y-2'>
              <h2 className='text-lg font-semibold'>
                <span className='size-2.5 rounded-full bg-primary' />
                Planifier les livraisons
              </h2>
              <p className='text-sm text-muted-foreground'>
                Workflow de distribution : Dépôt régional en Séquence 1
                (chargement) suivi des livraisons clients (Séquences 2..N).
              </p>
            </header>

            {dataError && (
              <div className='rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700'>
                Mode démonstration actif — Utilisation des données
                référentielles locales ({dataError}).
              </div>
            )}

            {checkpointError && (
              <div className='rounded-md border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-700'>
                {checkpointError}
              </div>
            )}

            {crewError && (
              <p role='alert' className='text-sm text-destructive'>
                {crewError}
              </p>
            )}
            {/* SECTION 1: Paramètres généraux */}
            <div className='rounded-lg border bg-muted/20 p-6 space-y-5'>
              <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between'>
                <span>1. Paramètres & Cargaison</span>
                <span className='font-mono text-primary font-bold'>
                  {tourCode}
                </span>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-5'>
                <FormField
                  control={form.control}
                  name='executionMode'
                  render={() => (
                    <FormItem>
                      <FormLabel className='block text-xs font-medium text-foreground mb-1'>
                        Mode d'exécution
                      </FormLabel>
                      <FormControl>
                        <select
                          value={executionMode}
                          onChange={(e) =>
                            setExecutionMode(e.target.value as ExecutionMode)
                          }
                          className='w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-primary'
                        >
                          <option value='INTERNAL'>
                            Interne (Flotte propre)
                          </option>
                          <option value='EXTERNAL'>
                            Sous-traitance (Transporteur agréé)
                          </option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='cargoType'
                  render={() => (
                    <FormItem>
                      <FormLabel className='block text-xs font-medium text-foreground mb-1'>
                        Type de cargaison
                      </FormLabel>
                      <FormControl>
                        <select
                          value={cargoType}
                          onChange={(e) => {
                            const next = e.target.value as TourneeType
                            setCargoType(next)
                            setQuantity(next === 'VRAC' ? 10 : 50)
                          }}
                          className='w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-primary'
                        >
                          <option value='BOUTEILLES50KG'>
                            Bouteilles 50 kg (Plateau — BTL)
                          </option>
                          <option value='VRAC'>VRAC (Citerne — TM)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='quantity'
                  render={() => (
                    <FormItem>
                      <FormLabel className='block text-xs font-medium text-foreground mb-1'>
                        Quantité totale ({quantityUnit})
                      </FormLabel>
                      <FormControl>
                        <input
                          type='number'
                          required
                          min={0}
                          step={cargoType === 'VRAC' ? '0.1' : '1'}
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className='w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-primary'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField control={form.control} name='scheduledAt' render={({field}) => <FormItem><FormLabel>Départ prévu (facultatif)</FormLabel><FormControl><input {...field} type='datetime-local' className='h-10 w-full rounded-md border bg-background px-3 text-sm sm:max-w-sm' /></FormControl><FormMessage /></FormItem>} />
          {/* SECTION 2: Acteurs (Marketeur, Flotte, Équipage) */}
            <div className='rounded-lg border bg-muted/20 p-6 space-y-5'>
              <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                2. Organisation & Équipage
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <FormField
                  control={form.control}
                  name='marketerId'
                  render={() => (
                    <FormItem>
                      <FormLabel className='block text-xs font-medium text-foreground mb-1'>
                        Marketeur Donneur d'ordre
                      </FormLabel>
                      <FormControl>
                        <select
                          value={marketerId}
                          disabled={!isRegulator}
                          onChange={(e) => setMarketerId(e.target.value)}
                          className='w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-primary'
                        >
                          {availableMarketers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} {m.code ? `(${m.code})` : ''}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {executionMode === 'EXTERNAL' ? (
                  <FormField
                    control={form.control}
                    name='transporterId'
                    render={() => (
                      <FormItem>
                        <FormLabel className='block text-xs font-medium text-foreground mb-1'>
                          Transporteur agréé
                        </FormLabel>
                        <FormControl>
                          <select
                            value={transporterId}
                            onChange={(e) => setTransporterId(e.target.value)}
                            className='w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-primary'
                          >
                            {availableTransporters.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name='vehicleId'
                    render={() => (
                      <FormItem>
                        <FormLabel className='block text-xs font-medium text-foreground mb-1'>
                          Véhicule assigné
                        </FormLabel>
                        <FormControl>
                          <select
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            className='w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-primary'
                          >
                            {availableVehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.license_plate} (
                                {v.max_bottle_count
                                  ? `${v.max_bottle_count} btl`
                                  : `${v.max_volume} TM`}
                                )
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {executionMode === 'INTERNAL' && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
                  <FormField
                    control={form.control}
                    name='driverId'
                    render={() => (
                      <FormItem>
                        <FormLabel className='block text-xs font-medium text-foreground mb-1'>
                          Chauffeur
                          {rolesResolving ? ' (chargement...)' : ''}
                        </FormLabel>
                        <FormControl>
                          <select
                            aria-label='Chauffeur'
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                            className='w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-primary'
                          >
                            <option value=''>
                              {availableDrivers.length
                                ? 'Choisir un chauffeur'
                                : 'Aucun chauffeur disponible dans votre organisation'}
                            </option>
                            {availableDrivers.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.first_name} {d.last_name}{' '}
                                {d.license_number
                                  ? `— Permis: ${d.license_number}`
                                  : ''}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='livreurId'
                    render={() => (
                      <FormItem>
                        <FormLabel className='block text-xs font-medium text-foreground mb-1'>
                          Livreur / Convoyeur
                        </FormLabel>
                        <FormControl>
                          <select
                            aria-label='Livreur / Convoyeur'
                            value={livreurId}
                            onChange={(e) => setLivreurId(e.target.value)}
                            className='w-full rounded-md border bg-background px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-primary'
                          >
                            <option value=''>
                              {livreurs.length
                                ? 'Choisir un livreur'
                                : 'Aucun livreur disponible dans votre organisation'}
                            </option>
                            {livreurs.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.first_name} {u.last_name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* SECTION 3: SÉQUENCE 1 — DÉPÔT DE DÉPART (CHARGEMENT) */}
            <div className='rounded-lg border-2 border-primary/20 bg-primary/5 p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold'>
                    1
                  </span>
                  <span className='text-xs font-bold text-foreground'>
                    Départ · Chargement
                  </span>
                </div>
                <span className='rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary'>
                  {quantity} {quantityUnit} à charger
                </span>
              </div>

              <FormField control={form.control} name='depotSiteId' render={({field}) => <FormItem>
                <FormLabel className='block text-[11px] font-medium text-muted-foreground mb-1'>
                  Sélectionnez le Dépôt / Centre Emplisseur (Région{' '}
                  {currentRegion} prioritaire)
                </FormLabel>
                <FormControl><select ref={field.ref} name={field.name} onBlur={field.onBlur}
                  value={depotSiteId}
                  onChange={(e) => setDepotSiteId(e.target.value)}
                  className='w-full rounded-md border bg-background px-3 py-2 text-xs font-medium shadow-xs focus:ring-1 focus:ring-primary'
                >
                  {marketerDepotOptions.map((s) => {
                    const isMyOrg =
                      s.org_id === marketerId ||
                      s.organization_id === marketerId
                    const isSameRegion = s.region === currentRegion
                    const tag =
                      isMyOrg && isSameRegion
                        ? 'Mon Dépôt Régional'
                        : isSameRegion
                          ? 'Région Principale'
                          : ''
                    return (
                      <option key={s.id} value={s.id}>
                        {tag ? `[${tag}] ` : ''}
                        {s.name} ({s.region})
                      </option>
                    )
                  })}
                </select></FormControl><FormMessage />
                <p className='mt-1 text-[11px] text-muted-foreground'>
                  Le camion commence par charger la cargaison au dépôt
                  sélectionné avant de partir vers les clients.
                </p>
              </FormItem>} />
            </div>

            {/* SECTION 4: SÉQUENCES 2..N — POINTS CLIENTS DE LIVRAISON */}
            <div className='rounded-lg border bg-muted/20 p-6 space-y-5'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='flex size-5 items-center justify-center rounded-full bg-muted-foreground/30 text-xs font-bold'>
                    2..N
                  </span>
                  <span className='text-xs font-bold text-foreground'>
                    Séquences de Livraison Client (Région {currentRegion}{' '}
                    d'abord)
                  </span>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addClientStop}
                  className='text-xs h-7 gap-1'
                >
                  <Plus className='size-3.5' />
                  Ajouter un arrêt client
                </Button>
              </div>

              <div className='space-y-2'>
                {clientStops.map((stop, i) => (
                  <div
                    key={i}
                    className='grid grid-cols-[auto_1fr_6rem_2rem] items-center gap-2 rounded-md border bg-background p-2 text-xs shadow-xs'
                  >
                    <div className='flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground'>
                      {i + 2}
                    </div>

                    <FormField
                      control={form.control}
                      name={`clientStops.${i}.destinationId`}
                      render={() => (
                        <FormItem>
                          <FormLabel className='block text-[10px] font-semibold text-muted-foreground uppercase'>
                            Client & Site de livraison
                          </FormLabel>
                          <FormControl>
                            <select
                              value={stop.destinationId}
                              onChange={(e) =>
                                updateClientStop(i, {
                                  destinationId: e.target.value,
                                })
                              }
                              className='w-full rounded border bg-background px-2 py-1 text-xs'
                            >
                              {clientOrgGroups.map((grp) => (
                                <optgroup
                                  key={grp.clientOrgId}
                                  label={grp.clientName}
                                >
                                  {grp.sites.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.region === currentRegion ? '' : ''}
                                      {s.name} ({s.region})
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`clientStops.${i}.plannedQuantity`}
                      render={() => (
                        <FormItem>
                          <FormLabel className='block text-[10px] font-semibold text-muted-foreground uppercase'>
                            Qté ({quantityUnit})
                          </FormLabel>
                          <FormControl>
                            <input
                              type='number'
                              min={1}
                              step={cargoType === 'VRAC' ? '0.1' : '1'}
                              value={stop.plannedQuantity}
                              onChange={(e) =>
                                updateClientStop(i, {
                                  plannedQuantity: Number(e.target.value),
                                })
                              }
                              className='w-full rounded border bg-background px-2 py-1 text-xs text-center'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='pt-3.5'>
                      <button
                        type='button'
                        onClick={() => removeClientStop(i)}
                        className='text-muted-foreground hover:text-rose-600 transition-colors p-1'
                        title='Supprimer cet arrêt'
                      >
                        <X className='size-3.5' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className='flex items-center justify-between text-xs text-muted-foreground border-t pt-2'>
                <span>
                  Total planifié aux clients :{' '}
                  <strong
                    className={
                      clientPlannedTotal === quantity
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }
                  >
                    {clientPlannedTotal} / {quantity} {quantityUnit}
                  </strong>
                </span>
                <span className='italic text-[11px] inline-flex items-center gap-1.5'>
                  {clientPlannedTotal === quantity ? (
                    <>
                      <Check className='size-3.5 text-emerald-600' />
                      <span>Répartition exacte</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className='size-3.5 text-amber-600' />
                      <span>Vérifiez la répartition avant de confirmer</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <FormField
              control={form.control}
              name='clientStops'
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
            <section aria-label='Aperçu routier' className='space-y-3'>
              <h3 className='font-semibold'>Aperçu de l’itinéraire</h3>
              {previewTrip ? (
                <Suspense
                  fallback={<p role='status'>Chargement de la carte…</p>}
                >
                  <TourCorridorMap
                    trip={previewTrip}
                    preview
                    formatDateTime={() => 'Planification'}
                    formatQuantity={(v) =>
                      new Intl.NumberFormat('fr-FR').format(v) +
                      (cargoType === 'VRAC' ? ' TM' : ' btl')
                    }
                  />
                </Suspense>
              ) : (
                <p
                  role='status'
                  className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'
                >
                  Sélectionnez le dépôt et les arrêts disposant de coordonnées
                  GPS pour calculer le trajet. Aucun emplacement manquant n’est
                  estimé.
                </p>
              )}
            </section>
            <footer className='sticky bottom-0 z-20 flex justify-end gap-3 border-t bg-background/95 p-4 backdrop-blur'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className='text-xs'
              >
                Annuler
              </Button>
              <Button
                type='submit'
                disabled={
                  submitting || !depotSiteId || clientStops.length === 0
                }
                className='text-xs font-semibold'
              >
                {submitting
                  ? 'Planification en cours...'
                  : executionMode === 'EXTERNAL'
                    ? 'Enregistrer et transmettre'
                    : 'Enregistrer et planifier'}
              </Button>
            </footer>
          </fieldset>
        </form>
      </Form>
    </div>
  )
}
