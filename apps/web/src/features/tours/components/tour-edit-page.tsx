import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  Truck,
  MapPin,
  Users,
  Info,
} from 'lucide-react'
import { api } from '@lpg/api-client'
import { hasEffectivePermission } from '@lpg/permissions'
import { deriveContractStatus } from '@/features/transporter-contracts/lib/contract-status'
import type {
  DeliveryTour,
  TransporterContract,
  Site,
  ClientSite,
} from '@lpg/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageShell, SectionCard } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { useToursStore, type TourDraft } from '@/store/tours-store'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { canEditTour, EDITABLE_STATUSES } from '../data/tour-machine'
import { tourStatusLabels } from '../data/tour-activity'
import {
  organizations as defaultOrganizations,
  vehicles as defaultVehicles,
  users as defaultUsers,
  drivers as defaultDrivers,
  sites as defaultSites,
  client_sites as defaultClientSites,
} from '@/lib/entity-data'
import {
  canViewAllTourCrew,
  filterTourCrew,
  isTourLivreur,
  extractUserRoleCodes,
} from '../lib/tour-create-helpers'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateResource } from '@/lib/api/invalidation'
import { STATUS_CLASS } from './tour-actions'

import { buildDraftTourActivity } from '../lib/tour-draft-preview'
const TourCorridorMap = lazy(() =>
  import('./tour-corridor-map').then((m) => ({ default: m.TourCorridorMap }))
)

interface TourEditPageProps {
  tourId: string
  onSaved?: () => void
  onBusyChange?: (busy: boolean) => void
}

const tourEditSchema = z
  .object({
    scheduled_at: z
      .string()
      .optional()
      .refine((v) => !v || Number.isFinite(Date.parse(v)), 'Date invalide'),
    execution_mode: z.enum(['INTERNAL', 'EXTERNAL']),
    type: z.enum(['VRAC', 'BOUTEILLES50KG']),
    requested_quantity: z
      .number()
      .positive('La quantité demandée doit être supérieure à 0'),
    transporter_org_id: z.string().optional(),
    source_site_id: z
      .string()
      .min(1, 'Le site de départ (dépôt) est obligatoire'),
    vehicle_id: z.string().optional(),
    driver_id: z.string().optional(),
    livreur_user_id: z.string().optional(),
    client_stops: z
      .array(
        z.object({
          client_site_id: z.string().min(1, 'Site client requis'),
          expected_quantity: z
            .number()
            .positive('Quantité requise supérieure à 0'),
        })
      )
      .min(1, 'Au moins un arrêt client est requis'),
  })
  .superRefine((data, ctx) => {
    if (data.execution_mode === 'EXTERNAL' && !data.transporter_org_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transporter_org_id'],
        message: 'Transporteur externe requis en mode EXTERNAL',
      })
    }
    if (data.execution_mode === 'INTERNAL') {
      if (!data.vehicle_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['vehicle_id'],
          message: 'Véhicule obligatoire en mode INTERNAL',
        })
      }
      if (!data.driver_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['driver_id'],
          message: 'Chauffeur obligatoire en mode INTERNAL',
        })
      }
      if (!data.livreur_user_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['livreur_user_id'],
          message: 'Livreur obligatoire en mode INTERNAL',
        })
      }
    }
    if (data.type === 'BOUTEILLES50KG') {
      if (!Number.isSafeInteger(data.requested_quantity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['requested_quantity'],
          message: 'Le nombre de bouteilles doit être un entier',
        })
      }
      for (let i = 0; i < data.client_stops.length; i++) {
        if (!Number.isSafeInteger(data.client_stops[i]?.expected_quantity)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['client_stops', i, 'expected_quantity'],
            message: 'Le nombre de bouteilles doit être un entier',
          })
        }
      }
    }
    const stopsSum = data.client_stops.reduce(
      (acc, s) => acc + (s.expected_quantity || 0),
      0
    )
    if (Math.abs(stopsSum - data.requested_quantity) > 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requested_quantity'],
        message: `La somme des arrêts (${stopsSum}) doit correspondre à la quantité demandée (${data.requested_quantity})`,
      })
    }
  })

type TourEditFormValues = z.infer<typeof tourEditSchema>

export function TourEditPage({
  tourId,
  onSaved,
  onBusyChange,
}: TourEditPageProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const activeRole = useRoleStore((s) => s.activeRole)
  const authUser = useAuthStore((s) => s.user)
  const isRegulator = canViewAllTourCrew(authUser)

  const tours = useToursStore((s) => s.tours)
  const toursLoading = useToursStore((s) => s.loading)
  const allCheckpoints = useToursStore((s) => s.checkpoints)
  const fetchedCheckpoints = useToursStore((s) => s.checkpointsByTour[tourId])
  const checkpointsLoading = useToursStore((s) => s.checkpointsLoading[tourId])
  const tourCheckpoints = useMemo(
    () =>
      fetchedCheckpoints ??
      allCheckpoints.filter((c) => (c.tournee_id ?? c.tour_id) === tourId),
    [fetchedCheckpoints, allCheckpoints, tourId]
  )

  const tour: DeliveryTour | undefined = useMemo(
    () => tours.find((t) => t.id === tourId),
    [tours, tourId]
  )

  const [submitting, setSubmitting] = useState(false)

  const [contracts, setContracts] = useState<TransporterContract[]>([])

  // External options
  const [orgs, setOrgs] = useState<
    Array<{ id: string; name: string; type: string }>
  >([])
  const [vehicles, setVehicles] = useState<
    Array<{ id: string; license_plate: string; type: string; org_id?: string }>
  >([])
  const [drivers, setDrivers] = useState<
    Array<{
      id: string
      first_name?: string
      last_name?: string
      org_id?: string
      is_active?: boolean
    }>
  >([])
  const [candidates, setCandidates] = useState<
    Array<{
      id: string
      first_name?: string
      last_name?: string
      org_id?: string
      is_active?: boolean
    }>
  >([])
  const [roleCodesById, setRoleCodesById] = useState<Record<string, string[]>>(
    {}
  )
  const [rawSites, setRawSites] = useState<Site[]>([])
  const [rawClientSites, setRawClientSites] = useState<ClientSite[]>([])

  useEffect(() => {
    useToursStore.getState().fetchTours()
    useToursStore
      .getState()
      .fetchCheckpoints(tourId)
      .catch(() => undefined)
  }, [tourId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [orgRes, vehRes, usrRes, siteRes, csRes, drvRes, contractRes] =
          await Promise.allSettled([
            api.organizations.list({ size: 200 }),
            api.vehicles.list({ size: 200 }),
            api.users.list({ size: 200 }),
            api.sites.list({ size: 200 }),
            api.clientSites.list({ size: 200 }),
            api.drivers.list({ size: 200 }),
            api.transporterContracts.list({ size: 200 }),
          ])

        if (cancelled) return
        setContracts(
          contractRes.status === 'fulfilled' ? contractRes.value.data : []
        )

        const orgData =
          orgRes.status === 'fulfilled' &&
          Array.isArray(orgRes.value?.data) &&
          orgRes.value.data.length > 0
            ? orgRes.value.data
            : defaultOrganizations
        setOrgs(orgData as Array<{ id: string; name: string; type: string }>)

        const vehData =
          vehRes.status === 'fulfilled' &&
          Array.isArray(vehRes.value?.data) &&
          vehRes.value.data.length > 0
            ? vehRes.value.data
            : defaultVehicles
        setVehicles(
          vehData as Array<{
            id: string
            license_plate: string
            type: string
            org_id?: string
          }>
        )

        const usrData =
          usrRes.status === 'fulfilled' &&
          Array.isArray(usrRes.value?.data) &&
          usrRes.value.data.length > 0
            ? usrRes.value.data
            : defaultUsers
        const rows = filterTourCrew(
          (usrData as Array<{ id: string; is_active?: boolean }>).filter(
            (u) => !!u && typeof u.id === 'string'
          ),
          authUser
        )
        setCandidates(
          rows as Array<{
            id: string
            first_name?: string
            last_name?: string
            org_id?: string
          }>
        )

        const drvData =
          drvRes.status === 'fulfilled' &&
          Array.isArray(drvRes.value?.data) &&
          drvRes.value.data.length > 0
            ? drvRes.value.data
            : defaultDrivers
        setDrivers(
          drvData as Array<{
            id: string
            first_name?: string
            last_name?: string
            org_id?: string
          }>
        )

        let siteData =
          siteRes.status === 'fulfilled' &&
          Array.isArray(siteRes.value?.data) &&
          siteRes.value.data.length > 0
            ? siteRes.value.data
            : defaultSites
        if (!isRegulator && authUser?.org_id) {
          siteData = (siteData as Array<{ org_id?: string }>).filter(
            (s) => s.org_id === authUser.org_id
          )
        }
        setRawSites(siteData as Site[])

        let csData =
          csRes.status === 'fulfilled' &&
          Array.isArray(csRes.value?.data) &&
          csRes.value.data.length > 0
            ? csRes.value.data
            : defaultClientSites
        if (!isRegulator && authUser?.org_id) {
          csData = (
            csData as Array<{
              current_marketeur_org_id?: string
              client_org_id?: string
            }>
          ).filter(
            (s) =>
              s.current_marketeur_org_id === authUser.org_id ||
              s.client_org_id === authUser.org_id
          )
        }
        setRawClientSites(csData as ClientSite[])

        // Resolve livreur role codes
        const codeMap: Record<string, string[]> = {}
        for (const c of rows) {
          const codes = extractUserRoleCodes(c)
          if (codes.length > 0) codeMap[c.id] = codes
        }
        setRoleCodesById(codeMap)
      } catch {
        // Fallback already assigned
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authUser, isRegulator])

  const form = useForm<TourEditFormValues>({
    resolver: zodResolver(tourEditSchema),
    defaultValues: {
      execution_mode: 'INTERNAL',
      type: 'VRAC',
      requested_quantity: 1,
      source_site_id: '',
      transporter_org_id: '',
      vehicle_id: '',
      driver_id: '',
      livreur_user_id: '',
      client_stops: [{ client_site_id: '', expected_quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'client_stops',
  })

  // Populate form once tour and checkpoints are ready
  const [formInitialized, setFormInitialized] = useState(false)
  useEffect(() => {
    if (
      !tour ||
      formInitialized ||
      checkpointsLoading ||
      !tourCheckpoints.length
    )
      return

    const sortedCheckpoints = [...tourCheckpoints].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
    )

    const firstCheckpoint = sortedCheckpoints[0]
    const stopCheckpoints = sortedCheckpoints.slice(1)

    const sourceSiteId = tour.source_site_id ?? firstCheckpoint?.site_id ?? ''

    const stops =
      stopCheckpoints.length > 0
        ? stopCheckpoints.map((cp) => ({
            client_site_id: cp.client_site_id ?? cp.site_id ?? '',
            expected_quantity: cp.expected_quantity ?? 0,
          }))
        : [{ client_site_id: '', expected_quantity: tour.requested_quantity }]

    const normalizedType: 'VRAC' | 'BOUTEILLES50KG' =
      tour.type === 'BOUTEILLES50KG' ? 'BOUTEILLES50KG' : 'VRAC'

    form.reset({
      scheduled_at: tour.scheduled_at
        ? new Date(
            new Date(tour.scheduled_at).getTime() -
              new Date(tour.scheduled_at).getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16)
        : '',
      execution_mode: tour.execution_mode ?? 'INTERNAL',
      type: normalizedType,
      requested_quantity: tour.requested_quantity ?? 0,
      source_site_id: sourceSiteId,
      transporter_org_id: tour.transporter_org_id ?? '',
      vehicle_id: tour.vehicle_id ?? '',
      driver_id: tour.driver_id ?? '',
      livreur_user_id: tour.livreur_user_id ?? '',
      client_stops: stops,
    })
    setFormInitialized(true)
  }, [tour, tourCheckpoints, form, formInitialized, checkpointsLoading])

  const watchMode = form.watch('execution_mode')
  const watchType = form.watch('type')
  const watchQuantity = form.watch('requested_quantity')
  const watchStops = form.watch('client_stops')

  const totalStopsQuantity = useMemo(() => {
    return (watchStops ?? []).reduce(
      (acc, s) => acc + (Number(s?.expected_quantity) || 0),
      0
    )
  }, [watchStops])

  const sourceSiteId = form.watch('source_site_id')
  const previewTrip = useMemo(
    () =>
      buildDraftTourActivity(
        {
          sourceSiteId,
          type: watchType,
          execution_mode: watchMode,
          requested_quantity: watchQuantity,
          marketeur_org_id: tour?.marketeur_org_id,
          checkpoints: (watchStops ?? []).map((stop, index) => ({
            client_site_id: stop.client_site_id,
            sequence: index + 2,
            expected_quantity: stop.expected_quantity,
          })),
        },
        { sourceSites: rawSites, clientSites: rawClientSites }
      ),
    [
      sourceSiteId,
      watchType,
      watchMode,
      watchQuantity,
      watchStops,
      tour?.marketeur_org_id,
      rawSites,
      rawClientSites,
    ]
  )
  const unitLabel = watchType === 'VRAC' ? 'TM' : 'btl'

  // Filtered lists
  const transporters = useMemo(
    () =>
      orgs.filter(
        (o) =>
          o.type === 'TRANSPORTEUR' &&
          (o.id === tour?.transporter_org_id ||
            contracts.some(
              (c) =>
                c.transporter_org_id === o.id &&
                c.marketeur_org_id === tour?.marketeur_org_id &&
                deriveContractStatus(c) === 'ACTIVE'
            ))
      ),
    [orgs, contracts, tour]
  )

  const availableVehicles = useMemo(() => {
    if (watchMode === 'EXTERNAL') return []
    const mktId = tour?.marketeur_org_id ?? authUser?.org_id
    if (mktId) {
      return vehicles.filter((v) => v.org_id === mktId && v.type === watchType)
    }
    return vehicles
  }, [watchMode, watchType, tour, authUser, vehicles])

  const availableDrivers = useMemo(() => {
    if (watchMode === 'EXTERNAL') return []
    const mktId = tour?.marketeur_org_id ?? authUser?.org_id
    if (mktId) {
      return drivers.filter((d) => d.org_id === mktId)
    }
    return drivers
  }, [watchMode, tour, authUser, drivers])

  const availableLivreurs = useMemo(() => {
    if (watchMode === 'EXTERNAL') return []
    const mktId = tour?.marketeur_org_id ?? authUser?.org_id
    return candidates.filter((c) => {
      if (mktId && c.org_id !== mktId) return false
      return isTourLivreur(c, roleCodesById[c.id])
    })
  }, [watchMode, tour, authUser, candidates, roleCodesById])

  if (toursLoading && !tour) {
    return (
      <PageShell>
        <div className='flex items-center justify-center p-12'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </div>
      </PageShell>
    )
  }

  if (!tour) {
    return (
      <PageShell>
        <PageHeader
          title='Tournée introuvable'
          description={`Aucune tournée ne correspond à l'identifiant ${tourId}.`}
        />
        <SectionCard>
          <Button asChild variant='outline'>
            <Link to='/tour-tracking'>
              <ArrowLeft className='size-4 mr-2' />
              Retour au suivi
            </Link>
          </Button>
        </SectionCard>
      </PageShell>
    )
  }

  const isEditable = canEditTour(tour)
  const canWrite = hasEffectivePermission(
    activeRole,
    'tours.write',
    authUser?.custom_roles
  )

  if (!canWrite) {
    return (
      <PageShell>
        <PageHeader
          title='Accès refusé'
          description='Vous ne disposez pas des permissions requises pour modifier une tournée.'
        />
        <SectionCard>
          <Button asChild variant='outline'>
            <Link to='/tour-tracking/$tourId' params={{ tourId }}>
              <ArrowLeft className='size-4 mr-2' />
              Retour à la tournée
            </Link>
          </Button>
        </SectionCard>
      </PageShell>
    )
  }

  if (!isEditable) {
    return (
      <PageShell>
        <PageHeader
          title={`Tournée ${tour.tour_code ?? tour.id}`}
          description='Cette tournée ne peut plus être modifiée.'
        />
        <SectionCard className='space-y-4'>
          <div className='flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200'>
            <AlertTriangle className='size-5 shrink-0' />
            <div>
              <p className='font-semibold'>Statut non modifiable</p>
              <p className='text-sm'>
                Le statut actuel est{' '}
                <strong>{tourStatusLabels[tour.status] ?? tour.status}</strong>.
                Seules les tournées au statut{' '}
                {EDITABLE_STATUSES.map((s) => tourStatusLabels[s] ?? s).join(
                  ', '
                )}{' '}
                peuvent être modifiées.
              </p>
            </div>
          </div>
          <Button asChild variant='outline'>
            <Link to='/tour-tracking/$tourId' params={{ tourId }}>
              <ArrowLeft className='size-4 mr-2' />
              Retour au suivi de la tournée
            </Link>
          </Button>
        </SectionCard>
      </PageShell>
    )
  }

  async function onSubmit(values: TourEditFormValues) {
    if (
      values.execution_mode === 'EXTERNAL' &&
      values.transporter_org_id !== tour?.transporter_org_id &&
      !contracts.some(
        (c) =>
          c.transporter_org_id === values.transporter_org_id &&
          c.marketeur_org_id === tour?.marketeur_org_id &&
          deriveContractStatus(c) === 'ACTIVE'
      )
    ) {
      form.setError('transporter_org_id', {
        message: 'Un contrat actif et accepté est obligatoire.',
      })
      return
    }
    if (values.execution_mode === 'INTERNAL') {
      const choices = {
        vehicle_id: availableVehicles,
        driver_id: availableDrivers,
        livreur_user_id: availableLivreurs,
      }
      for (const key of [
        'vehicle_id',
        'driver_id',
        'livreur_user_id',
      ] as const) {
        if (!choices[key].some((row) => row.id === values[key])) {
          form.setError(key, {
            message:
              'Sélectionnez une affectation autorisée pour ce marketeur.',
          })
          return
        }
      }
    }
    setSubmitting(true)
    onBusyChange?.(true)
    try {
      const checkpoints = [
        {
          id: tourCheckpoints.find((c) => c.sequence === 1)?.id,
          sequence: 1,
          tournee_id: tour!.id,
          site_id: values.source_site_id,
          expected_quantity: values.requested_quantity,
          status: 'PENDING' as const,
        },
        ...values.client_stops.map((stop, idx) => ({
          id: tourCheckpoints.find((c) => c.sequence === idx + 2)?.id,
          sequence: idx + 2,
          tournee_id: tour!.id,
          client_site_id: stop.client_site_id,
          expected_quantity: stop.expected_quantity,
          status: 'PENDING' as const,
        })),
      ]

      const patch: Partial<TourDraft> = {
        scheduled_at: values.scheduled_at
          ? new Date(values.scheduled_at).toISOString()
          : undefined,
        execution_mode: values.execution_mode,
        type: values.type,
        requested_quantity: values.requested_quantity,
        sourceSiteId: values.source_site_id,
        source_site_id: values.source_site_id,
        transporter_org_id:
          values.execution_mode === 'EXTERNAL'
            ? values.transporter_org_id
            : null,
        vehicle_id:
          values.execution_mode === 'INTERNAL'
            ? values.vehicle_id
            : tour!.vehicle_id,
        driver_id:
          values.execution_mode === 'INTERNAL'
            ? values.driver_id
            : tour!.driver_id,
        livreur_user_id:
          values.execution_mode === 'INTERNAL'
            ? values.livreur_user_id
            : tour!.livreur_user_id,
        checkpoints,
      }

      await useToursStore.getState().updateTourAsync(tour!.id, patch)
      invalidateResource(queryClient, 'tours')
      toast.success('Tournée mise à jour avec succès')
      if (onSaved) onSaved()
      else navigate({ to: '/tour-tracking/$tourId', params: { tourId } })
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Impossible de mettre à jour la tournée'
      )
    } finally {
      setSubmitting(false)
      onBusyChange?.(false)
    }
  }

  return (
    <PageShell>
      <div className='flex items-center justify-between pb-2'>
        <div className='flex items-center gap-3'>
          <Button asChild variant='ghost' size='icon'>
            <Link to='/tour-tracking/$tourId' params={{ tourId }}>
              <ArrowLeft className='size-5' />
              <span className='sr-only'>Retour</span>
            </Link>
          </Button>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight'>
                Modifier la tournée {tour.tour_code ?? tour.id}
              </h1>
              <Badge className={STATUS_CLASS[tour.status]}>
                {tourStatusLabels[tour.status] ?? tour.status}
              </Badge>
            </div>
            <p className='text-sm text-muted-foreground'>
              Mise à jour des paramètres, étapes et affectation de la tournée.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Section 1: Informations Générales & Cargaison */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Truck className='size-5 text-primary' />
                <CardTitle>Cargaison & Mode d'exécution</CardTitle>
              </div>
              <CardDescription>
                Définissez le type de produit, la quantité globale et le mode
                d'acheminement.
              </CardDescription>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='scheduled_at'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Départ prévu</FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='execution_mode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode d'exécution</FormLabel>
                    <Select
                      disabled={submitting || tour.status !== 'DRAFT'}
                      onValueChange={(value) => { if (value) field.onChange(value) }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Sélectionner le mode' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='INTERNAL'>
                          Interne (Flotte propre)
                        </SelectItem>
                        <SelectItem value='EXTERNAL'>
                          Externalisée (Transporteur sous contrat)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchMode === 'EXTERNAL' && (
                <FormField
                  control={form.control}
                  name='transporter_org_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transporteur partenaire</FormLabel>
                      <Select
                        onValueChange={(value) => { if (value) field.onChange(value) }}
                        value={field.value ?? ''}
                        disabled={submitting || tour.status === 'ACKNOWLEDGED'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Sélectionner un transporteur' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {transporters.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de cargaison</FormLabel>
                    <Select onValueChange={(value) => { if (value) field.onChange(value) }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Sélectionner le type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='VRAC'>VRAC (GPL vrac)</SelectItem>
                        <SelectItem value='BOUTEILLES50KG'>
                          Bouteilles 50 kg
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='requested_quantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantité totale demandée ({unitLabel})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step={watchType === 'VRAC' ? '0.01' : '1'}
                        placeholder={
                          watchType === 'VRAC' ? 'ex: 20.5' : 'ex: 150'
                        }
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {watchType === 'VRAC'
                        ? 'Quantité exprimée en Tonnes Métriques (TM).'
                        : 'Nombre unitaire de bouteilles de 50 kg.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 2: Équipage (si INTERNAL) */}
          {watchMode === 'INTERNAL' ? (
            <Card>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <Users className='size-5 text-primary' />
                  <CardTitle>Équipage de la tournée (Interne)</CardTitle>
                </div>
                <CardDescription>
                  Affectez le véhicule, le chauffeur et le livreur de votre
                  organisation.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <FormField
                  control={form.control}
                  name='vehicle_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Camion / Véhicule</FormLabel>
                      <Select
                        onValueChange={(value) => { if (value) field.onChange(value) }}
                        value={field.value ?? ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Sélectionner un véhicule' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.license_plate} ({v.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='driver_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chauffeur</FormLabel>
                      <Select
                        onValueChange={(value) => { if (value) field.onChange(value) }}
                        value={field.value ?? ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Sélectionner un chauffeur' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDrivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.first_name} {d.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='livreur_user_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Livreur</FormLabel>
                      <Select
                        onValueChange={(value) => { if (value) field.onChange(value) }}
                        value={field.value ?? ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Sélectionner un livreur' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableLivreurs.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.first_name} {l.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className='border-dashed'>
              <CardContent className='flex items-center gap-3 pt-6 text-sm text-muted-foreground'>
                <Info className='size-5 text-indigo-500 shrink-0' />
                <p>
                  En mode <strong>Externalisé</strong>, l'équipage (véhicule,
                  chauffeur, livreur) sera affecté directement par le
                  transporteur sélectionné au moment d'accuser réception de la
                  tournée.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Section 3: Itinéraire & Étapes */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <div className='flex items-center gap-2'>
                  <MapPin className='size-5 text-primary' />
                  <CardTitle>Itinéraire & Points de passage</CardTitle>
                </div>
                <CardDescription>
                  Séquence 1 : Chargement au dépôt. Séquences suivantes : Arrêts
                  clients.
                </CardDescription>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  append({ client_site_id: '', expected_quantity: 0 })
                }
              >
                <Plus className='size-4 mr-1' />
                Ajouter un arrêt client
              </Button>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Séquence 1 : Dépôt Source */}
              <div className='p-4 border rounded-lg bg-muted/30 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    Étape 1 — Dépôt de départ (Chargement)
                  </span>
                  <Badge variant='outline'>
                    Quantité chargée : {watchQuantity || 0} {unitLabel}
                  </Badge>
                </div>
                <FormField
                  control={form.control}
                  name='source_site_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dépôt / Entrepôt de chargement</FormLabel>
                      <Select
                        onValueChange={(value) => { if (value) field.onChange(value) }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Sélectionner le site de départ' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rawSites.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Séquences 2..N : Arrêts clients */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    Arrêts clients ({fields.length})
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    Total arrêts :{' '}
                    <strong>
                      {totalStopsQuantity} {unitLabel}
                    </strong>{' '}
                    / {watchQuantity || 0} {unitLabel}
                  </span>
                </div>

                {fields.map((fieldItem, index) => (
                  <div
                    key={fieldItem.id}
                    className='flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg'
                  >
                    <div className='flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0'>
                      {index + 2}
                    </div>

                    <div className='flex-1 w-full'>
                      <FormField
                        control={form.control}
                        name={`client_stops.${index}.client_site_id`}
                        render={({ field }) => (
                          <FormItem className='space-y-1'>
                            <FormLabel className='text-xs text-muted-foreground'>
                              Site de livraison client
                            </FormLabel>
                            <Select
                              onValueChange={(value) => { if (value) field.onChange(value) }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Sélectionner un site client' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {rawClientSites.map((cs) => (
                                  <SelectItem key={cs.id} value={cs.id}>
                                    {cs.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='w-full sm:w-44'>
                      <FormField
                        control={form.control}
                        name={`client_stops.${index}.expected_quantity`}
                        render={({ field }) => (
                          <FormItem className='space-y-1'>
                            <FormLabel className='text-xs text-muted-foreground'>
                              Quantité ({unitLabel})
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                step={watchType === 'VRAC' ? '0.01' : '1'}
                                placeholder='Quantité'
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ''
                                      ? 0
                                      : Number(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => remove(index)}
                        className='text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center mt-2 sm:mt-5'
                      >
                        <Trash2 className='size-4' />
                        <span className='sr-only'>Supprimer l'arrêt</span>
                      </Button>
                    )}
                  </div>
                ))}

                {Math.abs(totalStopsQuantity - (watchQuantity || 0)) >
                  0.001 && (
                  <p className='text-xs text-amber-600 dark:text-amber-400'>
                    Attention : la somme des livraisons prévues (
                    {totalStopsQuantity} {unitLabel}) n'est pas égale à la
                    quantité demandée ({watchQuantity || 0} {unitLabel}).
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Itinéraire prévu</CardTitle>
              <CardDescription>
                Le tracé s’actualise selon le dépôt et l’ordre des livraisons.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewTrip ? (
                <Suspense
                  fallback={<p role='status'>Chargement de la carte…</p>}
                >
                  <TourCorridorMap
                    trip={previewTrip}
                    preview
                    formatDateTime={(date) =>
                      date ? new Date(date).toLocaleString('fr-FR') : '—'
                    }
                  />
                </Suspense>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  Sélectionnez le dépôt et des sites de livraison disposant de
                  coordonnées GPS.
                </p>
              )}
            </CardContent>
          </Card>
          {/* Actions de soumission */}
          <div className='flex items-center justify-end gap-3 pt-4 border-t'>
            <Button asChild variant='outline'>
              <Link to='/tour-tracking/$tourId' params={{ tourId }}>
                Annuler
              </Link>
            </Button>
            <Button type='submit' disabled={submitting || !formInitialized}>
              {submitting && <Loader2 className='size-4 mr-2 animate-spin' />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Form>
    </PageShell>
  )
}
