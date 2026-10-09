import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { DeliveryTour } from '@lpg/types'
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
import {
  type DeliveryFlowRange,
  buildDeliveryFlowSeries,
} from '../data/delivery-flow'

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

export interface LpgDeliveryFlowProps {
  tours?: readonly DeliveryTour[]
}

export function LpgDeliveryFlow({ tours }: LpgDeliveryFlowProps) {
  const [timeRange, setTimeRange] = useState<DeliveryFlowRange>('last-12-months')

  const chartData = buildDeliveryFlowSeries(timeRange, new Date(2026, 9, 7), tours)

  const totalVracTM = Math.round(chartData.reduce((sum, item) => sum + item.vrac, 0))
  const totalBottlesTM = Math.round(chartData.reduce((sum, item) => sum + item.bottles50kg, 0))
  const totalVolumeTM = totalVracTM + totalBottlesTM

  const validationRate = 98
  const totalBonsCount = Math.round(totalVolumeTM / 2.24)
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
              onValueChange={(val: string) => setTimeRange(val as DeliveryFlowRange)}
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

              <ChartContainer
                config={deliveryFlowChartConfig}
                className='h-72 w-full'
              >
                <BarChart
                  data={chartData}
                  margin={{ left: 4, right: 8, top: 10, bottom: 0 }}
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
                  <YAxis
                    width={48}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => `${value} TM`}
                    className='text-xs'
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val, name) => [
                          `${Number(val).toLocaleString('fr-FR')} TM`,
                          name === 'vrac' ? 'GPL Vrac' : 'Bouteilles 50 kg',
                        ]}
                        labelFormatter={(label, payload) => {
                          const total = (payload ?? []).reduce(
                            (sum, item) => sum + Number(item.value ?? 0),
                            0
                          )
                          return `${label} · total ${total.toLocaleString('fr-FR')} TM`
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey='vrac'
                    name='vrac'
                    stackId='volume'
                    fill='url(#lpg-vrac-pattern)'
                    stroke='#f59e0b'
                    strokeOpacity={0.8}
                    strokeWidth={1}
                    maxBarSize={timeRange === 'last-12-months' ? 18 : 34}
                  />
                  <Bar
                    dataKey='bottles50kg'
                    name='bottles50kg'
                    stackId='volume'
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
                    {validationRate} % des livraisons certifiées sans écart de pesée ni litige.
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
