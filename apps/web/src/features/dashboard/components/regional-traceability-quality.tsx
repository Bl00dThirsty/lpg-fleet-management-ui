import { Ellipsis } from 'lucide-react'
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Les 10 régions du Cameroun avec statistiques de performance de livraison GPL
export const regionalTraceabilityStats = [
  { code: 'AD', name: 'Adamaoua', actualRate: 88.5, targetRate: 88, volumeTM: 98.5 },
  { code: 'CE', name: 'Centre', actualRate: 98.2, targetRate: 92, volumeTM: 485.2 },
  { code: 'ES', name: 'Est', actualRate: 84.0, targetRate: 85, volumeTM: 74.0 },
  { code: 'EN', name: 'Extrême-Nord', actualRate: 91.4, targetRate: 88, volumeTM: 142.1 },
  { code: 'LT', name: 'Littoral', actualRate: 99.1, targetRate: 94, volumeTM: 642.8 },
  { code: 'NO', name: 'Nord', actualRate: 89.6, targetRate: 88, volumeTM: 112.3 },
  { code: 'NW', name: 'Nord-Ouest', actualRate: 82.5, targetRate: 85, volumeTM: 68.2 },
  { code: 'OU', name: 'Ouest', actualRate: 95.8, targetRate: 90, volumeTM: 218.4 },
  { code: 'SU', name: 'Sud', actualRate: 94.2, targetRate: 90, volumeTM: 185.0 },
  { code: 'SW', name: 'Sud-Ouest', actualRate: 86.8, targetRate: 87, volumeTM: 124.6 },
]

const regionalQualityChartConfig = {
  actualRate: {
    color: '#10b981', // Émeraude vive
    label: 'Taux Réalisé (%)',
  },
  targetRate: {
    color: '#6366f1', // Indigo vif
    label: 'Objectif Quota (%)',
  },
} satisfies ChartConfig

export function RegionalTraceabilityQuality() {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <div className='space-y-1'>
          <CardTitle className='font-manrope text-base font-semibold'>
            Qualité de Traçabilité des Livraisons par Région
          </CardTitle>
          <p className='text-xs text-muted-foreground'>
            Taux de livraison effectif et conformité de pesée sur les 10 régions du Cameroun.
          </p>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger className='inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none'>
              <Ellipsis className='size-4' />
              <span className='sr-only'>Actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem className='text-xs'>
                Exporter la conformité régionale
              </DropdownMenuItem>
              <DropdownMenuItem className='text-xs'>
                Voir les alertes régionales
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className='mb-3 flex items-center justify-end gap-5 text-xs'>
          <div className='flex items-center gap-1.5'>
            <span className='size-2.5 rounded-full bg-emerald-500' />
            <span className='font-medium text-muted-foreground'>Taux réalisé (%)</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='h-0.5 w-3.5 border-t-2 border-dashed border-indigo-500' />
            <span className='font-medium text-muted-foreground'>Objectif réglementaire (%)</span>
          </div>
        </div>

        <ChartContainer config={regionalQualityChartConfig} className='h-68 w-full'>
          <ComposedChart
            data={regionalTraceabilityStats}
            margin={{ bottom: 5, left: -10, right: 10, top: 10 }}
          >
            <CartesianGrid vertical={false} strokeDasharray='3 3' className='stroke-border/40' />
            <XAxis
              dataKey='code'
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              className='font-semibold text-xs'
              tickFormatter={(code) => code}
            />
            <YAxis
              axisLine={false}
              domain={[70, 100]}
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              tickMargin={8}
              width={42}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className='w-52'
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload
                    return item ? `${item.name} (${item.code})` : ''
                  }}
                  formatter={(value, name) => [
                    `${value}%`,
                    name === 'actualRate' ? 'Taux réalisé' : 'Objectif CSPH',
                  ]}
                />
              }
            />
            <Line
              dataKey='targetRate'
              dot={false}
              stroke='#6366f1'
              strokeOpacity={0.85}
              strokeDasharray='4 4'
              strokeWidth={2}
              type='monotone'
            />
            <Line
              dataKey='actualRate'
              dot={{ r: 3, fill: '#10b981', strokeWidth: 1.5, stroke: '#fff' }}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              stroke='#10b981'
              strokeWidth={2.75}
              type='monotone'
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
