import { type ElementType } from 'react'
import { Activity, Gauge, Package } from 'lucide-react'
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
} from '@/components/ui/card'
import { type RouteTripView } from '../data/routes'

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
    pressureBar: point.pressureBar,
    estimatedVolumeKg: point.estimatedVolumeKg,
  }))

  return (
    <Card className='overflow-hidden border-transparent shadow-sm'>
      <CardHeader className='border-b bg-muted/20'>
        <CardTitle>Telemetrie GPL</CardTitle>
        <CardDescription>
          Evolution du niveau GPL, de la pression et du volume estime pendant la
          tournee.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 p-4'>
        <div className='h-[320px] rounded-2xl bg-muted/25 px-2 py-4 shadow-inner'>
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
              <YAxis
                yAxisId='pressure'
                orientation='right'
                domain={[8, 13]}
                stroke='rgba(56, 189, 248, 0.85)'
                tickFormatter={(value) => `${value}b`}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={44}
              />
              <Tooltip
                content={({ active, label, payload }) => {
                  if (!active || !payload || payload.length === 0) return null

                  const lpgValue = payload.find(
                    (item) => item.name === 'GPL'
                  )?.value
                  const pressureValue = payload.find(
                    (item) => item.name === 'Pression'
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
                        <p className='text-sky-600 dark:text-sky-300'>
                          Pression: {pressureValue} bar
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
                yAxisId='pressure'
                dataKey='pressureBar'
                name='Pression'
                stroke='#38bdf8'
                strokeWidth={3}
                dot={{ fill: '#38bdf8', r: 4, strokeWidth: 0 }}
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

        <div className='grid gap-3 sm:grid-cols-3'>
          <TelemetrySignal
            label='Niveau GPL'
            value={`${trip.latestTelemetry.lpgLevelPercent}%`}
            hint={`${trip.lpgDropPercent}% depuis le depart`}
            icon={Package}
          />
          <TelemetrySignal
            label='Pression'
            value={`${trip.latestTelemetry.pressureBar.toFixed(1)} bar`}
            hint={`-${trip.pressureDeltaBar.toFixed(1)} bar`}
            icon={Gauge}
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
    <div className='rounded-xl bg-muted/30 px-4 py-3 shadow-xs'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className='size-3.5' />
        {label}
      </div>
      <p className='mt-2 text-lg font-semibold'>{value}</p>
      <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
    </div>
  )
}
