import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { currentLang } from '@/lib/i18n/formatters'
import { formatDashboardQuantity } from '../lib/format-quantity'
import type { DashboardRecentActivity } from '../data/dashboard'

const statusClasses: Record<DashboardRecentActivity['status'], string> = {
  completed:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  attention:
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  planned:
    'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300',
}

function formatActivityDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(currentLang(), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function DashboardRecentActivity({
  activities,
}: {
  activities: DashboardRecentActivity[]
}) {
  const { t } = useTranslation('dashboard')

  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader className='flex flex-row items-start justify-between gap-3 space-y-0'>
        <div className='space-y-1'>
          <CardTitle>{t('recentActivities.title')}</CardTitle>
          <CardDescription>{t('recentActivities.description')}</CardDescription>
        </div>
        <Button
          type='button'
          variant='outline'
          className='h-9 rounded-xl bg-background shadow-none'
        >
          {t('recentActivities.viewAll')}
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {activities.map((activity) => (
          <div
            key={activity.id}
            className='flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background px-4 py-4'
          >
            <div className='space-y-1.5'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='font-medium'>{activity.title}</p>
                <Badge className={statusClasses[activity.status]}>
                  {activity.status === 'completed'
                    ? t('actions.confirmed')
                    : activity.status === 'attention'
                      ? t('actions.attention')
                      : t('actions.planned')}
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                {activity.description}
              </p>
              <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                <span>{activity.location}</span>
                <span>{activity.owner}</span>
                <span>{formatActivityDate(activity.happenedAt)}</span>
              </div>
            </div>

            {/* No measured volume for this event: the metric is omitted, never
                rendered as a measured zero. */}
            {activity.volume ? (
              <div className='text-right'>
                <p className='text-sm font-medium'>
                  {formatDashboardQuantity(
                    activity.volume.value,
                    activity.volume.unit,
                  )}
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {t('recentActivities.measuredVolume')}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
