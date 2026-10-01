import { useMemo } from 'react'
import { Activity } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import {
  getDriverPerformance,
  getPerformanceSummary,
  type DriverPerformanceView,
} from './data/performance'

export function PerformancePage() {
  const rows = useMemo(() => getDriverPerformance(), [])
  const summary = useMemo(() => getPerformanceSummary(), [])

  return (
    <PageShell>
      <PageHeader
        title='Performance'
        description='Taux de complétion des tournées et points de contrôle par chauffeur.'
      />

      <div className='grid gap-4 sm:grid-cols-4'>
        <KpiTile label='Chauffeurs' value={String(summary.drivers)} />
        <KpiTile label='Tournées' value={String(summary.tours)} />
        <KpiTile label='Complétion moyenne' value={`${summary.avgCompletion}%`} />
        <KpiTile label='Checkpoints manqués' value={String(summary.missedCheckpoints)} />
      </div>

      <SectionCard title='Par chauffeur' description='Classement par taux de complétion.'>
        <div className='space-y-2'>
          {rows.map((row) => (
            <PerformanceRow key={row.driverId} row={row} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function PerformanceRow({ row }: { row: DriverPerformanceView }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <Activity className='size-4 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{row.driverName}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {row.completed} complétées / {row.inFlight} en cours
          </p>
        </div>
      </div>
      <div className='flex items-center gap-1.5'>
        <Badge variant={row.missedCheckpoints > 0 ? 'destructive' : 'secondary'}>
          {row.missedCheckpoints} manqués
        </Badge>
        <span className='text-sm font-medium'>{row.completionRate}%</span>
      </div>
    </div>
  )
}