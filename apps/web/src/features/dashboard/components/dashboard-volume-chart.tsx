import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/charts'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import { formatDashboardQuantity } from '../lib/format-quantity'
import { DashboardUnitTabs } from './dashboard-unit-tabs'
import { periodLabelKey } from '../data/dashboard-query'
import type { DashboardUnit, DashboardView } from '../data/dashboard'

/** Two clearly distinct hues so the two bars never read as one series. */
const LOADED_COLOR = 'var(--color-primary)'
const DELIVERED_COLOR = '#f59e0b'

export function DashboardVolumeChart({
  period,
  transported,
  delivered,
}: {
  period: DashboardView['overview']['period']
  transported: DashboardView['overview']['transported']
  delivered: DashboardView['overview']['delivered']
}) {
  const { t } = useTranslation('dashboard')
  const reducedMotion = usePrefersReducedMotion()
  const [unit, setUnit] = useState<DashboardUnit>('TM')

  const loaded = transported[unit]
  const deliveredVolume = delivered[unit]
  const periodLabel = t(periodLabelKey(period))
  const hasData = loaded.value > 0 || deliveredVolume.value > 0
  const series = [
    {
      label: periodLabel,
      loaded: loaded.value,
      delivered: deliveredVolume.value,
    },
  ]

  return (
    <ChartCard
      title={t('monthly.title')}
      description={t('monthly.currentPeriodDescription')}
      status={hasData ? 'ready' : 'empty'}
      emptyLabel={t('monthly.empty')}
      actions={<DashboardUnitTabs unit={unit} onUnitChange={setUnit} />}
    >
      <div className='space-y-4'>
        <figure
          role='img'
          aria-labelledby='dashboard-volume-chart-title'
          aria-describedby='dashboard-volume-summary dashboard-volume-caption'
          className='h-[240px]'
        >
          <span id='dashboard-volume-chart-title' className='sr-only'>
            {t('monthly.chartTitle')}
          </span>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={series} accessibilityLayer barCategoryGap={18}>
              <CartesianGrid
                stroke='rgba(148, 163, 184, 0.18)'
                strokeDasharray='4 6'
                vertical={false}
              />
              <XAxis dataKey='label' tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value) =>
                  formatDashboardQuantity(Number(value), unit)
                }
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatDashboardQuantity(Number(value), unit),
                  String(name),
                ]}
              />
              <Legend />
              <Bar
                dataKey='loaded'
                name={
                  unit === 'TM'
                    ? t('monthly.loadedLegend')
                    : t('monthly.loadedBtlLegend')
                }
                fill={LOADED_COLOR}
                radius={[10, 10, 0, 0]}
                isAnimationActive={!reducedMotion}
              />
              <Bar
                dataKey='delivered'
                name={
                  unit === 'TM'
                    ? t('monthly.deliveredLegend')
                    : t('monthly.deliveredBtlLegend')
                }
                fill={DELIVERED_COLOR}
                radius={[10, 10, 0, 0]}
                isAnimationActive={!reducedMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </figure>

        <p id='dashboard-volume-summary' className='text-sm text-muted-foreground'>
          {hasData
            ? t('monthly.summary', {
                period: periodLabel,
                loaded: formatDashboardQuantity(loaded.value, unit),
                delivered: formatDashboardQuantity(deliveredVolume.value, unit),
              })
            : t('monthly.empty')}
        </p>

        <details className='text-sm'>
          <summary className='cursor-pointer font-medium'>
            {t('monthly.tableSummary')}
          </summary>
          <table className='mt-2 w-full text-left'>
            <caption id='dashboard-volume-caption' className='sr-only'>
              {t('monthly.tableCaption')}
            </caption>
            <thead>
              <tr>
                <th scope='col'>{t('monthly.tablePeriod')}</th>
                <th scope='col'>
                  {unit === 'TM'
                    ? t('monthly.tableLoaded')
                    : t('monthly.tableLoadedBtl')}
                </th>
                <th scope='col'>
                  {unit === 'TM'
                    ? t('monthly.tableDelivered')
                    : t('monthly.tableDeliveredBtl')}
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((point) => (
                <tr key={point.label}>
                  <td>{point.label}</td>
                  <td>{formatDashboardQuantity(point.loaded, unit)}</td>
                  <td>{formatDashboardQuantity(point.delivered, unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </ChartCard>
  )
}
