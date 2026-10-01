import { useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { api } from '@lpg/api-client'
import { SubmitButton } from '@/components/entity-crud/form-ui'
import { VEHICLE_OPTIONS, certificateFromForm } from '../data/certificates-crud'
import type { CertificateView } from '../data/certificates'

const certificateFormSchema = z.object({
  vehicle_id: z.string().min(1, 'Un véhicule est obligatoire.'),
  certificate_number: z
    .string()
    .trim()
    .min(1, 'Le numéro de certificat est obligatoire.'),
  issued_at: z.string(),
  expiry_at: z.string(),
  url: z.union([
    z.literal(''),
    z.string().trim().url('URL invalide.'),
  ]),
})

type CertificateFormValues = z.infer<typeof certificateFormSchema>

type CertificateEditSheetProps = {
  certificate: CertificateView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function certToForm(c: CertificateView): CertificateFormValues {
  return {
    vehicle_id: c.vehicleId,
    certificate_number: c.certificateNumber === '—' ? '' : c.certificateNumber,
    issued_at: c.issuedAt === '—' ? '' : c.issuedAt,
    expiry_at: c.expiryAt === '—' ? '' : c.expiryAt,
    url: c.url ?? '',
  }
}

export function CertificateEditSheet({
  certificate,
  open,
  onOpenChange,
  onSaved,
}: CertificateEditSheetProps) {
  const [submitting, setSubmitting] = useState(false)
  const isCreate = certificate === null

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: certificate
      ? certToForm(certificate)
      : {
          vehicle_id: '',
          certificate_number: '',
          issued_at: '',
          expiry_at: '',
          url: '',
        },
  })

  async function onSubmit(values: CertificateFormValues) {
    setSubmitting(true)
    try {
      const patch = await certificateFromForm(values)
      await api.vehicles.patch(values.vehicle_id, patch)
      toast.success(isCreate ? 'Certificat créé.' : 'Certificat mis à jour.')
      onSaved?.()
      onOpenChange(false)
    } catch {
      toast.error('Échec de l’enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-xl'>
        <SheetHeader className='pb-2'>
          <SheetTitle>
            {isCreate ? 'Nouveau certificat' : 'Modifier le certificat'}
          </SheetTitle>
          <SheetDescription>
            {isCreate
              ? 'Associez un certificat de jaugeage à un véhicule.'
              : certificate
                ? `${certificate.licensePlate} — ${certificate.certificateNumber}`
                : ''}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-4 pb-2'>
              <FormField
                control={form.control}
                name='vehicle_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Véhicule</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder='Choisir un véhicule...' />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
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
                name='certificate_number'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° certificat</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='JAUGE-2026-XXXX'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='issued_at'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Émis le</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='expiry_at'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expire le</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL du document (MinIO)</FormLabel>
                    <FormControl>
                      <Input
                        type='url'
                        placeholder='https://...'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className='text-xs text-muted-foreground'>
                      Le lien est enregistré via saveLink (MinIO).
                    </p>
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className='gap-2 border-t pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <SubmitButton pending={submitting}>
                {isCreate ? 'Créer' : 'Enregistrer'}
              </SubmitButton>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
