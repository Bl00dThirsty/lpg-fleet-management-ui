import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@lpg/api-client'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { useToursStore } from '@/store/tours-store'
import { useAuthStore } from '@/store/auth-store'
import { invalidateResource } from '@/lib/api/invalidation'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { isTourLivreur } from '../lib/tour-create-helpers'

const schema = z.object({
  vehicle_id: z.string().min(1, 'Véhicule requis'),
  driver_id: z.string().min(1, 'Chauffeur requis'),
  livreur_user_id: z.string().min(1, 'Livreur requis'),
})
type Values = z.infer<typeof schema>

export function TourAcknowledgeDialog({
  tourId,
  open,
  onOpenChange,
}: {
  tourId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const user = useAuthStore((s) => s.user)
  const tour = useToursStore((s) => s.tours.find((t) => t.id === tourId))
  const qc = useQueryClient()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_id: '', driver_id: '', livreur_user_id: '' },
  })
  const options = useQuery({
    queryKey: ['tours', 'acknowledge-options', user?.id, tourId],
    enabled: open && !!tour,
    queryFn: async () => {
      const [vehicles, drivers, users] = await Promise.all([
        api.vehicles.list({ size: 200 }),
        api.drivers.list({ size: 200 }),
        api.users.list({ size: 200 }),
      ])
      const orgId = tour?.transporter_org_id
      const crew = await Promise.all(
        users.data
          .filter((u) => u.org_id === orgId && u.is_active && !u.deleted_at)
          .map((u) => api.users.getById(u.id))
      )
      return {
        vehicle_id: vehicles.data
          .filter(
            (v) =>
              v.org_id === orgId &&
              v.is_active &&
              !v.deleted_at &&
              v.type === tour?.type
          )
          .map((v) => ({ id: v.id, name: v.license_plate })),
        driver_id: drivers.data
          .filter((d) => d.org_id === orgId && d.is_active && !d.deleted_at)
          .map((d) => ({ id: d.id, name: d.first_name + ' ' + d.last_name })),
        livreur_user_id: crew
          .filter((u) => isTourLivreur(u))
          .map((u) => ({ id: u.id, name: u.first_name + ' ' + u.last_name })),
      }
    },
  })
  async function submit(values: Values) {
    for (const key of Object.keys(values) as (keyof Values)[]) {
      if (!options.data?.[key].some((row) => row.id === values[key])) {
        form.setError(key, {
          message: 'Sélectionnez un membre de l’équipe du transporteur.',
        })
        return
      }
    }
    try {
      await useToursStore
        .getState()
        .performActionAsync(tourId, 'acknowledge', values)
      invalidateResource(qc, 'tours')
      toast.success('Tournée acquittée et équipage affecté')
      onOpenChange(false)
    } catch (error) {
      toast.error(extractErrorMessage(error))
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!form.formState.isSubmitting) onOpenChange(v)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acquitter et affecter l’équipage</DialogTitle>
          <DialogDescription>
            Choisissez le véhicule, le chauffeur et le livreur du transporteur.
          </DialogDescription>
        </DialogHeader>
        {options.isPending ? (
          <p role='status'>Chargement de l’équipage…</p>
        ) : options.isError ? (
          <p role='alert'>
            Équipage indisponible.{' '}
            <Button onClick={() => options.refetch()}>Réessayer</Button>
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
              {(
                [
                  ['vehicle_id', 'Véhicule'],
                  ['driver_id', 'Chauffeur'],
                  ['livreur_user_id', 'Livreur'],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={form.formState.isSubmitting}
                          className='h-10 w-full rounded-md border bg-background px-3'
                        >
                          <option value=''>Sélectionner…</option>
                          {options.data?.[name].map((row) => (
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
              ))}
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className='mr-2 size-4 animate-spin' />
                )}
                Acquitter
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
