import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@lpg/ui'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { invalidateResource } from '@/lib/api/invalidation'
import { getPickupOptions } from '../data/pickups'
import {
  pickupWizardSchema,
  type PickupWizardValues,
} from '../lib/pickup-wizard-schema'

const steps = [
  'Dépôt et destination',
  'Chargement et équipage',
  'Récapitulatif',
]
export function PickupsCreateWizard({
  open,
  onOpenChange,
  onCreated,
  editTourId,
  fullPage = false,
}: {
  fullPage?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  editTourId?: string
  onCreated: (id: string) => void
}) {
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState(0)
  const qc = useQueryClient()
  const options = useQuery({
    queryKey: ['pickups', 'options', user?.id],
    queryFn: getPickupOptions,
    enabled: open,
  })
  const form = useForm<PickupWizardValues>({
    resolver: zodResolver(pickupWizardSchema),
    defaultValues: {
      marketeur_org_id:
        user?.system_role === 'MARKETEUR' ? (user.org_id ?? '') : '',
      source_site_id: '',
      destination_site_id: '',
      scheduled_at: '',
      type: 'VRAC',
      requested_quantity: 0,
      vehicle_id: '',
      driver_id: '',
      livreur_user_id: '',
    },
  })
  const values = form.watch()
  const data = options.data
  useEffect(() => {
    if (open) {
      const tour = useToursStore
        .getState()
        .tours.find((t) => t.id === editTourId)
      if (tour) {
        const date = tour.scheduled_at ? new Date(tour.scheduled_at) : null
        const localDate =
          date && !Number.isNaN(date.getTime())
            ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)
            : ''
        form.reset({
          marketeur_org_id: tour.marketeur_org_id,
          source_site_id: tour.source_site_id ?? '',
          destination_site_id: tour.destination_site_id ?? '',
          scheduled_at: localDate,
          type: tour.type,
          requested_quantity: tour.requested_quantity,
          vehicle_id: tour.vehicle_id ?? '',
          driver_id: tour.driver_id ?? '',
          livreur_user_id: tour.livreur_user_id ?? '',
        })
      } else form.reset()
      setStep(0)
    }
  }, [open, form, editTourId])
  const destinations =
    data?.destinations.filter(
      (s) =>
        s.org_id === values.marketeur_org_id &&
        (!user?.site_ids?.length || user.site_ids.includes(s.id))
    ) ?? []
  const vehicles =
    data?.vehicles.filter(
      (v) => v.org_id === values.marketeur_org_id && v.type === values.type
    ) ?? []
  const drivers =
    data?.drivers.filter((v) => v.org_id === values.marketeur_org_id) ?? []
  const users =
    data?.users.filter((v) => v.org_id === values.marketeur_org_id) ?? []
  const name = (id: string, list: { id: string; name: string }[] = []) =>
    list.find((v) => v.id === id)?.name ?? '—'
  function select(
    field:
      | 'marketeur_org_id'
      | 'source_site_id'
      | 'destination_site_id'
      | 'vehicle_id'
      | 'driver_id'
      | 'livreur_user_id'
      | 'type',
    label: string,
    rows: { id: string; name: string }[]
  ) {
    return (
      <FormField
        key={field}
        control={form.control}
        name={field}
        render={({ field: input }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <select
                {...input}
                className='h-10 w-full rounded-md border bg-background px-3 text-sm'
                disabled={form.formState.isSubmitting}
                onChange={(e) => {
                  input.onChange(e)
                  if (field === 'marketeur_org_id') {
                    form.setValue('destination_site_id', '')
                    form.setValue('vehicle_id', '')
                    form.setValue('driver_id', '')
                    form.setValue('livreur_user_id', '')
                  }
                  if (field === 'type') form.setValue('vehicle_id', '')
                }}
              >
                <option value=''>Sélectionner…</option>
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }
  async function next() {
    const valid = await form.trigger(
      step === 0
        ? [
            'marketeur_org_id',
            'source_site_id',
            'destination_site_id',
            'scheduled_at',
          ]
        : [
            'type',
            'requested_quantity',
            'vehicle_id',
            'driver_id',
            'livreur_user_id',
          ]
    )
    if (valid) setStep((s) => s + 1)
  }
  async function submit(value: PickupWizardValues) {
    const validSelections =
      destinations.some((s) => s.id === value.destination_site_id) &&
      vehicles.some((s) => s.id === value.vehicle_id) &&
      drivers.some((s) => s.id === value.driver_id) &&
      users.some((s) => s.id === value.livreur_user_id)
    if (!validSelections) {
      form.setError('root', {
        message:
          'Vérifiez la destination et l’équipage du marketeur sélectionné.',
      })
      return
    }
    try {
      const draft = {
        ...value,
        scheduled_at: new Date(value.scheduled_at).toISOString(),
      }
      const saved = editTourId
        ? await useToursStore.getState().updatePickupAsync(editTourId, draft)
        : await useToursStore.getState().createPickupAsync(draft)
      invalidateResource(qc, 'pickups')
      invalidateResource(qc, 'tours')
      toast.success(
        editTourId
          ? 'Enlèvement modifié'
          : 'Enlèvement planifié et transmis au livreur'
      )
      onOpenChange(false)
      onCreated(saved.id)
    } catch (error) {
      toast.error(extractErrorMessage(error))
    }
  }
  const content = (
    <>
      <ol className='flex gap-2 text-xs'>
        {steps.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-md p-3 ${i === step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      {options.isPending ? (
        <p role='status'>Chargement des dépôts et de l’équipage…</p>
      ) : options.isError ? (
        <div role='alert'>
          <p>Référentiel indisponible.</p>
          <Button onClick={() => options.refetch()}>Réessayer</Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
            {step === 0 && (
              <div className='grid gap-4 sm:grid-cols-2'>
                {user?.system_role !== 'MARKETEUR' &&
                  select(
                    'marketeur_org_id',
                    'Marketeur',
                    data?.organizations ?? []
                  )}
                {select(
                  'source_site_id',
                  'Dépôt d’enlèvement',
                  data?.sources ?? []
                )}
                {select(
                  'destination_site_id',
                  'Site destinataire',
                  destinations
                )}
                <FormField
                  control={form.control}
                  name='scheduled_at'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date et heure prévues</FormLabel>
                      <FormControl>
                        <Input type='datetime-local' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {step === 1 && (
              <div className='grid gap-4 sm:grid-cols-2'>
                {select('type', 'Produit', [
                  { id: 'VRAC', name: 'GPL vrac (TM)' },
                  { id: 'BOUTEILLES50KG', name: 'Bouteilles 50 kg (btl)' },
                ])}
                <FormField
                  control={form.control}
                  name='requested_quantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Quantité ({values.type === 'VRAC' ? 'TM' : 'btl'})
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step={values.type === 'VRAC' ? 'any' : '1'}
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === '' ? 0 : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {select(
                  'vehicle_id',
                  'Véhicule',
                  vehicles.map((v) => ({ id: v.id, name: v.license_plate }))
                )}
                {select(
                  'driver_id',
                  'Chauffeur',
                  drivers.map((v) => ({
                    id: v.id,
                    name: `${v.first_name} ${v.last_name}`,
                  }))
                )}
                {select(
                  'livreur_user_id',
                  'Livreur',
                  users.map((v) => ({
                    id: v.id,
                    name: `${v.first_name} ${v.last_name}`,
                  }))
                )}
              </div>
            )}
            {step === 2 && (
              <div className='space-y-3 rounded-lg border p-4 text-sm'>
                <p className='font-semibold'>
                  {name(values.source_site_id, data?.sources)} →{' '}
                  {name(values.destination_site_id, destinations)}
                </p>
                <p>
                  {new Date(values.scheduled_at).toLocaleString('fr-FR')} ·{' '}
                  {values.requested_quantity}{' '}
                  {values.type === 'VRAC' ? 'TM' : 'btl'}
                </p>
                <p>
                  Véhicule :{' '}
                  {
                    vehicles.find((v) => v.id === values.vehicle_id)
                      ?.license_plate
                  }
                </p>
                <p>
                  Chauffeur :{' '}
                  {drivers.find((v) => v.id === values.driver_id)?.first_name}{' '}
                  {drivers.find((v) => v.id === values.driver_id)?.last_name}
                </p>
                <p>
                  Livreur :{' '}
                  {
                    users.find((v) => v.id === values.livreur_user_id)
                      ?.first_name
                  }{' '}
                  {
                    users.find((v) => v.id === values.livreur_user_id)
                      ?.last_name
                  }
                </p>
                <p className='text-muted-foreground'>
                  Le livreur devra photographier le bon au dépôt avant de
                  confirmer la réception à destination.
                </p>
              </div>
            )}
            {form.formState.errors.root && (
              <p role='alert' className='text-sm text-destructive'>
                {form.formState.errors.root.message}
              </p>
            )}
            <div className='sticky bottom-0 flex justify-end gap-3 border-t bg-background/95 py-4'>
              <Button
                type='button'
                variant='outline'
                disabled={form.formState.isSubmitting}
                onClick={() => (step ? setStep(step - 1) : onOpenChange(false))}
              >
                {step ? 'Précédent' : 'Annuler'}
              </Button>
              {step < 2 ? (
                <Button key='next-step' type='button' onClick={next}>
                  Suivant
                </Button>
              ) : (
                <Button
                  key='submit-plan'
                  type='submit'
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className='mr-2 size-4 animate-spin' />
                  )}
                  {editTourId
                    ? 'Enregistrer les modifications'
                    : 'Planifier l’enlèvement'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      )}
    </>
  )
  if (fullPage)
    return (
      <div className='mx-auto w-full max-w-4xl space-y-8 rounded-lg border bg-card p-6 sm:p-8'>
        {content}
      </div>
    )
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!form.formState.isSubmitting) onOpenChange(value)
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {editTourId ? 'Modifier l’enlèvement' : 'Planifier un enlèvement'}
          </DialogTitle>
          <DialogDescription>
            Du dépôt vers le site destinataire.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
