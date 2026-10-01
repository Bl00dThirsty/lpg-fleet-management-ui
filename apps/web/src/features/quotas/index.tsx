import { useMemo } from 'react'
import { Gauge } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { formatTm } from '@/features/map/utils/format'
import { getMarketeurQuotas, getQuotaSummary, type MarketeurQuotaView } from './data/quotas'

export function QuotasPage() {
  const rows = useMemo(() => getMarketeurQuotas(), [])
  const summary = useMemo(() => getQuotaSummary(), [])

  return (
    <PageShell>
      <PageHeader
        title='Quotas & volumes'
        description='Volumes déclarés par marketeur et consommation livrée.'
      />

      <div className='grid gap-4 sm:grid-cols-4'>
        <KpiTile label='Marketeurs' value={String(summary.marketeurs)} />
        <KpiTile label='Volume déclaré' value={`${formatTm(summary.declared)}`} />
        <KpiTile label='Volume livré' value={`${formatTm(summary.delivered)}`} />
        <KpiTile label='Utilisation moyenne' value={`${summary.avgUsage}%`} />
      </div>

      <SectionCard title='Quotas par marketeur' description='Déclaration vs livraison effective.'>
        <div className='space-y-2'>
          {rows.map((row) => (
            <QuotaRow key={row.marketeurId} row={row} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function QuotaRow({ row }: { row: MarketeurQuotaView }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <Gauge className='size-4 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{row.marketeurName}</p>
          <p className='truncate text-xs text-muted-foreground'>
             {formatTm(row.deliveredVolume)} livrés sur {formatTm(row.declaredVolume)} déclarés
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <div className='h-2 w-32 overflow-hidden rounded-full bg-muted'>
          <div
            className='h-full rounded-full bg-primary'
            style={{ width: `${Math.min(row.usageRate, 100)}%` }}
          />
        </div>
        <span className='text-sm font-medium'>{row.usageRate}%</span>
      </div>
    </div>
  )
}