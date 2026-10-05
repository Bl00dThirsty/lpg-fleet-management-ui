import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@lpg/ui'
import { hasPermission, type PermissionCode } from '@lpg/permissions'
import type { Checkpoint } from '@lpg/types'
import { useRoleStore } from '@/store/role-store'
import { useToursStore } from '@/store/tours-store'
import {
  type TourActivity,
  type TourneeStatus,
  type ExecutionMode,
} from '../data/tour-activity'
import {
  tourActions,
  TOUR_ACTION_LABELS,
  type TourAction,
} from '../data/tour-machine'

const ACTION_PERMISSION: Record<TourAction, PermissionCode> = {
  'send-to-transporter': 'tours.create',
  acknowledge: 'tours.assign',
  plan: 'tours.write',
  start: 'tours.write',
  close: 'tours.write',
  cancel: 'tours.write',
}

const ACTION_VARIANT: Record<
  TourAction,
  'default' | 'outline' | 'destructive'
> = {
  'send-to-transporter': 'default',
  acknowledge: 'default',
  plan: 'default',
  start: 'default',
  close: 'default',
  cancel: 'outline',
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
  const activeRole = useRoleStore((s) => s.activeRole)
  const actions = useMemo(
    () =>
      tourActions({
        status: tour.tourneeStatus,
        execution_mode: tour.execution_mode,
      })
        .filter((action) =>
          hasPermission(activeRole, ACTION_PERMISSION[action])
        )
        .filter((action) => action !== 'close' || isCloseAllowed(checkpoints)),
    [tour, activeRole, checkpoints]
  )

  async function handleAction(action: TourAction) {
    try {
      const extra: { loadedQuantity?: number; deliveredQuantity?: number } = {}
      if (action === 'close') {
        extra.loadedQuantity = tour.requested_quantity
        extra.deliveredQuantity = tour.requested_quantity
      }
      const updated = await useToursStore
        .getState()
        .performActionAsync(tour.id, action, extra)
      toast.success(`${tour.reference} — ${TOUR_ACTION_LABELS[action]}`)
      onPerformed?.(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  if (actions.length === 0) return null

  return (
    <div className='flex flex-wrap justify-end gap-2 border-t pt-3'>
      {actions.map((action) => (
        <Button
          key={action}
          variant={ACTION_VARIANT[action]}
          onClick={() => handleAction(action)}
        >
          {TOUR_ACTION_LABELS[action]}
        </Button>
      ))}
    </div>
  )
}
