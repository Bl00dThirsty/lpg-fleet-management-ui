import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { type ElementType } from 'react'
import { Package, PackageCheck } from 'lucide-react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/charts'
import { Badge } from '@/components/ui/badge'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import type { TourActivity } from '../data/tour-activity'

type TourTelemetryChartProps = {
  trip: TourActivity
  formatQuantity: (value: number) => string
  formatShortTime: (value: string) => string
}

export function TourTelemetryChart({
  trip,
  formatQuantity,
  formatShortTime,
}: TourTelemetryChartProps) {
  const { t } = useTranslation('dashboard')
  const isBottles = trip.tourneeType === 'BOUTEILLES50KG'
  const reducedMotion = usePrefersReducedMotion()

  const deliveredBottles = trip.deliveredQuantity
  const totalBottles = trip.requested_quantity

  const hasVolumeEvidence = trip.telemetry.some(
    (point) => (isBottles ? point.rfidTagId != null : point.meterReading != null),
  )
  const chartData = useMemo(() => {
    const observedTags = new Set<string>()
    return trip.telemetry
      .filter((point) => isBottles ? point.rfidTagId != null : point.meterReading != null)
      .map((point) => {
        if (point.rfidTagId) observedTags.add(point.rfidTagId)
        return {
          timeLabel: formatShortTime(point.recordedAt),
          meterReading: point.meterReading,
          bottleObservations: isBottles ? observedTags.size : null,
        }
      })
  }, [trip.telemetry, isBottles, formatShortTime])

  return (
    <ChartCard
      title={t('telemetry.title')}
      description={
        isBottles
          ? t('telemetry.bottlesDescription')
          : t('telemetry.vracDescription')
      }
      actions={
        <div className='flex items-center gap-2'>
          <Badge variant='outline'>{trip.execution_mode}</Badge>
          <Badge variant='outline'>{trip.tourneeType}</Badge>
        </div>
      }
      status={hasVolumeEvidence ? 'ready' : 'empty'}
      emptyLabel={t('telemetry.empty')}
      className='overflow-hidden'
    >
      <div className='space-y-4 p-4'>
        <figure
          role='img'
          aria-labelledby='tour-telemetry-chart-title'
          aria-describedby='tour-telemetry-summary tour-telemetry-caption'
          className='h-[320px] w-full rounded-2xl bg-muted/25 px-2 py-4 shadow-inner'
        >
          <span id='tour-telemetry-chart-title' className='sr-only'>{t('telemetry.chartTitle')}</span>
          <ResponsiveContainer width='100%' height={280}>
            <ComposedChart data={chartData} accessibilityLayer>
              <defs>
                <linearGradient
                  id='tour-telemetry-volume'
                  x1='0%'
                  x2='0%'
                  y1='0%'
                  y2='100%'
                >
                  <stop offset='0%' stopColor='#22c55e' stopOpacity='0.5' />
                  <stop offset='100%' stopColor='#22c55e' stopOpacity='0.02' />
                </linearGradient>
                <linearGradient
                  id='tour-telemetry-bottles'
                  x1='0%'
                  x2='0%'
                  y1='0%'
                  y2='100%'
                >
                  <stop offset='0%' stopColor='#6366f1' stopOpacity='0.55' />
                  <stop offset='100%' stopColor='#6366f1' stopOpacity='0.04' />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke='rgba(148, 163, 184, 0.18)'
                strokeDasharray='4 6'
              />
              <XAxis
                dataKey='timeLabel'
                stroke='rgba(100, 116, 139, 0.9)'
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                yAxisId='volume'
                domain={[0, 'dataMax']}
                stroke='rgba(34, 197, 94, 0.85)'
                tickFormatter={isBottles
                 ? (value) => `${value} btl`
                   : (value) => `${Math.round(value)} TM`}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={56}
              />
              <Tooltip
                content={(props) => (
                  <TelemetryTooltip
                    active={props.active as boolean | undefined}
                    label={(props.label as string | number | undefined)?.toString()}
                    payload={props.payload as unknown as Array<{
                      name?: string
                      value?: number
                      color?: string
                    }>}
                     isBottles={isBottles}
                  />
                )}
              />
              <Legend />
               <Area
                 yAxisId='volume'
                 dataKey={isBottles ? 'bottleObservations' : 'meterReading'}
                 name={isBottles ? t('telemetry.observationsLegend') : t('telemetry.meterReadingLegend')}
                 fill={isBottles ? 'url(#tour-telemetry-bottles)' : 'url(#tour-telemetry-volume)'}
                 stroke={isBottles ? '#6366f1' : '#22c55e'}
                 strokeWidth={3}
                 type='monotone'
                 isAnimationActive={!reducedMotion}
               />
            </ComposedChart>
          </ResponsiveContainer>
        </figure>

        <p id='tour-telemetry-summary' className='text-sm text-muted-foreground'>
          {isBottles
            ? t('telemetry.summaryBottles', { delivered: deliveredBottles, total: totalBottles, remaining: `${Math.max(totalBottles - deliveredBottles, 0)} btl` })
            : t('telemetry.summaryVrac', { delivered: formatQuantity(trip.deliveredQuantity ?? 0), remaining: formatQuantity(trip.remainingQuantity) })}
        </p>
        <details className='text-sm'>
          <summary className='cursor-pointer font-medium'>{t('telemetry.tableSummary')}</summary>
          <div className='overflow-x-auto'>
            <table className='mt-2 w-full min-w-[520px] text-left'>
              <caption id='tour-telemetry-caption' className='sr-only'>{t('telemetry.tableCaption')}</caption>
              <thead><tr><th>{t('telemetry.time')}</th><th>{isBottles ? t('telemetry.observationsTable') : t('telemetry.meterReadingTable')}</th></tr></thead>
              <tbody>
                {chartData.map((point) => (
                  <tr key={point.timeLabel}>
                    <td>{point.timeLabel}</td>
                    <td>{isBottles ? `${point.bottleObservations ?? 0} btl` : formatQuantity(point.meterReading ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <div className='grid gap-3 sm:grid-cols-3'>
          <TelemetrySignal
            label={isBottles ? t('telemetry.remainingBottlesSignal') : t('telemetry.remainingVracSignal')}
            value={
              isBottles
                ? `${Math.max(totalBottles - deliveredBottles, 0)} / ${totalBottles}`
                : formatQuantity(trip.remainingQuantity)
            }
            hint={
              isBottles
                ? t('telemetry.deliveredBottlesHint', { delivered: deliveredBottles, total: totalBottles })
                : t('telemetry.remainingVracHint', { value: trip.remainingPercent })
            }
            icon={isBottles ? PackageCheck : Package}
          />
        </div>
      </div>
    </ChartCard>
  )
}

function TelemetryTooltip({
  active,
  label,
  payload,
  isBottles,
}: {
  active?: boolean
  label?: string | string[]
  payload?: Array<{ name?: string; value?: number; color?: string }>
  isBottles: boolean
}) {
  const { t } = useTranslation('dashboard')
  if (!active || !payload || payload.length === 0) return null
  const lookup = (name: string) =>
    payload.find((item) => item.name === name)?.value
  const value = lookup(
    isBottles ? t('telemetry.observationsLegend') : t('telemetry.meterReadingLegend'),
  )

  return (
    <div className='rounded-xl bg-background/95 px-3 py-2 shadow-lg'>
      <p className='text-xs font-medium text-muted-foreground'>{label}</p>
      <div className='mt-2 space-y-1 text-sm'>
        <p className={isBottles ? 'text-indigo-600 dark:text-indigo-300' : 'text-emerald-600 dark:text-emerald-300'}>
          {isBottles ? t('telemetry.observationsLegend') : t('telemetry.meterReadingLegend')}: {Number(value ?? 0)} {isBottles ? 'btl' : 'TM'}
        </p>
      </div>
    </div>
  )
}

function TelemetrySignal({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ElementType
  label: string
  value: string
  hint: string
}) {
  return (
    <div className='rounded-xl bg-muted/30 px-4 py-3 shadow-xs'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon data-icon='inline-start' />
        {label}
      </div>
      <p className='mt-2 text-lg font-semibold'>{value}</p>
      <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
    </div>
  )
}
