import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Truck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
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
import { curated, organizations, sites } from '@lpg/mock-data'
import { useAuthStore } from '@/store/auth-store'
import { usePickupsStore } from '@/store/pickups-store'
import { getScope } from '@/features/scope/scope'
import { isSupplyOrigin } from '@/features/sites/lib/site-functions'
import { PERMISSION_DENIED } from '@/lib/security/guards'
import type { PickupRequest, VehicleType } from '@lpg/types'
import { recommendVehicles, type VehicleRecommendation } from '../lib/vehicle-recommendation'
import { pickupWizardSchema, type PickupWizardValues } from '../lib/pickup-wizard-schema'

const MARKET_EUR_ORGS = organizations.filter((o) => o.type === 'MARKETEUR' && o.is_active)

function defaultMarketeurOrg(): string {
  const authOrg = useAuthStore.getState().user?.org_id
  if (authOrg && MARKET_EUR_ORGS.some((o) => o.id === authOrg)) return authOrg
  return MARKET_EUR_ORGS[0]?.id ?? ''
}

const TYPE_LABELS: Record<VehicleType, string> = {
  VRAC: 'GPL vrac (TM)',
  BOUTEILLES50KG: 'Bouteilles 50 kg (btl)',
}

const DEFAULT_VALUES: PickupWizardValues = {
  marketeur_org_id: '',
  source_site_id: '',
  destination_site_id: '',
  requested_quantity: 0,
  type: 'VRAC',
}

function defaultValues(): PickupWizardValues {
  const values = { ...DEFAULT_VALUES, marketeur_org_id: defaultMarketeurOrg() }
  const scope = getScope(useAuthStore.getState().user)
  if (scope.view !== 'org' && scope.siteIds.length > 0) {
    // Enlèvement origin must be a supply point / filling centre. Prefer a site
    // of that function within the actor's scope; fall back to any active site.
    const supplyOrigin = sites.find(
      (s) => scope.siteIds.includes(s.id) && s.is_active !== false && isSupplyOrigin(s),
    )
    const firstSite = supplyOrigin ?? sites.find((s) => s.id === scope.siteIds[0] && s.is_active !== false)
    if (firstSite) values.source_site_id = firstSite.id
  }
  return values
}

export function PickupsCreateWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (pickup: PickupRequest, vehicleIds: string[]) => void
}) {
  const form = useForm<PickupWizardValues>({
    resolver: zodResolver(pickupWizardSchema),
    defaultValues: defaultValues(),
  })
  const [step, setStep] = useState(1)
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const sourceSiteId = form.watch('source_site_id')
  const type = form.watch('type')
  const requestedQuantity = form.watch('requested_quantity')
  const marketeurOrgId = form.watch('marketeur_org_id')

  const scope = useMemo(() => getScope(useAuthStore.getState().user), [])
  const canChooseOrg = scope.view === 'org'

  const marketeurOptions = useMemo(() => {
    if (canChooseOrg) return MARKET_EUR_ORGS
    return MARKET_EUR_ORGS.filter((o) => o.id === scope.orgId)
  }, [canChooseOrg, scope.orgId])

  const sourceOptions = useMemo(() => {
    const active = sites.filter((s) => s.is_active !== false)
    if (canChooseOrg) return active.filter(isSupplyOrigin)
    const siteIds = new Set(scope.siteIds)
    return active.filter((s) => siteIds.has(s.id) && isSupplyOrigin(s))
  }, [canChooseOrg, scope.siteIds])
  const destOptions = useMemo(
    () => sites.filter((s) => s.is_active !== false && s.id !== sourceSiteId),
    [sourceSiteId],
  )

  const recommendations = useMemo<VehicleRecommendation[]>(() => {
    if (step !== 2 || requestedQuantity <= 0) return []
    return recommendVehicles({
      quantity: requestedQuantity,
      type,
      org_id: marketeurOrgId,
      vehicles: curated.vehicles,
    })
  }, [step, requestedQuantity, type, marketeurOrgId])

  function toggleVehicle(id: string) {
    setSelectedVehicles((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    )
  }

  async function submit() {
    if (step === 1) {
      const valid = await form.trigger()
      if (!valid) return
      setStep(2)
      return
    }
    setSubmitting(true)
    try {
      const data = form.getValues()
      const created = usePickupsStore.getState().createPickup({
        marketeur_org_id: data.marketeur_org_id,
        source_site_id: data.source_site_id,
        destination_site_id: data.destination_site_id,
        requested_quantity: data.requested_quantity,
      })
      onCreated(created, selectedVehicles)
      toast.success(
        `Requête ${created.id} créée en brouillon` +
          (selectedVehicles.length > 0
            ? ` — ${selectedVehicles.length} véhicule(s) assigné(s)`
            : ''),
      )
      onOpenChange(false)
      reset()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de créer la requête'
      toast.error(message === PERMISSION_DENIED ? 'Accès refusé pour ce site.' : message)
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep(1)
    form.reset(defaultValues())
    setSelectedVehicles([])
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false) }}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Nouvelle requête de ramassage' : 'Sélection des véhicules'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <Form {...form}>
            <div className='space-y-4 py-2'>
              <div className='flex gap-3'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Type de cargaison</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v as VehicleType)}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='requested_quantity'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Quantité</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          step={type === 'VRAC' ? 0.5 : 1}
                          value={field.value === 0 ? '' : field.value}
                          placeholder={type === 'VRAC' ? 'TM' : 'btl'}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='marketeur_org_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marketeur</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange} disabled={!canChooseOrg}>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {marketeurOptions.map((o) => (
                            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='source_site_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site source</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || undefined}
                        disabled={!canChooseOrg}
                        onValueChange={(v) => {
                          field.onChange(v)
                          form.setValue('destination_site_id', '')
                        }}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='— Sélectionner —' />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceOptions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='destination_site_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site destination</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='— Sélectionner —' />
                        </SelectTrigger>
                        <SelectContent>
                          {destOptions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        ) : (
          <div className='space-y-4 py-2'>
            <p className='text-sm text-muted-foreground'>
              Véhicules <strong>{TYPE_LABELS[type]}</strong> du marketeur capables de
              transporter <strong>{requestedQuantity}</strong>{' '}
              {type === 'VRAC' ? 'TM' : 'btl'}.
            </p>

            {recommendations.length === 0 ? (
              <div className='rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'>
                Aucun véhicule de capacité suffisante trouvé pour cette quantité.
              </div>
            ) : (
              <ul className='space-y-2'>
                {recommendations.map(({ vehicle, fitRatio, spareCapacity }) => (
                  <li key={vehicle.id}>
                    <button
                      type='button'
                      onClick={() => toggleVehicle(vehicle.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left text-sm transition-colors ${
                        selectedVehicles.includes(vehicle.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <span className='flex items-center gap-2 font-medium'>
                        <Truck className='size-4 text-primary' />
                        {vehicle.license_plate}
                      </span>
                      <span className='flex items-center gap-3 text-xs text-muted-foreground'>
                        <span>
                          Capacité {type === 'VRAC'
                            ? `${vehicle.max_volume} TM`
                            : `${vehicle.max_bottle_count} btl`}
                        </span>
                        <span>Reste {type === 'VRAC' ? `${spareCapacity} TM` : `${spareCapacity} btl`}</span>
                        <span>{Math.round(fitRatio * 100)}%</span>
                        <span
                          className={`flex size-5 items-center justify-center rounded-full border ${
                            selectedVehicles.includes(vehicle.id)
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {selectedVehicles.includes(vehicle.id) && <Check className='size-3.5' />}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            {step === 2 && (
              <Button variant='ghost' onClick={() => setStep(1)} className='gap-1'>
                <ArrowLeft className='size-4' /> Retour
              </Button>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>Annuler</Button>
            {step === 1 ? (
              <Button onClick={submit} className='gap-1'>
                Suivant <ArrowRight className='size-4' />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting || selectedVehicles.length === 0} className='gap-1'>
                Créer la requête
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
