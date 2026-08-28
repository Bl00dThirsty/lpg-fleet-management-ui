import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { MetricCardWithChart } from '@/components/charts'
import type { DashboardMetric, DashboardView } from '@/features/dashboard/data/dashboard'
import { formatTm, formatBtl } from '@/features/map/utils/format'

const kpiHref: Record<string, string> = {
  transported: '/tours',
  reserve: '/sites',
  delivered: '/tours',
  alerts: '/anomalies',
}

/**
 * Scoped headline metrics extracted from the dashboard view. Each card shows
 * a sparkline over the last days and links to its operational domain.
 */
export function OverviewKpis({ dashboard }: { dashboard: DashboardView }) {
  const daily = dashboard.trendByPeriod.daily

  return (
    <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {dashboard.metrics.map((metric) => (
        <MetricCardWithChart
          key={metric.id}
          label={metric.title}
          value={formatMetricValue(metric.value, metric.unit)}
          delta={metric.deltaPercent}
          sparkline={daily.map((point) =>
            metric.id === 'alerts'
              ? point.alertCount
              : metric.id === 'reserve'
                ? point.reserveTM
                : metric.id === 'delivered'
                  ? point.delivered
                  : point.transportedTM
          )}
          actions={
            <Link
              to={(kpiHref[metric.id] ?? '/overview') as never}
              className='text-muted-foreground transition-colors hover:text-foreground'
              aria-label={`Ouvrir ${metric.title}`}
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

export function formatMetricValue(
  value: number,
  unit: DashboardMetric['unit']
): string {
  if (unit === 'TM') return formatTm(value)
  if (unit === 'btl') return formatBtl(value)
  if (unit === 'percent') return `${value}%`
  if (unit === 'days') return `${value.toFixed(1)} jours`
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)
}
