import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pingDotClasses } from './status-indicator-motion'

const PULSE_DOT_CLASSES = {
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-500',
  red: 'bg-red-600',
  muted: 'bg-muted-foreground',
} satisfies Record<string, string>

export type StatusTone = keyof typeof PULSE_DOT_CLASSES

type StatusIndicatorProps = {
  children: ReactNode
  tone?: StatusTone
  ariaLabel?: string
  pulse?: boolean
}

export function StatusIndicator({
  children,
  tone = 'emerald',
  ariaLabel,
  pulse = false,
}: StatusIndicatorProps) {
  const toneClass = PULSE_DOT_CLASSES[tone]
  const ping = pingDotClasses(toneClass, pulse)
  return (
    <span
      className='inline-flex items-center gap-2'
      role='status'
      aria-label={ariaLabel}
      data-status-indicator
    >
      <span
        aria-hidden='true'
        className={cn('relative inline-flex size-2 shrink-0 rounded-full', toneClass)}
      >
        {ping ? <span className={cn(ping)} /> : null}
      </span>
      <span>{children}</span>
    </span>
  )
}

export const STATUS_TONE_MAP: Record<string, StatusTone> = {
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