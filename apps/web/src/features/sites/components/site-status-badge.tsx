import { Tooltip, TooltipContent, TooltipTrigger } from '@lpg/ui'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SiteRow, SiteStatus } from '../lib/site-status-machine'
import { explainPromotion, type PromotionThresholds } from '../lib/auto-promotion'

const STATUS_LABEL: Record<SiteStatus, string> = {
  UNASSIGNED: 'Non assigné',
  ASSIGNED: 'Assigné',
  ACTIVE: 'Actif',
  VERIFIED: 'Vérifié',
  SUSPENDED: 'Suspendu',
  REJECTED: 'Rejeté',
}

const STATUS_CLASS: Record<SiteStatus, string> = {
  UNASSIGNED: 'bg-slate-200 text-slate-800',
  ASSIGNED: 'bg-sky-100 text-sky-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  VERIFIED: 'bg-emerald-600 text-white',
  SUSPENDED: 'bg-amber-200 text-amber-900',
  REJECTED: 'bg-rose-200 text-rose-900',
}

export function SiteStatusBadge({
  row,
  thresholds,
}: {
  row: SiteRow
  thresholds: PromotionThresholds
}) {
  const explanation = explainPromotion(row, thresholds, (fr) => fr)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
            STATUS_CLASS[row.status],
          )}
        >
          {STATUS_LABEL[row.status]}
          {explanation ? <Info className='size-3' aria-hidden /> : null}
        </span>
      </TooltipTrigger>
      {explanation ? (
        <TooltipContent side='top'>{explanation}</TooltipContent>
      ) : null}
    </Tooltip>
  )
}
