import { type ReactNode } from 'react'
import type { ActivityKind } from '@lpg/types'
import { cn } from '@/lib/utils'
import { resolveStatusMeta } from '@/lib/statuses/status-meta'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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

const BADGE_TONE_CLASSES: Record<string, string> = {
  emerald:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  amber:
    'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  violet:
    'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  slate:
    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  red: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  muted: 'bg-muted text-muted-foreground border-border',
}

export function StatusBadge({
  activity,
  value,
  showCode = false,
  className,
}: {
  activity: ActivityKind
  value: string
  showCode?: boolean
  className?: string
}) {
  const meta = resolveStatusMeta(activity, value)
  const toneClass = BADGE_TONE_CLASSES[meta.tone] ?? BADGE_TONE_CLASSES.slate

  const badgeElement = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-default select-none transition-colors',
        toneClass,
        className
      )}
      data-status-badge
    >
      <span className='size-1.5 rounded-full bg-current opacity-70' />
      <span>{meta.label}</span>
      {showCode && (
        <span className='opacity-60 text-[10px] font-mono'>[{meta.code}]</span>
      )}
    </span>
  )

  if (!meta.description) {
    return badgeElement
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badgeElement}</TooltipTrigger>
        <TooltipContent side='top' className='max-w-xs text-xs'>
          <p className='font-semibold'>
            {meta.label} ({meta.code})
          </p>
          <p className='text-muted-foreground mt-0.5'>{meta.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}