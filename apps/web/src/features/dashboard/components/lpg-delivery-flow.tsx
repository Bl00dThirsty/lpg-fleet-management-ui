import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const monthlyBreakdown = [
  { monthOffset: 11, vrac: 92, bottles50kg: 50 },  // mai (total 142)
  { monthOffset: 10, vrac: 110, bottles50kg: 58 }, // juin (total 168)
  { monthOffset: 9,  vrac: 100, bottles50kg: 55 }, // juil (total 155)
  { monthOffset: 8,  vrac: 124, bottles50kg: 65 }, // août (total 189)
  { monthOffset: 7,  vrac: 138, bottles50kg: 72 }, // sept (total 210)
  { monthOffset: 6,  vrac: 162, bottles50kg: 83 }, // oct (total 245)
  { monthOffset: 5,  vrac: 152, bottles50kg: 78 }, // nov (total 230)
  { monthOffset: 4,  vrac: 142, bottles50kg: 73 }, // déc (total 215)
  { monthOffset: 3,  vrac: 172, bottles50kg: 88 }, // janv (total 260)
  { monthOffset: 2,  vrac: 164, bottles50kg: 84 }, // févr (total 248)
  { monthOffset: 1,  vrac: 155, bottles50kg: 80 }, // mars (total 235)
  { monthOffset: 0,  vrac: 180, bottles50kg: 92 }, // avr (total 272)
]

const quarterlyBreakdown = [
  { label: 'T2 2025', vrac: 330, bottles50kg: 180 },
  { label: 'T3 2025', vrac: 420, bottles50kg: 224 },
  { label: 'T4 2025', vrac: 460, bottles50kg: 245 },
  { label: 'T1 2026', vrac: 495, bottles50kg: 260 },
]

const recent30DaysBreakdown = [
  { label: 'Sem 1', vrac: 32, bottles50kg: 16 },
  { label: 'Sem 2', vrac: 34, bottles50kg: 18 },
  { label: 'Sem 3', vrac: 38, bottles50kg: 20 },
  { label: 'Sem 4', vrac: 41, bottles50kg: 21 },
]

const deliveryFlowChartConfig = {
  vrac: {
    label: 'GPL Vrac (TM)',
    color: '#f59e0b',
  },
  bottles50kg: {
    label: 'Bouteilles 50 kg (TM)',
    color: '#10b981',
  },
} satisfies ChartConfig

const axisMonthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

export function LpgDeliveryFlow() {
  const [timeRange, setTimeRange] = useState<'last-30-days' | 'last-quarter' | 'last-12-months'>(
    'last-12-months'
  )

  let chartData: Array<{ label: string; vrac: number; bottles50kg: number; total: number }>

  if (timeRange === 'last-30-days') {
    chartData = recent30DaysBreakdown.map((item) => ({
      ...item,
      total: item.vrac + item.bottles50kg,
    }))
  } else if (timeRange === 'last-quarter') {
    chartData = quarterlyBreakdown.map((item) => ({
      ...item,
      total: item.vrac + item.bottles50kg,
    }))
  } else {
    chartData = monthlyBreakdown.map((item) => {
      const date = new Date(2026, 3, 1) // Référence avril 2026
      date.setMonth(date.getMonth() - item.monthOffset)
      return {
        label: axisMonthFormatter.format(date),
        vrac: item.vrac,
        bottles50kg: item.bottles50kg,
        total: item.vrac + item.bottles50kg,
      }
    })
  }

  const totalVracTM = chartData.reduce((sum, item) => sum + item.vrac, 0)
  const totalBottlesTM = chartData.reduce((sum, item) => sum + item.bottles50kg, 0)
  const totalVolumeTM = totalVracTM + totalBottlesTM

  const validationRate = 96
  const totalBonsCount = Math.round(totalVolumeTM / 2.2)
  const validBonsCount = Math.round(totalBonsCount * (validationRate / 100))

  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-12'>
      <Card className='xl:col-span-12 border border-border shadow-sm'>
        <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3'>
          <div>
            <CardTitle className='font-manrope text-lg font-semibold'>
              Flux des Livraisons Hors Réseau (Vrac & 50 kg)
            </CardTitle>
            <p className='text-xs text-muted-foreground'>
              Traçabilité comparée des chargements GPL vrac et bouteilles 50 kg sur sites industriels.
            </p>
          </div>
          <CardAction>
            <Select
              value={timeRange}
              onValueChange={(val: string) => setTimeRange(val as 'last-30-days' | 'last-quarter' | 'last-12-months')}
            >
              <SelectTrigger size='sm' className='min-w-40'>
                <SelectValue placeholder='Sélectionner la période' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value='last-30-days'>30 derniers jours</SelectItem>
                  <SelectItem value='last-quarter'>Dernier trimestre</SelectItem>
                  <SelectItem value='last-12-months'>12 derniers mois</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>

        <CardContent>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
            <div className='lg:col-span-8 flex flex-col justify-between'>
              {/* Legend bar */}
              <div className='mb-3 flex items-center justify-end gap-5 text-xs'>
                <div className='flex items-center gap-2'>
                  <span
                    className='size-3 rounded-xs border border-amber-500 bg-amber-500/20'
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 1.5px, transparent 1.5px, transparent 4px)',
                    }}
                  />
                  <span className='font-medium text-foreground'>GPL Vrac (TM)</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span
                    className='size-3 rounded-xs border border-emerald-500 bg-emerald-500/20'
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, #10b981, #10b981 1.5px, transparent 1.5px, transparent 4px)',
                    }}
                  />
                  <span className='font-medium text-foreground'>Bouteilles 50 kg (TM)</span>
                </div>
              </div>

              {/* Multiple Grouped Bar Chart with Striped / Rayures Pattern */}
              <ChartContainer
                config={deliveryFlowChartConfig}
                className='h-72 w-full'
              >
                <BarChart
                  data={chartData}
                  margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                  barGap={3}
                >
                  <defs>
                    <pattern
                      id='lpg-vrac-pattern'
                      width='6'
                      height='6'
                      patternUnits='userSpaceOnUse'
                      patternTransform='rotate(45)'
                    >
                      <rect
                        width='6'
                        height='6'
                        fill='#f59e0b'
                        fillOpacity='0.16'
                      />
                      <line
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='6'
                        stroke='#f59e0b'
                        strokeWidth='1.5'
                        strokeOpacity='0.65'
                      />
                    </pattern>

                    <pattern
                      id='lpg-bottles-pattern'
                      width='6'
                      height='6'
                      patternUnits='userSpaceOnUse'
                      patternTransform='rotate(45)'
                    >
                      <rect
                        width='6'
                        height='6'
                        fill='#10b981'
                        fillOpacity='0.16'
                      />
                      <line
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='6'
                        stroke='#10b981'
                        strokeWidth='1.5'
                        strokeOpacity='0.65'
                      />
                    </pattern>
                  </defs>

                  <CartesianGrid vertical={false} strokeDasharray='3 3' className='stroke-border/40' />
                  <XAxis
                    dataKey='label'
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    className='text-xs font-medium'
                  />
                  <YAxis hide />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val, name) => [
                          `${Number(val).toLocaleString('fr-FR')} TM`,
                          name === 'vrac' ? 'GPL Vrac' : 'Bouteilles 50 kg',
                        ]}
                      />
                    }
                  />
                  <Bar
                    dataKey='vrac'
                    name='vrac'
                    fill='url(#lpg-vrac-pattern)'
                    stroke='#f59e0b'
                    strokeOpacity={0.8}
                    strokeWidth={1}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={timeRange === 'last-12-months' ? 18 : 34}
                  />
                  <Bar
                    dataKey='bottles50kg'
                    name='bottles50kg'
                    fill='url(#lpg-bottles-pattern)'
                    stroke='#10b981'
                    strokeOpacity={0.8}
                    strokeWidth={1}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={timeRange === 'last-12-months' ? 18 : 34}
                  />
                </BarChart>
              </ChartContainer>
            </div>

            <div className='flex flex-col justify-between gap-5 rounded-lg border border-border bg-card p-4 lg:col-span-4 shadow-xs'>
              <div className='flex flex-col gap-1'>
                <div className='font-manrope text-3xl font-bold tabular-nums leading-none tracking-tight'>
                  {totalVolumeTM.toLocaleString('fr-FR')}{' '}
                  <span className='text-base font-normal text-muted-foreground'>
                    TM livrées
                  </span>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Volume total de gaz GPL réceptionné auprès des entreprises sur la période.
                </p>
              </div>

              <div className='flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/30 p-3.5 shadow-2xs'>
                <div className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
                  Acquittements & Bons Conformes
                </div>

                <div className='flex flex-col gap-1'>
                  <div className='font-manrope text-2xl font-bold tabular-nums leading-none'>
                    {validBonsCount.toLocaleString('fr-FR')}{' '}
                    <span className='text-xs font-normal text-muted-foreground'>
                      bons validés
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {validationRate}% des livraisons certifiées sans écart de pesée ni litige.
                  </p>
                </div>

                <div className='flex flex-col gap-2 pt-1'>
                  <Progress
                    value={validationRate}
                    className='h-2.5 bg-emerald-500/15 *:data-[slot=progress-indicator]:bg-emerald-600'
                  />
                  <div className='flex items-center justify-between text-xs'>
                    <div className='font-medium text-emerald-600 dark:text-emerald-400 tabular-nums'>
                      {validBonsCount.toLocaleString('fr-FR')} conformes
                    </div>
                    <div className='text-muted-foreground tabular-nums'>
                      {totalBonsCount.toLocaleString('fr-FR')} total
                    </div>
                  </div>
                </div>

                <div className='mt-1 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1.5'>
                    <span
                      className='size-2.5 rounded-xs border border-amber-500 bg-amber-500/20 shrink-0'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 1px, transparent 1px, transparent 3px)',
                      }}
                    />
                    Vrac : <strong className='text-foreground'>{totalVracTM.toLocaleString('fr-FR')} TM</strong>
                  </span>
                  <span>•</span>
                  <span className='flex items-center gap-1.5'>
                    <span
                      className='size-2.5 rounded-xs border border-emerald-500 bg-emerald-500/20 shrink-0'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, #10b981, #10b981 1px, transparent 1px, transparent 3px)',
                      }}
                    />
                    50kg : <strong className='text-foreground'>{totalBottlesTM.toLocaleString('fr-FR')} TM</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
