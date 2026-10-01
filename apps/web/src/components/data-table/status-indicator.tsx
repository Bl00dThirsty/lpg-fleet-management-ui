import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const PULSE_DOT_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-500',
  red: 'bg-red-600',
  muted: 'bg-muted-foreground',
}

type StatusIndicatorProps = {
  children: ReactNode
  tone?: keyof typeof PULSE_DOT_CLASSES
  ariaLabel?: string
}

export function StatusIndicator({
  children,
  tone = 'emerald',
  ariaLabel,
}: StatusIndicatorProps) {
  return (
    <span
      className='inline-flex items-center gap-2'
      role='status'
      aria-label={ariaLabel}
      data-status-indicator
    >
      <span
        aria-hidden='true'
        className={cn(
          'relative inline-flex size-2 shrink-0 rounded-full',
          PULSE_DOT_CLASSES[tone]
        )}
      >
        <span
          className={cn(
            'absolute inset-0 -m-0.5 animate-ping rounded-full opacity-50',
            PULSE_DOT_CLASSES[tone]
          )}
        />
      </span>
      <span>{children}</span>
    </span>
  )
}

export const STATUS_TONE_MAP: Record<string, keyof typeof PULSE_DOT_CLASSES> = {
  ACTIVE: 'emerald',
  INACTIVE: 'slate',
  ASSIGNED: 'emerald',
  UNASSIGNED: 'slate',
  INMISSION: 'sky',
  OFFLINE: 'rose',
  PENDINGSYNC: 'amber',
  SYNCING: 'violet',
  SYNCED: 'emerald',
  SYNCFAILED: 'rose',
  MAINTENANCE: 'amber',
  DEPLOYED: 'sky',
  REMOVED: 'muted',
  LOST: 'red',
  AVAILABLE: 'emerald',
  ASSIGNEDTOBOTTLE: 'sky',
  INTRANSITOUT: 'amber',
  INTRANSITIN: 'violet',
  BLOCKED: 'red',
  DRAFT: 'muted',
  PLANNED: 'sky',
  PENDINGTRANSPORTERACK: 'amber',
  ACKNOWLEDGED: 'emerald',
  INPROGRESS: 'sky',
  CHECKPOINTACTIVE: 'violet',
  CLOSED: 'muted',
  CANCELLED: 'red',
}