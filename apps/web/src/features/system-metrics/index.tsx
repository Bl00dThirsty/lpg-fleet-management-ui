import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { getMetricGroups, getSystemMetrics } from './data/system-metrics'

export function SystemMetricsPage() {
  const metrics = useMemo(() => getSystemMetrics(), [])
  const groups = useMemo(() => getMetricGroups(), [])

  return (
    <PageShell>
      <PageHeader
        title='Métriques système'
        description='Indicateurs agrégés d’activité et de santé de la plateforme.'
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {metrics.map((metric) => (
          <KpiTile key={metric.id} label={metric.label} value={metric.value} />
        ))}
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <SectionCard title='Activité' description='Métriques opérationnelles'>
          <MetricList items={groups.operations} />
        </SectionCard>
        <SectionCard title='État plateforme' description='Métriques de santé'>
          <MetricList items={groups.health} />
        </SectionCard>
      </div>
    </PageShell>
  )
}

function MetricList({ items }: { items: { key: string; value: number }[] }) {
  return (
    <ul className='space-y-2'>
      {items.map((item) => (
        <li key={item.key} className='flex items-center justify-between rounded-lg border px-3 py-2 text-sm'>
          <span className='text-muted-foreground'>{item.key}</span>
          <span className='font-medium'>{item.value}</span>
        </li>
      ))}
    </ul>
  )
}