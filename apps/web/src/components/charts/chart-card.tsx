import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/layout/page'
import { cn } from '@/lib/utils'

export type ChartCardStatus = 'ready' | 'loading' | 'empty' | 'error'

type ChartCardProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  status?: ChartCardStatus
  empty?: boolean
  emptyLabel?: string
  onRetry?: () => void
}

export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
  status,
  empty,
  emptyLabel,
  onRetry,
}: ChartCardProps) {
  const { t } = useTranslation('common')
  const resolvedStatus = status ?? (empty ? 'empty' : 'ready')
  const isLoading = resolvedStatus === 'loading'
  const statusMessage = {
    ready: t('charts.ready'),
    loading: t('charts.loading'),
    empty: t('charts.emptyStatus'),
    error: t('charts.errorStatus'),
  }[resolvedStatus]

  return (
    <Card className={cn('@container/chart', className)}>
      <CardHeader className='flex flex-row items-start justify-between gap-2 pb-2'>
        <div>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      <span role='status' aria-live='polite' aria-atomic='true' className='sr-only'>
        {statusMessage}
      </span>
      <CardContent aria-busy={isLoading || undefined}>
        {resolvedStatus === 'loading' ? (
          <Skeleton
            className='h-[220px] w-full motion-reduce:animate-none'
            aria-hidden='true'
          />
        ) : null}
        {resolvedStatus === 'empty' ? (
          <EmptyState title={emptyLabel ?? t('charts.empty')} />
        ) : null}
        {resolvedStatus === 'error' ? (
          <Alert variant='destructive'>
            <AlertTitle>{t('charts.error')}</AlertTitle>
            <AlertDescription>
              <p>{t('charts.errorDescription')}</p>
              {onRetry ? (
                <Button type='button' variant='outline' size='sm' onClick={onRetry}>
                  {t('charts.retry')}
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        {resolvedStatus === 'ready' ? children : null}
      </CardContent>
    </Card>
  )
}
