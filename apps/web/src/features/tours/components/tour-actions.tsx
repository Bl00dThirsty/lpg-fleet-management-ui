import { TourAcknowledgeDialog } from './tour-acknowledge-dialog'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { hasEffectivePermission } from '@lpg/permissions'
import type { Checkpoint } from '@lpg/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/auth-store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateResource } from '@/lib/api/invalidation'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { PickupsCreateWizard } from '@/features/pickups/components/pickups-create-wizard'
const TourEditPage = lazy(() =>
  import('./tour-edit-page').then((m) => ({ default: m.TourEditPage }))
)
const cancelSchema = z.object({
  reason: z.string().trim().min(1, 'Le motif d’annulation est obligatoire.'),
})

import { useToursStore } from '@/store/tours-store'
import {
  type TourActivity,
  type TourneeStatus,
  type ExecutionMode,
} from '../data/tour-activity'
import {
  tourActions,
  ACTION_PERMISSION,
  TOUR_ACTION_LABELS,
  canEditTour,
  type TourAction,
} from '../data/tour-machine'

const ACTION_VARIANT: Record<
  TourAction,
  'default' | 'outline' | 'destructive'
> = {
  'send-to-transporter': 'default',
  acknowledge: 'default',
  plan: 'default',
  start: 'default',
  close: 'default',
  cancel: 'destructive',
}

export const STATUS_CLASS: Record<TourneeStatus, string> = {
  DRAFT: 'bg-slate-200 text-slate-800',
  PLANNED: 'bg-sky-100 text-sky-800',
  PENDINGTRANSPORTERACK: 'bg-amber-100 text-amber-900',
  ACKNOWLEDGED: 'bg-violet-100 text-violet-900',
  INPROGRESS: 'bg-blue-500 text-white',
  CHECKPOINTACTIVE: 'bg-orange-500 text-white',
  CLOSED: 'bg-emerald-600 text-white',
  CANCELLED: 'bg-rose-100 text-rose-900',
}

export const MODE_CLASS: Record<ExecutionMode, string> = {
  INTERNAL: 'bg-slate-100 text-slate-700',
  EXTERNAL: 'bg-indigo-100 text-indigo-800',
}

const TERMINAL_CHECKPOINT_STATUSES: ReadonlySet<string> = new Set([
  'COMPLETED',
  'SKIPPED',
])

/**
 * Backend guard mirror: a tour closes only once every stop is terminal
 * (COMPLETED or SKIPPED). With no checkpoints loaded the guard is vacuously
 * true — the server remains the source of truth and refusals surface as
 * errors.
 */
export function isCloseAllowed(checkpoints?: Checkpoint[]): boolean {
  if (!checkpoints) return true
  return checkpoints.every((c) => TERMINAL_CHECKPOINT_STATUSES.has(c.status))
}

export function TourActions({
  tour,
  checkpoints,
  onPerformed,
}: {
  tour: TourActivity
  checkpoints?: Checkpoint[]
  onPerformed?: (next: TourActivity) => void
}) {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [pending, setPending] = useState<TourAction | null>(null)
  const [editBusy, setEditBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [ackOpen, setAckOpen] = useState(false)
  const form = useForm<z.infer<typeof cancelSchema>>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '' },
  })
  const pickup = tour.mission_kind === 'PICKUP'
  const can = (code: Parameters<typeof hasEffectivePermission>[1]) =>
    !!user && hasEffectivePermission(user.system_role, code, user.custom_roles)

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const actions = useMemo(
    () =>
      tourActions({
        status: tour.tourneeStatus,
        execution_mode: tour.execution_mode,
      })
        .filter(
          (action) =>
            !!user &&
            hasEffectivePermission(
              user.system_role,
              pickup ? 'pickups.write' : ACTION_PERMISSION[action],
              user.custom_roles
            )
        )
        .filter((action) => action !== 'close' || isCloseAllowed(checkpoints)),
    [tour, user, pickup, checkpoints]
  )

  async function handleAction(action: TourAction, reason?: string) {
    if (pending) return false
    setPending(action)
    try {
      const extra: {
        loadedQuantity?: number
        deliveredQuantity?: number
        reason?: string
      } = {}
      if (action === 'close') {
        extra.loadedQuantity = tour.loaded_quantity ?? undefined
        extra.deliveredQuantity = tour.delivered_quantity ?? undefined
      }
      if (action === 'cancel' && reason) {
        extra.reason = reason
      }
      const updated = await useToursStore
        .getState()
        .performActionAsync(tour.id, action, extra)
      toast.success(`${tour.reference} — ${TOUR_ACTION_LABELS[action]}`)
      invalidateResource(qc, 'tours')
      if (pickup) invalidateResource(qc, 'pickups')
      onPerformed?.(updated)
      return true
    } catch (err) {
      toast.error(extractErrorMessage(err))
      return false
    } finally {
      setPending(null)
    }
  }

  async function confirmCancel(values: z.infer<typeof cancelSchema>) {
    if (await handleAction('cancel', values.reason)) setCancelDialogOpen(false)
  }

  const canEdit =
    can(pickup ? 'pickups.write' : 'tours.write') &&
    canEditTour({ status: tour.tourneeStatus })

  if (actions.length === 0 && !canEdit) return null

  return (
    <>
      <div className='flex flex-wrap justify-end gap-2 border-t pt-3'>
        {canEdit && (
          <Button
            variant='outline'
            disabled={!!pending}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className='mr-1.5 size-4' />
            {pickup ? 'Modifier l’enlèvement' : 'Modifier la tournée'}
          </Button>
        )}
        {actions.map((action) => (
          <Button
            key={action}
            disabled={!!pending}
            title={
              action === 'acknowledge'
                ? 'Affectez l’équipage du transporteur pour acquitter la tournée.'
                : undefined
            }
            variant={ACTION_VARIANT[action]}
            onClick={() => {
              if (action === 'cancel') {
                form.reset({ reason: '' })
                setCancelDialogOpen(true)
              } else if (action === 'acknowledge') {
                setAckOpen(true)
              } else {
                void handleAction(action)
              }
            }}
          >
            {pending === action && (
              <Loader2 className='mr-2 size-4 animate-spin' />
            )}
            {TOUR_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>

      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(v) => {
          if (!pending) setCancelDialogOpen(v)
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(confirmCancel)}
              className='space-y-4'
            >
              <DialogHeader>
                <DialogTitle>Annuler la tournée {tour.reference}</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir annuler cette tournée ? Cette
                  opération est irréversible.
                </DialogDescription>
              </DialogHeader>
              <FormField
                control={form.control}
                name='reason'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif d’annulation</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={!!pending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setCancelDialogOpen(false)}
                  disabled={!!pending}
                >
                  Conserver
                </Button>
                <Button
                  variant='destructive'
                  type='submit'
                  disabled={!!pending}
                >
                  {pending ? 'Annulation…' : "Confirmer l'annulation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <TourAcknowledgeDialog
        tourId={tour.id}
        open={ackOpen}
        onOpenChange={setAckOpen}
      />
      {pickup ? (
        <PickupsCreateWizard
          open={editOpen}
          onOpenChange={setEditOpen}
          editTourId={tour.id}
          onCreated={() => {
            setEditOpen(false)
          }}
        />
      ) : (
        <Dialog
          open={editOpen}
          onOpenChange={(next) => {
            if (!editBusy) setEditOpen(next)
          }}
        >
          <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-5xl'>
            <DialogHeader>
              <DialogTitle>Modifier la tournée</DialogTitle>
              <DialogDescription>
                Modifiez la planification avant son démarrage.
              </DialogDescription>
            </DialogHeader>
            <Suspense fallback={<p role='status'>Chargement…</p>}>
              <TourEditPage
                tourId={tour.id}
                onBusyChange={setEditBusy}
                onSaved={() => setEditOpen(false)}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
