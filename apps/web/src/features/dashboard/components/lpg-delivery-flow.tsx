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

const monthlyDeliveryTonnage = [142, 168, 155, 189, 210, 245, 230, 215, 260, 248, 235, 272] as const
const quarterlyDeliveryTonnage = [510, 644, 705, 755] as const
const recent30DaysDeliveryTonnage = [48, 52, 58, 62] as const

const deliveryFlowChartConfig = {
  delivered: {
    label: 'Volume Livré (TM)',
    color: 'var(--chart-1, #0f766e)',
  },
} satisfies ChartConfig

const axisMonthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
const tooltipMonthFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
})

function getRollingMonthDeliveryData(values: readonly number[]) {
  return values.map((delivered, index) => {
    const date = new Date(2026, 3, 1) // Référence avril 2026
    date.setMonth(date.getMonth() - (values.length - 1 - index))

    return {
      date: date.toISOString(),
      delivered,
    }
  })
}

export function LpgDeliveryFlow() {
  const [timeRange, setTimeRange] = useState<'last-30-days' | 'last-quarter' | 'last-12-months'>(
    'last-12-months'
  )

  const activeValues =
    timeRange === 'last-30-days'
      ? recent30DaysDeliveryTonnage
      : timeRange === 'last-quarter'
        ? quarterlyDeliveryTonnage
        : monthlyDeliveryTonnage

  const chartData = getRollingMonthDeliveryData(activeValues)
  const totalVolumeTM = chartData.reduce((sum, item) => sum + item.delivered, 0)
  const validationRate = 96
  const validBonsCount = Math.round((totalVolumeTM / 2.2) * (validationRate / 100))
  const totalBonsCount = Math.round(totalVolumeTM / 2.2)

  // Vrac ~65%, Bouteilles 50kg ~35%
  const vracTM = Math.round(totalVolumeTM * 0.65)
  const bottlesTM = Math.round(totalVolumeTM * 0.35)

  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-12'>
      <Card className='xl:col-span-12'>
        <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle className='font-manrope text-lg font-semibold'>
              Flux des Livraisons Hors Réseau (Vrac & 50 kg)
            </CardTitle>
            <p className='text-xs text-muted-foreground'>
              Traçabilité des chargements, volumes livrés et acquittements sur sites industriels.
            </p>
          </div>
          <CardAction>
            <Select
              value={timeRange}
              onValueChange={(val: any) => setTimeRange(val)}
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
            <ChartContainer
              config={deliveryFlowChartConfig}
              className='h-72 w-full lg:col-span-8'
            >
              <BarChart
                data={chartData}
                margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                barSize={36}
              >
                <defs>
                  <pattern
                    id='lpg-delivery-pattern'
                    width='6'
                    height='6'
                    patternUnits='userSpaceOnUse'
                    patternTransform='rotate(45)'
                  >
                    <rect
                      width='6'
                      height='6'
                      fill='var(--color-delivered, #0f766e)'
                      fillOpacity='0.16'
                    />
                    <line
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='6'
                      stroke='var(--color-delivered, #0f766e)'
                      strokeWidth='1.5'
                      strokeOpacity='0.55'
                    />
                  </pattern>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray='3 3' className='stroke-border/40' />
                <XAxis
                  dataKey='date'
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    axisMonthFormatter.format(new Date(String(value)))
                  }
                />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideIndicator
                      labelFormatter={(value) =>
                        tooltipMonthFormatter.format(new Date(String(value)))
                      }
                      formatter={(val) => [
                        `${Number(val).toLocaleString('fr-FR')} TM`,
                        'Volume tracé',
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey='delivered'
                  fill='url(#lpg-delivery-pattern)'
                  radius={[8, 8, 0, 0]}
                  stroke='var(--color-delivered, #0f766e)'
                  strokeOpacity={0.7}
                  strokeWidth={1}
                />
              </BarChart>
            </ChartContainer>

            <div className='flex flex-col justify-between gap-5 rounded-xl bg-muted/20 p-4 lg:col-span-4'>
              <div className='flex flex-col gap-1'>
                <div className='font-manrope text-3xl font-semibold tabular-nums leading-none tracking-tight'>
                  {totalVolumeTM.toLocaleString('fr-FR')}{' '}
                  <span className='text-base font-normal text-muted-foreground'>
                    TM livrées
                  </span>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Volume total de gaz GPL réceptionné auprès des entreprises sur la période.
                </p>
              </div>

              <div className='flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-3.5 shadow-2xs'>
                <div className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
                  Acquittements & Bons Conformes
                </div>

                <div className='flex flex-col gap-1'>
                  <div className='font-manrope text-2xl font-semibold tabular-nums leading-none'>
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

                <div className='mt-1 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground'>
                  <span>
                    Vrac : <strong className='text-foreground'>{vracTM.toLocaleString('fr-FR')} TM</strong>
                  </span>
                  <span>•</span>
                  <span>
                    50kg : <strong className='text-foreground'>{bottlesTM.toLocaleString('fr-FR')} TM</strong>
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
