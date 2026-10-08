import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiAdapter } from '@lpg/api-client'
import type { MissionDocument } from '@lpg/types'
import { hasEffectivePermission } from '@lpg/permissions'
import { FileText, Loader2, RefreshCw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { invalidateResource } from '@/lib/api/invalidation'
import type { RouteTripViewStop } from '../data/tour-activity'
import { getTourLiveRefreshIntervalMs } from '../lib/use-tour-live-refresh'

const schema = z.object({
  file: z
    .instanceof(File, { message: 'Choisissez un justificatif.' })
    .refine(
      (f) => ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type),
      'Format accepté : PDF, JPEG ou PNG.'
    ),
  label: z
    .string()
    .trim()
    .min(1, 'Indiquez la référence ou le libellé du document.'),
  checkpoint: z.string(),
})
export interface MissionDocumentsProps {
  missionId: string
  stops?: RouteTripViewStop[]
  checkpointId?: string
  missionKind?: 'DELIVERY' | 'PICKUP'
}
function isPdf(doc: MissionDocument) {
  return (
    /\.pdf(?:$|[?#])|application\/pdf/i.test(doc.url) || /pdf/i.test(doc.label)
  )
}
export function MissionDocuments({
  missionId,
  stops,
  checkpointId,
  missionKind = 'DELIVERY',
}: MissionDocumentsProps) {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { label: '', checkpoint: checkpointId ?? '' },
  })
  const permission = missionKind === 'PICKUP' ? 'pickups.write' : 'tours.write'
  const canUpload =
    !!user &&
    hasEffectivePermission(user.system_role, permission, user.custom_roles)
  const query = useQuery({
    queryKey: ['tours', missionId, 'documents', user?.id],
    queryFn: () =>
      apiAdapter.request<MissionDocument[]>(
        '/tours/' + encodeURIComponent(missionId) + '/documents'
      ),
    staleTime: 1000,
    refetchInterval: getTourLiveRefreshIntervalMs(),
  })
  const visibleDocuments = query.data?.filter(
    (d) =>
      !checkpointId ||
      d.id === checkpointId ||
      (checkpointId === stops?.[0]?.id &&
        stops[0].role === 'loading' &&
        d.id === 'loading')
  )
  const selected = query.data?.find((d) => d.id === selectedId)
  async function submit(values: z.infer<typeof schema>) {
    const checkpoint = checkpointId ?? values.checkpoint
    if (checkpoint && !stops?.some((s) => s.id === checkpoint)) {
      form.setError('checkpoint', {
        message: 'Cette étape n’appartient pas à la mission.',
      })
      return
    }
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () =>
          reject(new Error('Lecture du fichier impossible.'))
        reader.onload = () =>
          resolve(String(reader.result).replace(/^data:[^;]+;base64,/, ''))
        reader.readAsDataURL(values.file)
      })
      await useToursStore.getState().uploadMissionDocument(missionId, {
        label: values.label,
        file_base64: base64,
        checkpoint_id: checkpoint || undefined,
      })
      invalidateResource(qc, 'tours')
      toast.success('Justificatif enregistré')
      setImportOpen(false)
      form.reset({ label: '', checkpoint: checkpointId ?? '' })
    } catch (error) {
      toast.error(extractErrorMessage(error))
    }
  }
  return (
    <Card>
      <CardHeader className='flex flex-wrap items-center justify-between gap-3 sm:flex-row'>
        <CardTitle className='text-sm'>
          {checkpointId
            ? 'Justificatif de cette étape'
            : 'Bons de livraison & justificatifs'}
        </CardTitle>
        <div className='flex gap-2'>
          {canUpload && (
            <Button size='sm' onClick={() => setImportOpen(true)}>
              <Upload className='mr-2 size-4' />
              Téléverser le justificatif
            </Button>
          )}
          <Button
            size='sm'
            variant='outline'
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            aria-label='Actualiser les justificatifs'
          >
            <RefreshCw className='size-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {query.isPending ? (
          <p role='status'>Chargement des justificatifs…</p>
        ) : query.isError ? (
          <p role='alert'>Les documents sont indisponibles. Réessayez.</p>
        ) : !visibleDocuments?.length ? (
          <p className='text-sm text-muted-foreground'>
            Aucun document transmis par le livreur pour le moment.
          </p>
        ) : (
          visibleDocuments.map((doc) => (
            <Button
              key={doc.id}
              variant='outline'
              className='h-auto w-full justify-start gap-3 whitespace-normal p-3 text-left'
              onClick={() => {
                setSelectedId(doc.id)
                void query.refetch()
              }}
            >
              <FileText className='size-5 shrink-0' />
              <span className='flex-1'>
                {doc.label}
                <span className='block text-xs text-muted-foreground'>
                  {doc.captured_at
                    ? new Date(doc.captured_at).toLocaleString('fr-FR')
                    : 'Document transmis'}
                </span>
              </span>
              <Badge variant='outline'>{isPdf(doc) ? 'PDF' : 'Image'}</Badge>
            </Button>
          ))
        )}
        <Dialog
          open={!!selectedId}
          onOpenChange={(v) => {
            if (!v) setSelectedId(null)
          }}
        >
          <DialogContent className='sm:max-w-4xl'>
            <DialogHeader>
              <DialogTitle>{selected?.label ?? 'Justificatif'}</DialogTitle>
              <DialogDescription>
                Document joint à la mission. Sa présence ne vaut pas
                certification de conformité.
              </DialogDescription>
            </DialogHeader>
            {selected && (
              <>
                {isPdf(selected) ? (
                  <object
                    data={selected.url}
                    type='application/pdf'
                    className='h-[65vh] w-full'
                  >
                    <a href={selected.url}>Ouvrir le PDF</a>
                  </object>
                ) : (
                  <img
                    src={selected.url}
                    alt={selected.label}
                    className='max-h-[65vh] w-full object-contain'
                  />
                )}
                <Button asChild variant='outline'>
                  <a
                    href={selected.url}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    Ouvrir dans un nouvel onglet
                  </a>
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>
        <Dialog
          open={importOpen}
          onOpenChange={(v) => {
            if (!form.formState.isSubmitting) setImportOpen(v)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Téléverser le justificatif</DialogTitle>
              <DialogDescription>
                Ajoutez un bon scanné au format PDF, JPEG ou PNG.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='file'
                  render={({ field: { onChange, name, ref } }) => (
                    <FormItem>
                      <FormLabel>Fichier</FormLabel>
                      <FormControl>
                        <Input
                          type='file'
                          name={name}
                          ref={ref}
                          accept='application/pdf,image/jpeg,image/png'
                          disabled={form.formState.isSubmitting}
                          onChange={(e) => onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='label'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence ou libellé</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!checkpointId && (
                  <FormField
                    control={form.control}
                    name='checkpoint'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Étape</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className='h-10 w-full rounded-md border bg-background px-3'
                            disabled={form.formState.isSubmitting}
                          >
                            <option value=''>Mission globale</option>
                            {stops?.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.pointName ?? s.title}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Button type='submit' disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className='mr-2 size-4 animate-spin' />
                  )}
                  Enregistrer le justificatif
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
