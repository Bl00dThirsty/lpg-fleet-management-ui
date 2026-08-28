import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useToursStore } from '@/store/tours-store'
import { type TourActivity, type TourneeStatus, type ExecutionMode } from '../data/tour-activity'
import {
  ACTION_PERMISSION,
  tourActions,
  TOUR_ACTION_LABELS,
  type TourAction,
} from '../data/tour-machine'

const ACTION_VARIANT: Record<TourAction, 'default' | 'outline' | 'destructive'> = {
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

export function TourActions({
  tour,
  onPerformed,
}: {
  tour: TourActivity
  onPerformed?: (next: TourActivity) => void
}) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const actions = useMemo(
    () =>
      tourActions({ status: tour.tourneeStatus, execution_mode: tour.execution_mode })
        .filter(
          (action) => hasPermission(activeRole, ACTION_PERMISSION[action]),
        )
        // acknowledge requires the transporter's crew, captured via the
        // transporter crew-assignment dialog (features/transporters), not a
        // bare status button.
        .filter((action) => action !== 'acknowledge'),
    [tour, activeRole],
  )

  function handleAction(action: TourAction) {
    try {
      const updated = useToursStore.getState().performAction(tour.id, action)
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
