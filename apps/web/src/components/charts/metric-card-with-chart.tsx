import type { ComponentType, ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Sparkline } from './sparkline'

type MetricCardWithChartProps = {
  label: string
  value: string | number
  icon?: ComponentType<{ className?: string }>
  /** Optional delta vs previous period. Positive is shown as `+N%`, negative as `-N%`. */
  delta?: number
  /** Sparkline points (oldest → newest). When omitted, no chart renders. */
  sparkline?: ReadonlyArray<number>
  /** Optional className for the inner card. */
  className?: string
  /** Slot rendered on the right (e.g. an action button). */
  actions?: ReactNode
}

/**
 * Drop-in replacement for the bespoke `KpiTile` rows seen across the
 * app. Adds: optional icon, optional sparkline trend, optional delta
 * badge, and uses the shadcn Card composition.
 */
export function MetricCardWithChart({
  label,
  value,
  icon: Icon,
  delta,
  sparkline,
  className,
  actions,
}: MetricCardWithChartProps) {
  const hasChart = !!sparkline && sparkline.length > 1
  return (
    <Card className={cn('@container/metric', className)}>
      <CardHeader className='flex flex-row items-center justify-between gap-2 pb-1'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          {Icon ? <Icon className='size-4 text-primary' /> : null}
          <span>{label}</span>
        </div>
        {actions}
      </CardHeader>
      <CardContent>
        <div className='flex items-end justify-between gap-3'>
          <div>
            <p className='text-2xl font-semibold tabular-nums leading-none'>
              {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            </p>
            {typeof delta === 'number' ? (
              <p
                className={cn(
                  'mt-1 text-xs tabular-nums',
                  delta > 0
                    ? 'text-emerald-600'
                    : delta < 0
                      ? 'text-rose-600'
                      : 'text-muted-foreground',
                )}
              >
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)}% vs période précédente
              </p>
            ) : null}
          </div>
          {hasChart ? <Sparkline values={sparkline!} /> : null}
        </div>
      </CardContent>
    </Card>
  )
}
