import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { z } from 'zod'
import type { ClientSite, Region } from '@lpg/types'
import { saveClientSite } from '../data/client-site-mutations'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateResource } from '@/lib/api/invalidation'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { useAuthStore } from '@/store/auth-store'
import { hasEffectivePermission } from '@lpg/permissions'
import { MapLocationPicker } from '@/features/map/components/map-location-picker'
import type { ClientSiteView } from '../data/clients'

const REGIONS: { value: Region; label: string }[] = [
  { value: 'LITTORAL', label: 'Littoral (Douala)' },
  { value: 'CENTRE', label: 'Centre (Yaoundé)' },
  { value: 'OUEST', label: 'Ouest (Bafoussam)' },
  { value: 'SUD', label: 'Sud (Kribi, Ebolowa)' },
  { value: 'SUDOUEST', label: 'Sud-Ouest (Buéa, Limbé)' },
  { value: 'NORD', label: 'Nord (Garoua)' },
  { value: 'EXTREMENORD', label: 'Extrême-Nord (Maroua)' },
  { value: 'ADAMAOUA', label: 'Adamaoua (Ngaoundéré)' },
  { value: 'EST', label: 'Est (Bertoua)' },
  { value: 'NORDOUEST', label: 'Nord-Ouest (Bamenda)' },
]

import {
  clientSiteFormSchema,
  type ClientSiteFormValues,
} from '../lib/client-site-schema'

export interface ClientSiteFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOrgId: string
  clientName: string
  siteToEdit?: ClientSiteView | null
  onSuccess: (savedSite: ClientSite) => void
}

export function ClientSiteFormModal({
  open,
  onOpenChange,
  clientOrgId,
  clientName,
  siteToEdit,
  onSuccess,
}: ClientSiteFormModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canWrite =
    !!user &&
    hasEffectivePermission(user.system_role, 'clients.write', user.custom_roles)

  const isEditing = Boolean(siteToEdit)

  const form = useForm<
    z.input<typeof clientSiteFormSchema>,
    unknown,
    ClientSiteFormValues
  >({
    resolver: zodResolver(clientSiteFormSchema),
    defaultValues: {
      name: siteToEdit?.name ?? '',
      region: siteToEdit?.region ?? 'LITTORAL',
      address: siteToEdit?.address ?? '',
      latitude: siteToEdit?.latitude ?? 4.0511,
      longitude: siteToEdit?.longitude ?? 9.7043,
      site_contact_name: siteToEdit?.site_contact_name ?? '',
      site_contact_phone: siteToEdit?.site_contact_phone ?? '',
      is_active: siteToEdit?.status !== 'INACTIVE',
    },
  })

  // Réinitialiser le formulaire dès l'ouverture ou le changement de cible
  useEffect(() => {
    if (open) {
      form.reset({
        name: siteToEdit?.name ?? '',
        region: siteToEdit?.region ?? 'LITTORAL',
        address: siteToEdit?.address ?? '',
        latitude: siteToEdit?.latitude ?? 4.0511,
        longitude: siteToEdit?.longitude ?? 9.7043,
        site_contact_name: siteToEdit?.site_contact_name ?? '',
        site_contact_phone: siteToEdit?.site_contact_phone ?? '',
        is_active: siteToEdit?.status !== 'INACTIVE',
      })
    }
  }, [open, siteToEdit, form])

  const currentCoords = {
    latitude: form.watch('latitude'),
    longitude: form.watch('longitude'),
  }

  const currentRegion = form.watch('region')

  const onSubmit = async (values: ClientSiteFormValues) => {
    setSubmitting(true)
    try {
      const createdOrUpdated = await saveClientSite(
        clientOrgId,
        values,
        siteToEdit?.id
      )
      invalidateResource(queryClient, 'clientSites')
      invalidateResource(queryClient, 'clients')
      toast.success(
        isEditing
          ? `Point de livraison "${values.name}" mis à jour`
          : `Nouveau point de livraison "${values.name}" ajouté à ${clientName}`
      )
      onSuccess(createdOrUpdated)
      onOpenChange(false)
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next)
      }}
    >
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='font-manrope text-lg'>
            {isEditing
              ? 'Modifier le point de livraison'
              : 'Ajouter un point de livraison'}
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            {clientName} — Définissez les coordonnées GPS et l’adresse pour le
            routage des tournées.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 pt-2'
          >
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>
                      Nom du site de livraison *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex: DOVV Bastos 3e'
                        className='h-8 text-xs'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='region'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>
                      Région administrative *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='h-8 text-xs'>
                          <SelectValue placeholder='Sélectionner une région' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGIONS.map((r) => (
                          <SelectItem
                            key={r.value}
                            value={r.value}
                            className='text-xs'
                          >
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='address'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>
                    Adresse physique / Repère de voirie
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Ex: Rue Njo-Njo, face station Total, Bonapriso, Douala'
                      className='h-8 text-xs'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />

            {/* Sélecteur de position sur carte (Map Pin Picker) */}
            <div className='space-y-1.5 rounded-lg border border-border/80 bg-muted/10 p-3'>
              <div className='flex items-center justify-between pb-1'>
                <Label className='text-xs font-semibold text-foreground'>
                  Géolocalisation & Pointage sur carte (SIG)
                </Label>
                <span className='text-[11px] text-muted-foreground'>
                  Piquez sur la carte ou ajustez manuellement
                </span>
              </div>

              <MapLocationPicker
                value={currentCoords}
                initialRegion={currentRegion}
                onChange={(coords) => {
                  form.setValue('latitude', coords.latitude, {
                    shouldValidate: true,
                  })
                  form.setValue('longitude', coords.longitude, {
                    shouldValidate: true,
                  })
                }}
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='site_contact_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>
                      Contact local (réceptionnaire)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex: Responsable cuve'
                        className='h-8 text-xs'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='site_contact_phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Téléphone contact</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='+237 6...'
                        className='h-8 text-xs'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='is_active'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-md border p-2.5'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-xs'>
                      Site actif pour les livraisons
                    </FormLabel>
                    <p className='text-[11px] text-muted-foreground'>
                      Permet d’inclure ce point dans la planification des
                      tournées
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className='gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type='submit'
                size='sm'
                disabled={submitting || !canWrite}
              >
                {submitting
                  ? 'Enregistrement…'
                  : isEditing
                    ? 'Mettre à jour'
                    : 'Ajouter le site'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
