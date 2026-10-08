import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useIsMutating, useQueryClient } from '@tanstack/react-query'
import { hasEffectivePermission } from '@lpg/permissions'
import { Check, Loader2, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from '@/components/ui/form'
import { useToursStore } from '@/store/tours-store'
import { useAuthStore } from '@/store/auth-store'
import { invalidateResource } from '@/lib/api/invalidation'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { canEditTour } from '../data/tour-machine'
import { canViewAllTourCrew } from '../lib/tour-create-helpers'
import {
  missionQuantitySchema,
  planCheckpointQuantity,
} from '../lib/mission-quantity'
export function MissionQuantityEditor({
  tourId,
  checkpointId,
  value,
}: {
  tourId: string
  checkpointId?: string
  value: number
}) {
  const tour = useToursStore((s) => s.tours.find((t) => t.id === tourId))
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [optimistic, setOptimistic] = useState<number | null>(null)
  const locked = useRef(false)
  const cancelled = useRef(false)
  const type = tour?.type ?? 'VRAC'
  const form = useForm<{ quantity: number }>({
    resolver: zodResolver(missionQuantitySchema(type)),
    defaultValues: { quantity: value },
  })
  const pickup = tour?.mission_kind === 'PICKUP'
  const allowed =
    !!tour &&
    !!user &&
    canEditTour(tour) &&
    hasEffectivePermission(
      user.system_role,
      pickup ? 'pickups.write' : 'tours.write',
      user.custom_roles
    ) &&
    (canViewAllTourCrew(user) ||
      (tour.marketeur_org_id === user.org_id &&
        (tour.created_by === user.id ||
          !!user.site_ids?.includes(
            (pickup ? tour.destination_site_id : tour.source_site_id) ?? ''
          )))) &&
    (pickup || !!checkpointId)
  const unit = type === 'VRAC' ? 'TM' : 'btl'
  const mutationKey = ['tours', 'quantity', tourId]
  const pending = useIsMutating({ mutationKey }) > 0
  const mutation = useMutation({ mutationKey, mutationFn: async (quantity: number) => {
      const store = useToursStore.getState()
      const tour = store.tours.find(row => row.id === tourId)
      if (!tour || !allowed) throw new Error('Modification non autorisée.')
      if (pickup) {
        if (
          !tour.source_site_id ||
          !tour.destination_site_id ||
          !tour.scheduled_at ||
          !tour.vehicle_id ||
          !tour.driver_id ||
          !tour.livreur_user_id
        )
          throw new Error(
            'Complétez la planification avant de modifier la quantité.'
          )
        await store.updatePickupAsync(tour.id, {
          marketeur_org_id: tour.marketeur_org_id,
          source_site_id: tour.source_site_id,
          destination_site_id: tour.destination_site_id,
          scheduled_at: tour.scheduled_at,
          type,
          requested_quantity: quantity,
          vehicle_id: tour.vehicle_id,
          driver_id: tour.driver_id,
          livreur_user_id: tour.livreur_user_id,
        })
      } else {
        const checkpoints = await store.fetchCheckpoints(tour.id)
        await store.updateTourAsync(
          tour.id,
          planCheckpointQuantity(
            checkpoints,
            checkpointId!,
            quantity,
            tour.requested_quantity,
            type
          )
        )
      }
  } })
  async function save({ quantity }: { quantity: number }) {
    if (locked.current || cancelled.current || !allowed || !tour || qc.isMutating({ mutationKey })) return
    if (quantity === value) {
      setEditing(false)
      return
    }
    locked.current = true
    setOptimistic(quantity)
    setEditing(false)
    try {
      await mutation.mutateAsync(quantity)
      invalidateResource(qc, 'tours')
      if (pickup) invalidateResource(qc, 'pickups')
      toast.success('Quantité enregistrée')
    } catch (error) {
      form.reset({ quantity: value })
      setEditing(false)
      toast.error(extractErrorMessage(error))
    } finally {
      setOptimistic(null)
      locked.current = false
    }
  }
  if (!editing)
    return (
      <Button
        type='button'
        variant='ghost'
        className='h-auto min-h-9 justify-start gap-2 px-2 font-semibold'
        disabled={!allowed || pending || optimistic !== null}
        aria-label={allowed ? 'Modifier la quantité' : 'Quantité prévue'}
        onClick={() => {
          cancelled.current = false
          form.reset({ quantity: value })
          setEditing(true)
        }}
      >
        {new Intl.NumberFormat('fr-FR').format(optimistic ?? value)} {unit}
        {optimistic !== null ? (
          <Loader2
            className='size-3 animate-spin'
            aria-label='Enregistrement'
          />
        ) : (
          allowed && <Pencil className='size-3 text-muted-foreground' />
        )}
      </Button>
    )
  return (
    <Form {...form}>
      <form
        className='max-w-xs'
        noValidate
        onSubmit={(event) => { void form.handleSubmit(save)(event) }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            void form.handleSubmit(save)()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            cancelled.current = true
            form.reset({ quantity: value })
            setEditing(false)
          }
        }}
      >
        <FormField
          control={form.control}
          name='quantity'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='sr-only'>Quantité ({unit})</FormLabel>
              <div className='flex items-center gap-1'>
                <FormControl>
                  <Input
                    {...field}
                    autoFocus
                    type='number'
                    step={type === 'VRAC' ? 'any' : '1'}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ''
                          ? NaN
                          : Number(event.target.value)
                      )
                    }
                    className='h-9 w-28'
                  />
                </FormControl>
                <span className='text-sm'>{unit}</span>
                <Button
                  type='submit'
                  size='icon'
                  variant='ghost'
                  aria-label='Enregistrer la quantité'
                >
                  <Check className='size-4' />
                </Button>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  aria-label='Annuler la modification'
                  onClick={() => {
                    cancelled.current = true
                    setEditing(false)
                  }}
                >
                  <X className='size-4' />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
