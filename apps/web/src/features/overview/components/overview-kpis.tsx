import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { MetricCardWithChart } from '@/components/charts'
import { formatDashboardMetricValue } from '@/features/dashboard/lib/format-quantity'
import type { DashboardView } from '@/features/dashboard/data/dashboard'

const kpiHref: Record<string, string> = {
  transported: '/tours',
  delivered: '/tours',
  'transported-bottles': '/tours',
  'delivered-bottles': '/tours',
  alerts: '/anomalies',
}

/**
 * Scoped headline metrics extracted from the dashboard view. Each card shows
 * a sparkline over the last days and links to its operational domain.
 */
export function OverviewKpis({ dashboard }: { dashboard: DashboardView }) {
  const { t } = useTranslation('dashboard')

  return (
    <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {dashboard.metrics.map((metric) => (
        <MetricCardWithChart
          key={metric.id}
          label={metric.title}
          // The dashboard owns the single metric formatter, so a volume is never
          // rendered here without its canonical unit.
          value={formatDashboardMetricValue(metric.value, t)}
          actions={
            <Link
              to={(kpiHref[metric.id] ?? '/overview') as never}
              className='text-muted-foreground transition-colors hover:text-foreground'
              aria-label={t('actions.viewDetails')}
            >
              <ArrowRight className='size-4' />
            </Link>
          }
          className='rounded-2xl border-border/60 shadow-none'
        />
      ))}
    </section>
  )
}
