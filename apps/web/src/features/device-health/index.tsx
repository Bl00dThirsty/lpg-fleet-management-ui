import { useMemo } from 'react'
import { AlertTriangle, BatteryLow } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { getDeviceHealth, getDeviceHealthSummary, type DeviceHealthView } from './data/device-health'

export function DeviceHealthPage() {
  const summary = useMemo(() => getDeviceHealthSummary(), [])
  const rows = useMemo(() => getDeviceHealth(), [])

  return (
    <PageShell>
      <PageHeader
        title='Santé appareils'
        description='État des dispositifs nécessitant une attention particulière.'
      />

      <div className='grid gap-4 sm:grid-cols-4'>
        <KpiTile label='Appareils' value={String(summary.total)} />
        <KpiTile label='Opérationnels' value={String(summary.operational)} />
        <KpiTile label='À surveiller' value={String(summary.attention)} />
        <KpiTile label='Batterie critique' value={String(summary.batteryCritical)} />
      </div>

      <SectionCard title='Dispositifs à surveiller' description='Batterie faible ou appareils hors-ligne.'>
        <div className='space-y-2'>
          {rows.length === 0 && (
            <p className='text-sm text-muted-foreground'>Aucun appareil ne requiert d’attention.</p>
          )}
          {rows.map((row) => (
            <DeviceRow key={row.id} row={row} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function DeviceRow({ row }: { row: DeviceHealthView }) {
  const offline = row.issue === 'OFFLINE'
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        {offline ? <AlertTriangle className='size-4 shrink-0 text-rose-500' /> : <BatteryLow className='size-4 shrink-0 text-amber-500' />}
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{row.serial}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {row.typeLabel} / {row.battery != null ? `${row.battery}%` : 'Batterie —'}
          </p>
        </div>
      </div>
      <div className='flex items-center gap-1.5'>
        <Badge
          variant={offline ? 'destructive' : 'secondary'}
          className={!offline ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : undefined}
        >
          {row.issue}
        </Badge>
      </div>
    </div>
  )
}