import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { DashboardAlert } from '../data/dashboard'

export function DashboardAlertList({ alerts }: { alerts: DashboardAlert[] }) {
  const { t } = useTranslation('dashboard')

  if (alerts.length === 0) {
    return (
      <p className='rounded-xl border border-border/60 p-4 text-sm text-muted-foreground'>
        {t('details.alerts.empty')}
      </p>
    )
  }

  return (
    <div className='grid gap-3 md:grid-cols-2'>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className='rounded-xl border border-border/60 bg-background p-4'
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='space-y-1'>
              <p className='font-medium'>{alert.title}</p>
              <p className='text-sm text-muted-foreground'>
                {alert.description}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-md border px-2 py-0.5 text-xs',
                alert.severity === 'high'
                  ? 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
              )}
            >
              {alert.severity === 'high' ? t('actions.high') : t('actions.medium')}
            </span>
          </div>
          <div className='mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3'>
            <span>{alert.scope}</span>
            <span>{alert.owner}</span>
            <span className='sm:text-right'>{alert.metricValue}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
