import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDashboardMetricValue } from '../lib/format-quantity'
import type { DashboardMetric } from '../data/dashboard'

export function DashboardKpiCard({
  metric,
  selected,
  onSelect,
}: {
  metric: DashboardMetric
  selected: boolean
  onSelect?: () => void
}) {
  const { t } = useTranslation('dashboard')

  return (
    <Card
      className={cn(
        'flex h-full flex-col rounded-2xl border-border/60 shadow-none transition-colors',
        selected && 'border-primary/30 bg-primary/[0.03] ring-1 ring-primary/15',
      )}
    >
      <CardHeader className='gap-3 pb-3'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex size-10 items-center justify-center rounded-xl border bg-muted/30'>
            <div className='size-4 rounded-full bg-primary/20' />
          </div>
          {metric.detailId === 'alerts' ? (
            <Badge className='border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'>
              {metric.highlight}
            </Badge>
          ) : null}
        </div>
        <div className='space-y-1'>
          <CardTitle className='text-base font-medium'>{metric.title}</CardTitle>
          <CardDescription>{metric.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-3'>
        <div className='flex items-end justify-between gap-3'>
          <p className='text-4xl font-semibold tracking-tight'>
            {formatDashboardMetricValue(metric.value, t)}
          </p>
          {metric.detailId !== 'alerts' ? (
            <Badge
              variant='outline'
              className='border-transparent bg-muted/40 text-foreground'
            >
              {metric.highlight}
            </Badge>
          ) : null}
        </div>

        {metric.detailId && onSelect ? (
          <Button
            type='button'
            variant='ghost'
            className='mt-auto h-9 w-full justify-between rounded-xl bg-muted/35 px-3 shadow-none hover:bg-muted/55 dark:bg-white/5 dark:hover:bg-white/10'
            onClick={onSelect}
          >
            {t('actions.viewDetails')}
            <ChevronRight className='size-4 text-muted-foreground' />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
