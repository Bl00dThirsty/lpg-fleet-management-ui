import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SectionCard } from '@/components/layout/page'
import { reconciliationStatusLabels } from '@/features/reconciliations/data/reconciliations'
import type { ReconciliationView } from '@/features/reconciliations/data/reconciliations'
import { formatTm } from '@/features/map/utils/format'

const statusTone: Record<ReconciliationView['status'], 'default' | 'secondary' | 'outline'> = {
  PENDING: 'secondary',
  VERIFIED: 'outline',
  REDRESSEMENTAPPLIED: 'default',
}

/**
 * Reconciliation rows whose volume gap exceeds the settings-driven tolerance,
 * linking to the full reconciliation list.
 */
export function FlaggedReconciliations({ rows }: { rows: ReconciliationView[] }) {
  return (
    <SectionCard
      title='Écarts au-dessus du seuil'
      description={`${rows.length} réconciliation(s) dont l'écart dépasse la tolérance configurée.`}
      actions={
        <Link
          to='/reconciliations'
          className='inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          Voir tout <ArrowRight className='size-3.5' />
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className='text-sm text-muted-foreground'>Aucun écart au-dessus du seuil.</p>
      ) : (
        <div className='space-y-2'>
          {rows.map((r) => (
            <div
              key={r.id}
              className='flex items-center justify-between gap-2 rounded-lg border px-3 py-2'
            >
              <div className='flex min-w-0 items-center gap-2'>
                <AlertTriangle className='size-4 shrink-0 text-rose-500' />
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{r.marketeur_name}</p>
                  <p className='font-mono text-xs text-muted-foreground'>{r.reference}</p>
                </div>
              </div>
              <div className='flex shrink-0 items-center gap-2'>
                <span className='text-sm tabular-nums'>{formatTm(Math.abs(r.volume_gap))}</span>
                <Badge variant={statusTone[r.status]} className='font-mono text-xs'>
                  {r.gap_percentage.toFixed(1)}%
                </Badge>
                <Badge variant='secondary' className='text-xs'>
                  {reconciliationStatusLabels[r.status]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
