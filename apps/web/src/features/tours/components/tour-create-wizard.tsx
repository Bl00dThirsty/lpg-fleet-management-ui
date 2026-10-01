import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Plus,
  Trash2,
  Truck,
  Users,
} from 'lucide-react'
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Badge,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lpg/ui'
import {
  client_sites,
  drivers,
  organizations,
  sites,
  users,
  vehicles,
} from '@lpg/mock-data'
import type { ExecutionMode, TourneeType } from '@lpg/types'
import { getScope } from '@/features/scope/scope'
import { contractsEligibleForExternal } from '@/features/transporter-contracts/lib/contract-status'
import { useAuthStore } from '@/store/auth-store'
import { useContractsStore } from '@/store/contracts-store'
import { useToursStore } from '@/store/tours-store'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import type { TourActivity } from '../data/tour-activity'
import {
  step1Schema,
  step2Schema,
  step3Schema,
  tourCreateSchema,
  type CheckpointRowValue,
  type TourDraftValues,
} from './tour-create-schema'

const STEP_LABELS = [
  'Type & quantité',
  'Équipage / transporteur',
  'Points de livraison',
  'Récapitulatif',
]

const EXECUTION_MODE_OPTIONS: { value: ExecutionMode; label: string; hint: string }[] = [
  { value: 'INTERNAL', label: 'Interne', hint: 'Votre équipe et vos véhicules' },
  { value: 'EXTERNAL', label: 'Externalisée', hint: 'Transporteur avec contrat actif' },
]

const TYPE_OPTIONS: { value: TourneeType; label: string; unit: string }[] = [
  { value: 'VRAC', label: 'GPL vrac', unit: 'TM' },
  { value: 'BOUTEILLES50KG', label: 'Bouteilles 50 kg', unit: 'btl' },
]

const STEP1_FIELDS: FieldPath<TourDraftValues>[] = [
  'marketeur_org_id',
  'sourceSiteId',
  'execution_mode',
  'type',
  'requested_quantity',
]

const STEP2_FIELDS: FieldPath<TourDraftValues>[] = [
  'execution_mode',
  'transporter_org_id',
  'vehicle_id',
  'driver_id',
  'livreur_user_id',
]

const STEP3_FIELDS: FieldPath<TourDraftValues>[] = ['sourceSiteId', 'checkpoints']

const MARKET_EUR_ORGS = organizations.filter((o) => o.type === 'MARKETEUR' && o.is_active)

function marketeurSites(orgId: string) {
  return sites.filter((s) => s.org_id === orgId && s.is_active)
}

function defaultMarketeurOrg(): string {
  const user = useAuthStore.getState().user
  if (user?.org_id && MARKET_EUR_ORGS.some((o) => o.id === user.org_id)) return user.org_id
  return MARKET_EUR_ORGS[0]?.id ?? ''
}

function defaultSourceSiteId(orgId: string): string {
  return marketeurSites(orgId)[0]?.id ?? ''
}

function buildDefaults(): TourDraftValues {
  const marketeurOrgId = defaultMarketeurOrg()
  return {
    marketeur_org_id: marketeurOrgId,
    sourceSiteId: defaultSourceSiteId(marketeurOrgId),
    execution_mode: 'INTERNAL',
    type: 'VRAC',
    requested_quantity: 0,
    transporter_org_id: '',
    vehicle_id: '',
    driver_id: '',
    livreur_user_id: '',
    checkpoints: [{ site_id: '', client_site_id: '', sequence: 1, expected_quantity: 0 }],
  }
}

function siteName(id?: string): string {
  if (!id) return '—'
  return sites.find((s) => s.id === id)?.name ?? id
}

function checkpointDestName(row: CheckpointRowValue): string {
  if (row.site_id) return siteName(row.site_id)
  if (row.client_site_id) {
    return client_sites.find((c) => c.id === row.client_site_id)?.name ?? row.client_site_id
  }
  return '—'
}

function vehicleLabel(id?: string): string {
  return vehicles.find((v) => v.id === id)?.license_plate ?? '—'
}

function personLabel(id?: string): string {
  const person = users.find((u) => u.id === id)
  return person ? `${person.first_name} ${person.last_name}`.trim() : '—'
}

function driverLabel(id?: string): string {
  const driver = drivers.find((d) => d.id === id)
  return driver ? `${driver.first_name} ${driver.last_name}`.trim() : '—'
}

function transporterLabel(id?: string): string {
  return organizations.find((o) => o.id === id)?.name ?? '—'
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='text-right font-medium'>{value}</dd>
    </div>
  )
}

export function TourCreateWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (tour: TourActivity) => void
}) {
  const [step, setStep] = useState(1)
  const [rowKinds, setRowKinds] = useState<('site' | 'client_site')[]>(['client_site'])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<TourDraftValues>({
    resolver: zodResolver(tourCreateSchema),
    defaultValues: buildDefaults(),
  })

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'checkpoints',
  })

  const marketeurOrgId = form.watch('marketeur_org_id')
  const sourceSiteId = form.watch('sourceSiteId')
  const executionMode = form.watch('execution_mode')
  const tourneeType = form.watch('type')
  const contracts = useContractsStore((state) => state.contracts)

  useEffect(() => {
    if (!open) return
    form.reset(buildDefaults())
    setStep(1)
    setRowKinds(['client_site'])
    setSubmitting(false)
    setSubmitError(null)
  }, [open, form])

  const org = useMemo(
    () => organizations.find((o) => o.id === marketeurOrgId),
    [marketeurOrgId],
  )

  const sourceSites = useMemo(() => marketeurSites(marketeurOrgId), [marketeurOrgId])

  const checkpointSiteOptions = useMemo(
    () => marketeurSites(marketeurOrgId).filter((s) => s.id !== sourceSiteId),
    [marketeurOrgId, sourceSiteId],
  )

  const clientSiteOptions = useMemo(
    () =>
      client_sites.filter((cs) => cs.current_marketeur_org_id === marketeurOrgId && cs.is_active),
    [marketeurOrgId],
  )

  const vehicleOptions = useMemo(
    () => vehicles.filter((v) => v.org_id === marketeurOrgId && v.is_active),
    [marketeurOrgId],
  )

  const driverOptions = useMemo(
    () => drivers.filter((d) => d.org_id === marketeurOrgId && d.is_active),
    [marketeurOrgId],
  )

  const livreurOptions = useMemo(
    () =>
      users.filter(
        (u) => u.system_role === 'LIVREUR' && u.org_id === marketeurOrgId && u.is_active,
      ),
    [marketeurOrgId],
  )

  const transporterOptions = useMemo(() => {
    const eligibleIds = new Set(
      contractsEligibleForExternal(useContractsStore.getState().all(), marketeurOrgId),
    )
    const seen = new Set<string>()
    const options: { orgId: string; reference?: string }[] = []
    for (const contract of contracts) {
      if (contract.marketeur_org_id !== marketeurOrgId || !eligibleIds.has(contract.id)) continue
      if (seen.has(contract.transporter_org_id)) continue
      seen.add(contract.transporter_org_id)
      options.push({ orgId: contract.transporter_org_id, reference: contract.contract_reference })
    }
    return options
  }, [contracts, marketeurOrgId])

  const scopeView = useMemo(() => getScope(useAuthStore.getState().user).view, [])
  const canChooseOrg = scopeView === 'org'

  function handleExecutionModeChange(mode: ExecutionMode) {
    form.setValue('execution_mode', mode)
    // Switching INTERNAL ↔ EXTERNAL invalidates the crew picked for the other
    // mode; clear it so a stale vehicle/driver/livreur is never submitted.
    form.setValue('vehicle_id', undefined)
    form.setValue('driver_id', undefined)
    form.setValue('livreur_user_id', undefined)
  }

  function applyStepSchema(
    schema: typeof step1Schema | typeof step2Schema | typeof step3Schema,
    fields: FieldPath<TourDraftValues>[],
  ): boolean {
    form.clearErrors(fields)
    const parsed = schema.safeParse(form.getValues())
    if (parsed.success) return true
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!path) continue
      form.setError(path as FieldPath<TourDraftValues>, { type: 'custom', message: issue.message })
    }
    return false
  }

  function nextStep() {
    if (step === 1) {
      if (!applyStepSchema(step1Schema, STEP1_FIELDS)) return
    } else if (step === 2) {
      if (!applyStepSchema(step2Schema, STEP2_FIELDS)) return
    } else if (step === 3) {
      if (!applyStepSchema(step3Schema, STEP3_FIELDS)) return
    }
    setStep(step + 1)
  }

  function submit(values: TourDraftValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const created = useToursStore.getState().createTour({
        marketeur_org_id: values.marketeur_org_id,
        execution_mode: values.execution_mode,
        type: values.type,
        requested_quantity: values.requested_quantity,
        sourceSiteId: values.sourceSiteId,
        transporter_org_id: values.transporter_org_id || null,
        vehicle_id: values.vehicle_id || null,
        driver_id: values.driver_id || null,
        livreur_user_id: values.livreur_user_id || null,
        checkpoints: values.checkpoints.map((checkpoint, index) => ({
          ...checkpoint,
          sequence: index + 1,
        })),
      })
      toast.success(`Tournée ${created.reference ?? created.id} créée`)
      onCreated(created)
      onOpenChange(false)
      form.reset(buildDefaults())
      setStep(1)
    } catch (err) {
      const message = extractErrorMessage(err)
      setSubmitError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function setKind(index: number, kind: 'site' | 'client_site') {
    const current = fields[index]
    if (!current) return
    if (kind === 'site') {
      update(index, { ...current, client_site_id: '' })
    } else {
      update(index, { ...current, site_id: '' })
    }
    setRowKinds((kinds) => kinds.map((value, i) => (i === index ? kind : value)))
  }

  function addCheckpoint() {
    append({ site_id: '', client_site_id: '', sequence: fields.length + 1, expected_quantity: 0 })
    setRowKinds((kinds) => [...kinds, 'client_site'])
  }

  function removeCheckpoint(index: number) {
    remove(index)
    const next = form
      .getValues('checkpoints')
      .map((checkpoint, i) => ({ ...checkpoint, sequence: i + 1 }))
    form.setValue('checkpoints', next, { shouldDirty: true })
    setRowKinds((kinds) => kinds.filter((_, i) => i !== index))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false)
      }}
    >
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Nouvelle tournée de livraison</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
              {STEP_LABELS.map((label, index) => {
                const number = index + 1
                const active = number === step
                const done = number < step
                return (
                  <div key={label} className='flex items-center gap-1.5'>
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {done ? <Check className='size-3.5' /> : number}
                    </span>
                    <span
                      className={cn(
                        'text-xs',
                        active ? 'font-medium text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>

            {step === 1 && (
              <div className='max-h-[60vh] space-y-4 overflow-y-auto pr-1'>
                <FormField
                  control={form.control}
                  name='execution_mode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode d'exécution</FormLabel>
                      <div className='grid grid-cols-2 gap-3'>
                        {EXECUTION_MODE_OPTIONS.map((option) => {
                          const active = field.value === option.value
                          return (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() => handleExecutionModeChange(option.value)}
                              className={cn(
                                'rounded-lg border p-3 text-left transition-colors',
                                active
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:bg-muted/40',
                              )}
                            >
                              <span className='block text-sm font-medium'>{option.label}</span>
                              <span className='mt-0.5 block text-xs text-muted-foreground'>
                                {option.hint}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de cargaison</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as TourneeType)}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Choisir…' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label} ({option.unit})
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
                  name='requested_quantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité demandée</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type='number'
                            min={0}
                            step={tourneeType === 'VRAC' ? 0.5 : 1}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                            }
                            className='pr-16'
                          />
                          <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground'>
                            {tourneeType === 'VRAC' ? 'TM' : 'btl'}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='marketeur_org_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketeur</FormLabel>
                      <Select
                        value={field.value}
                        disabled={!canChooseOrg}
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('sourceSiteId', defaultSourceSiteId(value))
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MARKET_EUR_ORGS.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.name}
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
                  name='sourceSiteId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site source (chargement)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='— Sélectionner —' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sourceSites.map((site) => (
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
            )}

            {step === 2 && (
              <div className='max-h-[60vh] space-y-4 overflow-y-auto pr-1'>
                {executionMode === 'INTERNAL' ? (
                  <>
                    <p className='text-sm text-muted-foreground'>
                      Affectez l'équipage du marketeur {org ? `— ${org.name}` : ''}.
                    </p>
                    <FormField
                      control={form.control}
                      name='vehicle_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Véhicule</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='— Sélectionner —' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicleOptions.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.license_plate}
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='— Sélectionner —' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {driverOptions.map((driver) => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {`${driver.first_name} ${driver.last_name}`.trim()}
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='— Sélectionner —' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {livreurOptions.map((livreur) => (
                                <SelectItem key={livreur.id} value={livreur.id}>
                                  {`${livreur.first_name} ${livreur.last_name}`.trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <p className='text-sm text-muted-foreground'>
                      Sélectionnez un transporteur sous contrat actif avec le marketeur
                      {org ? ` ${org.name}` : ''}.
                    </p>
                    <FormField
                      control={form.control}
                      name='transporter_org_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transporteur</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='— Sélectionner —' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {transporterOptions.map((option) => (
                                <SelectItem key={option.orgId} value={option.orgId}>
                                  {transporterLabel(option.orgId)}
                                  {option.reference ? ` (${option.reference})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className='max-h-[60vh] space-y-3 overflow-y-auto pr-1'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm text-muted-foreground'>
                    Étapes du parcours — la première au départ de{' '}
                    <span className='font-medium text-foreground'>{siteName(sourceSiteId)}</span>.
                  </p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addCheckpoint}
                    className='gap-1'
                  >
                    <Plus className='size-3.5' /> Ajouter
                  </Button>
                </div>

                {fields.length === 0 && (
                  <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
                    Aucun point de livraison — ajoutez-en au moins un.
                  </p>
                )}

                {fields.map((row, index) => {
                  const kind = rowKinds[index] ?? 'client_site'
                  return (
                    <div key={row.id} className='space-y-3 rounded-lg border p-3'>
                      <div className='flex items-center justify-between'>
                        <Badge variant='outline'>Étape {index + 1}</Badge>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeCheckpoint(index)}
                          className='text-destructive'
                          aria-label={`Supprimer le point ${index + 1}`}
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>

                      <div className='grid grid-cols-2 gap-2'>
                        <button
                          type='button'
                          onClick={() => setKind(index, 'site')}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
                            kind === 'site'
                              ? 'border-primary bg-primary/5 font-medium text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted/40',
                          )}
                        >
                          <MapPin className='size-3.5' /> Site
                        </button>
                        <button
                          type='button'
                          onClick={() => setKind(index, 'client_site')}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
                            kind === 'client_site'
                              ? 'border-primary bg-primary/5 font-medium text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted/40',
                          )}
                        >
                          <MapPin className='size-3.5' /> Site client
                        </button>
                      </div>

                      {kind === 'site' ? (
                        <FormField
                          control={form.control}
                          name={`checkpoints.${index}.site_id` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site de livraison</FormLabel>
                              <Select value={field.value || ''} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className='w-full'>
                                    <SelectValue placeholder='— Sélectionner —' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {checkpointSiteOptions.map((site) => (
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
                      ) : (
                        <FormField
                          control={form.control}
                          name={`checkpoints.${index}.client_site_id` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site client</FormLabel>
                              <Select value={field.value || ''} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className='w-full'>
                                    <SelectValue placeholder='— Sélectionner —' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {clientSiteOptions.map((clientSite) => (
                                    <SelectItem key={clientSite.id} value={clientSite.id}>
                                      {clientSite.name}
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
                        name={`checkpoints.${index}.expected_quantity` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantité attendue</FormLabel>
                            <FormControl>
                              <div className='relative'>
                                <Input
                                  type='number'
                                  min={0}
                                  step={tourneeType === 'VRAC' ? 0.5 : 1}
                                  value={field.value || ''}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === '' ? 0 : Number(e.target.value),
                                    )
                                  }
                                  className='pr-16'
                                />
                                <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground'>
                                  {tourneeType === 'VRAC' ? 'TM' : 'btl'}
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )
                })}

                {form.formState.errors.checkpoints?.message && (
                  <p className='text-sm text-red-600 dark:text-red-400'>
                    {form.formState.errors.checkpoints.message}
                  </p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className='max-h-[60vh] space-y-4 overflow-y-auto pr-1'>
                <dl className='space-y-2 rounded-lg border p-4 text-sm'>
                  <ReviewRow label='Marketeur' value={org?.name ?? marketeurOrgId} />
                  <ReviewRow label='Site source' value={siteName(sourceSiteId)} />
                  <ReviewRow
                    label='Mode'
                    value={
                      EXECUTION_MODE_OPTIONS.find((o) => o.value === executionMode)?.label ??
                      executionMode
                    }
                  />
                  <ReviewRow
                    label='Cargaison'
                    value={`${
                      TYPE_OPTIONS.find((o) => o.value === tourneeType)?.label ?? tourneeType
                    } — ${form.watch('requested_quantity') || 0} ${tourneeType === 'VRAC' ? 'TM' : 'btl'}`}
                  />
                  {executionMode === 'INTERNAL' ? (
                    <>
                      <ReviewRow
                        label='Véhicule'
                        value={vehicleLabel(form.watch('vehicle_id'))}
                      />
                      <ReviewRow label='Chauffeur' value={driverLabel(form.watch('driver_id'))} />
                      <ReviewRow
                        label='Livreur'
                        value={personLabel(form.watch('livreur_user_id'))}
                      />
                    </>
                  ) : (
                    <ReviewRow
                      label='Transporteur'
                      value={transporterLabel(form.watch('transporter_org_id'))}
                    />
                  )}
                </dl>

                <div>
                  <p className='mb-2 text-sm font-medium'>
                    Points de livraison ({fields.length})
                  </p>
                  <ol className='space-y-1.5'>
                    {fields.map((row, index) => (
                      <li
                        key={row.id}
                        className='flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm'
                      >
                        <span className='flex items-center gap-2'>
                          <Badge variant='outline'>{index + 1}</Badge>
                          <span>{checkpointDestName(row)}</span>
                        </span>
                        <span className='flex items-center gap-1 text-muted-foreground'>
                          <Truck className='size-3.5' />
                          {row.expected_quantity} {tourneeType === 'VRAC' ? 'TM' : 'btl'}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className='flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-muted-foreground'>
                  <Users className='mt-0.5 size-4 shrink-0 text-primary' />
                  <span>
                    {executionMode === 'INTERNAL'
                      ? 'La tournée sera créée en statut Planifiée.'
                      : 'La tournée sera envoyée au transporteur pour accusé de réception.'}
                  </span>
                </div>

                {submitError && (
                  <p className='text-sm text-red-600 dark:text-red-400'>{submitError}</p>
                )}
              </div>
            )}

            <DialogFooter className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                {step > 1 && (
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setStep(step - 1)}
                    className='gap-1'
                  >
                    <ArrowLeft className='size-4' /> Retour
                  </Button>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                {step < 4 ? (
                  <Button type='button' onClick={nextStep} className='gap-1'>
                    Suivant <ArrowRight className='size-4' />
                  </Button>
                ) : (
                  <Button type='submit' disabled={submitting} className='gap-1'>
                    {submitting ? 'Création…' : 'Créer la tournée'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
