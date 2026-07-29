import { type ElementType } from 'react'
import { Activity, Package } from 'lucide-react'
import {
  Area,
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
} from '@lpg/ui'
import { type RouteTripView } from './routes'

type RouteTelemetryChartProps = {
  trip: RouteTripView
  formatKg: (value: number) => string
  formatShortTime: (value: string) => string
}

export function RouteTelemetryChart({
  trip,
  formatKg,
  formatShortTime,
}: RouteTelemetryChartProps) {
  const chartData = trip.telemetry.map((point) => ({
    timeLabel: formatShortTime(point.recordedAt),
    lpgLevelPercent: point.lpgLevelPercent,
    estimatedVolumeKg: point.estimatedVolumeKg,
  }))

  return (
    <Card className='overflow-hidden border-transparent shadow-sm'>
      <CardHeader className='border-b bg-muted/20'>
        <CardTitle>Télémétrie GPL</CardTitle>
        <CardDescription>
          Évolution du niveau GPL et du volume estimé pendant la
          tournée.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 p-4'>
        <div className='surface-sunken h-[320px] px-2 py-4'>
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient
                  id='routes-telemetry-lpg'
                  x1='0%'
                  x2='0%'
                  y1='0%'
                  y2='100%'
                >
                  <stop offset='0%' stopColor='#22c55e' stopOpacity='0.5' />
                  <stop offset='100%' stopColor='#22c55e' stopOpacity='0.02' />
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
                yAxisId='lpg'
                domain={[0, 100]}
                stroke='rgba(34, 197, 94, 0.85)'
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={40}
              />
              <Tooltip
                content={({ active, label, payload }) => {
                  if (!active || !payload || payload.length === 0) return null

                  const lpgValue = payload.find(
                    (item) => item.name === 'GPL'
                  )?.value
                  const volumeValue = payload.find(
                    (item) => item.name === 'Volume'
                  )?.value

                  return (
                    <div className='rounded-xl bg-background/95 px-3 py-2 shadow-lg'>
                      <p className='text-xs font-medium text-muted-foreground'>
                        {label}
                      </p>
                      <div className='mt-2 space-y-1 text-sm'>
                        <p className='text-emerald-600 dark:text-emerald-300'>
                          GPL: {lpgValue}%
                        </p>
                        <p className='text-foreground'>
                          Volume: {formatKg(Number(volumeValue ?? 0))}
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                yAxisId='lpg'
                dataKey='lpgLevelPercent'
                name='GPL'
                fill='url(#routes-telemetry-lpg)'
                stroke='#22c55e'
                strokeWidth={3}
                type='monotone'
              />
              <Line
                yAxisId='lpg'
                dataKey='estimatedVolumeKg'
                hide
                name='Volume'
                stroke='transparent'
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <TelemetrySignal
            label='Niveau GPL'
            value={`${trip.latestTelemetry.lpgLevelPercent}%`}
            hint={`${trip.lpgDropPercent}% depuis le depart`}
            icon={Package}
          />
          <TelemetrySignal
            label='Volume estime'
            value={formatKg(trip.latestTelemetry.estimatedVolumeKg)}
            hint={
              trip.unaccountedKg > 0
                ? `${formatKg(trip.unaccountedKg)} a verifier`
                : 'Aucun ecart non justifie'
            }
            icon={Activity}
          />
        </div>
      </CardContent>
    </Card>
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
    <div className='surface-sunken px-4 py-3'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className='size-3.5' />
        {label}
      </div>
      <p className='mt-2 text-lg font-semibold'>{value}</p>
      <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
    </div>
  )
}
