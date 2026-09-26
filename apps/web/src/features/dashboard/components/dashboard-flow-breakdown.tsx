import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDashboardQuantity } from '../lib/format-quantity'
import { DashboardUnitTabs } from './dashboard-unit-tabs'
import type { DashboardUnit, DashboardView } from '../data/dashboard'

/**
 * The flow is read one unit at a time: the headline, the segments and the shares
 * all come from the selected unit's own total, so TM tonnes are never laid over a
 * bottle count.
 */
export function DashboardFlowBreakdown({
  overview,
  breakdown,
}: {
  overview: DashboardView['overview']
  breakdown: DashboardView['flowBreakdown']
}) {
  const { t } = useTranslation('dashboard')
  const [unit, setUnit] = useState<DashboardUnit>('TM')
  const segments = breakdown[unit]
  const total = overview.transported[unit]

  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader className='gap-3'>
        <div>
          <CardTitle>{t('flow.title')}</CardTitle>
          <CardDescription>{t('flow.description')}</CardDescription>
        </div>
        <DashboardUnitTabs unit={unit} onUnitChange={setUnit} />
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>
            {t('flow.transportedLabel')}
          </p>
          <p className='text-4xl font-semibold tracking-tight'>
            {formatDashboardQuantity(total.value, unit)}
          </p>
          <p className='text-sm text-muted-foreground'>
            {t('flow.periodFleetContext')}
          </p>
        </div>

        {segments.length > 0 ? (
          <>
            <div
              className='flex h-3 overflow-hidden rounded-full bg-muted/40'
              role='img'
              aria-label={t('flow.carrierTitle')}
            >
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  style={{
                    width: `${segment.sharePercent}%`,
                    backgroundColor: segment.color,
                  }}
                />
              ))}
            </div>

            <ul className='space-y-3'>
              {segments.map((segment) => (
                <li
                  key={segment.id}
                  className='flex items-center justify-between gap-3 text-sm'
                >
                  <div className='flex items-center gap-3'>
                    <span
                      className='size-2.5 rounded-full'
                      style={{ backgroundColor: segment.color }}
                    />
                    <div>
                      <p className='font-medium'>{segment.label}</p>
                      <p className='text-xs text-muted-foreground'>
                        {t('flow.share', { value: segment.sharePercent })}
                      </p>
                    </div>
                  </div>
                  <p className='font-medium'>
                    {formatDashboardQuantity(segment.quantity.value, unit)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className='rounded-xl border border-border/60 p-4 text-sm text-muted-foreground'>
            {t('monthly.empty')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
