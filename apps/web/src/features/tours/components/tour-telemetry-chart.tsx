import { useMemo } from 'react'
import { type ElementType } from 'react'
import { Activity, Droplets, Package, PackageCheck } from 'lucide-react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { RouteTelemetryPoint, TourActivity } from '../data/tour-activity'

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
  const isBottles = trip.tourneeType === 'BOUTEILLES50KG'

  const deliveredBottles = trip.stops
    .filter((stop) => stop.completed)
    .reduce(
      (sum, stop) =>
        sum + Math.round(Number(stop.deliveredQuantity ?? 0)),
      0,
    )
  const totalBottles = trip.requested_quantity

  const chartData = useMemo(() => {
    return trip.telemetry.map((point, index) => {
      const cumulativeDelivered = computeCumulativeDelivered(
        trip.telemetry,
        index,
        isBottles,
        totalBottles,
      )
      return {
        timeLabel: formatShortTime(point.recordedAt),
        estimatedVolume: point.estimatedVolume,
        lpgLevelPercent: point.lpgLevelPercent,
        delivered: cumulativeDelivered,
        remainingBottles: isBottles
          ? Math.max(totalBottles - cumulativeDelivered, 0)
          : null,
      }
    })
  }, [trip.telemetry, isBottles, totalBottles, formatShortTime])

  return (
    <Card className='overflow-hidden border-transparent shadow-sm'>
      <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-2 border-b bg-muted/20'>
        <div>
          <CardTitle>Télémétrie GPL</CardTitle>
          <CardDescription>
            {isBottles
              ? 'Évolution du niveau de gaz, des bouteilles restantes et des bouteilles livrées au fil de la tournée.'
              : 'Évolution du niveau GPL, du volume estimé restant et du volume livré cumulé pendant la tournée.'}
          </CardDescription>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='outline'>{trip.execution_mode}</Badge>
          <Badge variant='outline'>{trip.tourneeType}</Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4 p-4'>
        <div className='h-[320px] w-full rounded-2xl bg-muted/25 px-2 py-4 shadow-inner'>
          <ResponsiveContainer width='100%' height={280}>
            <ComposedChart data={chartData}>
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
                  ? (value) => `${value}`
                  : (value) => `${Math.round(value / 100)}`}
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
                    formatQuantity={formatQuantity}
                    isBottles={isBottles}
                    totalBottles={totalBottles}
                  />
                )}
              />
              <Area
                yAxisId='volume'
                dataKey='estimatedVolume'
                name='Volume restant'
                fill={isBottles ? 'url(#tour-telemetry-bottles)' : 'url(#tour-telemetry-volume)'}
                stroke={isBottles ? '#6366f1' : '#22c55e'}
                strokeWidth={3}
                type='monotone'
              />
              {isBottles ? (
                <Bar
                  yAxisId='volume'
                  dataKey='remainingBottles'
                  name='Bouteilles restantes'
                  fill='#a78bfa'
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
              ) : null}
              <Line
                yAxisId='volume'
                dataKey='delivered'
                name='Volume livré'
                stroke='#f59e0b'
                strokeWidth={2.5}
                strokeDasharray='5 4'
                dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }}
                type='monotone'
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className='grid gap-3 sm:grid-cols-4'>
          <TelemetrySignal
            label={isBottles ? 'Niveau citerne' : 'Niveau GPL'}
            value={`${trip.latestTelemetry.lpgLevelPercent}%`}
            hint={`${trip.lpgDropPercent}% depuis le départ`}
            icon={Droplets}
          />
          <TelemetrySignal
            label={isBottles ? 'Bouteilles restantes' : 'Volume restant'}
            value={
              isBottles
                ? `${Math.max(totalBottles - deliveredBottles, 0)} / ${totalBottles}`
                : formatQuantity(trip.remainingQuantity)
            }
            hint={
              isBottles
                ? `${deliveredBottles} livrées sur ${totalBottles}`
                : `${trip.remainingPercent}% de la charge initiale`
            }
            icon={isBottles ? PackageCheck : Package}
          />
          <TelemetrySignal
            label={isBottles ? 'Livré' : 'Volume livré'}
            value={
              isBottles
                ? `${deliveredBottles} btl`
                : formatQuantity(trip.deliveredQuantity ?? 0)
            }
            hint={
              isBottles
                ? 'Cumul depuis le départ'
                : `${trip.deliveredPercent}% déjà affectés`
            }
            icon={Activity}
          />
          <TelemetrySignal
            label='Écart non justifié'
            value={trip.unaccounted > 0 ? formatQuantity(trip.unaccounted) : isBottles ? '0 btl' : '0 TM'}
            hint={
              trip.unaccounted > 0
                ? 'À expliquer avant clôture'
                : 'Bilan de charge cohérent'
            }
            icon={Activity}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function TelemetryTooltip({
  active,
  label,
  payload,
  formatQuantity,
  isBottles,
  totalBottles,
}: {
  active?: boolean
  label?: string | string[]
  payload?: Array<{ name?: string; value?: number; color?: string }>
  formatQuantity: (value: number) => string
  isBottles: boolean
  totalBottles: number
}) {
  if (!active || !payload || payload.length === 0) return null
  const lookup = (name: string) =>
    payload.find((item) => item.name === name)?.value
  const volume = lookup('Volume restant')
  const delivered = lookup('Volume livré')
  const remainingBottles = lookup('Bouteilles restantes')

  return (
    <div className='rounded-xl bg-background/95 px-3 py-2 shadow-lg'>
      <p className='text-xs font-medium text-muted-foreground'>{label}</p>
      <div className='mt-2 space-y-1 text-sm'>
        {isBottles ? (
          <>
            <p className='text-indigo-600 dark:text-indigo-300'>
              Volume citerne: {formatQuantity(Number(volume ?? 0))}
            </p>
            <p className='text-violet-600 dark:text-violet-300'>
              Bouteilles restantes: {Number(remainingBottles ?? 0)} / {totalBottles}
            </p>
          </>
        ) : (
          <p className='text-emerald-600 dark:text-emerald-300'>
            Volume restant: {formatQuantity(Number(volume ?? 0))}
          </p>
        )}
        <p className='text-amber-600 dark:text-amber-300'>
          {isBottles ? 'Bouteilles livrées' : 'Volume livré'}: {formatQuantity(Number(delivered ?? 0))}
        </p>
      </div>
    </div>
  )
}

function computeCumulativeDelivered(
  telemetry: readonly RouteTelemetryPoint[],
  index: number,
  isBottles: boolean,
  totalBottles: number,
): number {
  const points = telemetry.slice(0, index + 1)
  let totalLoad = points[0]?.estimatedVolume ?? 0
  let cumulative = 0
  for (const point of points) {
    const delivered = Math.max(totalLoad - point.estimatedVolume, 0)
    cumulative = delivered
    totalLoad = point.estimatedVolume
  }
  if (isBottles && totalBottles > 0) {
    return Math.min(Math.round(cumulative), totalBottles)
  }
  return cumulative
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
