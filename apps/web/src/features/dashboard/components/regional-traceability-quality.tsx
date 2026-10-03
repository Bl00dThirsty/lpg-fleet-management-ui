import { useMemo, useState } from 'react'
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Les 10 régions du Cameroun avec statistiques de performance de livraison GPL
const regionalTraceabilityStats = [
  { code: 'LT', name: 'Littoral', actualRate: 99.1, targetRate: 94, volumeTM: 642.8, deliveries: 420 },
  { code: 'CE', name: 'Centre', actualRate: 98.2, targetRate: 92, volumeTM: 485.2, deliveries: 315 },
  { code: 'OU', name: 'Ouest', actualRate: 95.8, targetRate: 90, volumeTM: 218.4, deliveries: 160 },
  { code: 'SU', name: 'Sud', actualRate: 94.2, targetRate: 90, volumeTM: 185.0, deliveries: 130 },
  { code: 'EN', name: 'Extrême-Nord', actualRate: 91.4, targetRate: 88, volumeTM: 142.1, deliveries: 95 },
  { code: 'NO', name: 'Nord', actualRate: 89.6, targetRate: 88, volumeTM: 112.3, deliveries: 80 },
  { code: 'AD', name: 'Adamaoua', actualRate: 88.5, targetRate: 88, volumeTM: 98.5, deliveries: 70 },
  { code: 'SW', name: 'Sud-Ouest', actualRate: 86.8, targetRate: 87, volumeTM: 124.6, deliveries: 85 },
  { code: 'ES', name: 'Est', actualRate: 84.0, targetRate: 85, volumeTM: 74.0, deliveries: 55 },
  { code: 'NW', name: 'Nord-Ouest', actualRate: 82.5, targetRate: 85, volumeTM: 68.2, deliveries: 50 },
]

type MetricKey = 'rate' | 'volume' | 'deliveries'

// Palette vibrante harmonisée avec le thème (Amber, Emerald, Sky, Indigo, Rose/Violet)
const THEME_PALETTE = [
  '#f59e0b', // Littoral - Amber LPG
  '#10b981', // Centre - Emerald
  '#0284c7', // Ouest - Sky Blue
  '#6366f1', // Sud - Indigo
  '#8b5cf6', // Autres Régions - Violet
]

export function RegionalTraceabilityQuality() {
  const [metric, setMetric] = useState<MetricKey>('rate')

  const totalVolume = useMemo(
    () => regionalTraceabilityStats.reduce((acc, r) => acc + r.volumeTM, 0),
    []
  )
  const totalDeliveries = useMemo(
    () => regionalTraceabilityStats.reduce((acc, r) => acc + r.deliveries, 0),
    []
  )

  const { chartData, centerLabel, centerValue, regionalCards } = useMemo(() => {
    const top4 = regionalTraceabilityStats.slice(0, 4)
    const others = regionalTraceabilityStats.slice(4)

    // Slices for Donut (Top 4 + Autres)
    let donutItems: Array<{
      name: string
      value: number
      formattedValue: string
      percentage: string
      color: string
    }>

    let cLabel: string
    let cValue: string

    if (metric === 'rate') {
      const othersAvg =
        Math.round(
          (others.reduce((acc, r) => acc + r.actualRate, 0) / others.length) * 10
        ) / 10
      const totalWeighted =
        Math.round(
          (regionalTraceabilityStats.reduce(
            (acc, r) => acc + r.actualRate * r.volumeTM,
            0
          ) /
            totalVolume) *
            10
        ) / 10

      donutItems = [
        ...top4.map((r, i) => ({
          name: r.name,
          value: r.actualRate,
          formattedValue: `${r.actualRate.toFixed(1)}%`,
          percentage: ((r.volumeTM / totalVolume) * 100).toFixed(1),
          color: THEME_PALETTE[i]!,
        })),
        {
          name: 'Autres Régions',
          value: othersAvg,
          formattedValue: `${othersAvg.toFixed(1)}%`,
          percentage: (
            (others.reduce((acc, x) => acc + x.volumeTM, 0) / totalVolume) *
            100
          ).toFixed(1),
          color: THEME_PALETTE[4]!,
        },
      ]

      cLabel = 'Taux Moyen'
      cValue = `${totalWeighted}%`
    } else if (metric === 'volume') {
      const othersVolume =
        Math.round(others.reduce((acc, r) => acc + r.volumeTM, 0) * 10) / 10

      donutItems = [
        ...top4.map((r, i) => ({
          name: r.name,
          value: r.volumeTM,
          formattedValue: `${r.volumeTM.toFixed(1)} TM`,
          percentage: ((r.volumeTM / totalVolume) * 100).toFixed(1),
          color: THEME_PALETTE[i]!,
        })),
        {
          name: 'Autres Régions',
          value: othersVolume,
          formattedValue: `${othersVolume.toFixed(1)} TM`,
          percentage: ((othersVolume / totalVolume) * 100).toFixed(1),
          color: THEME_PALETTE[4]!,
        },
      ]

      cLabel = 'Total'
      cValue = `${Math.round(totalVolume).toLocaleString('fr-FR')} TM`
    } else {
      const othersDeliveries = others.reduce((acc, r) => acc + r.deliveries, 0)

      donutItems = [
        ...top4.map((r, i) => ({
          name: r.name,
          value: r.deliveries,
          formattedValue: `${r.deliveries} bons`,
          percentage: ((r.deliveries / totalDeliveries) * 100).toFixed(1),
          color: THEME_PALETTE[i]!,
        })),
        {
          name: 'Autres Régions',
          value: othersDeliveries,
          formattedValue: `${othersDeliveries} bons`,
          percentage: ((othersDeliveries / totalDeliveries) * 100).toFixed(1),
          color: THEME_PALETTE[4]!,
        },
      ]

      cLabel = 'Total'
      cValue = `${totalDeliveries.toLocaleString('fr-FR')}`
    }

    // 10 Regional detail cards to fill the right side
    const cards = regionalTraceabilityStats.map((r, index) => {
      const color =
        index < 4
          ? THEME_PALETTE[index]!
          : '#64748b' // Slate for hinterland

      let mainDisplay: string
      let subDisplay: string
      let share: string

      if (metric === 'rate') {
        mainDisplay = `${r.actualRate.toFixed(1)}%`
        subDisplay = `Cible: ${r.targetRate}%`
        share = `${((r.volumeTM / totalVolume) * 100).toFixed(1)}%`
      } else if (metric === 'volume') {
        mainDisplay = `${r.volumeTM.toFixed(1)} TM`
        subDisplay = `${r.deliveries} livraisons`
        share = `${((r.volumeTM / totalVolume) * 100).toFixed(1)}%`
      } else {
        mainDisplay = `${r.deliveries} bons`
        subDisplay = `${r.volumeTM.toFixed(0)} TM tracées`
        share = `${((r.deliveries / totalDeliveries) * 100).toFixed(1)}%`
      }

      return {
        ...r,
        color,
        mainDisplay,
        subDisplay,
        share,
      }
    })

    return {
      chartData: donutItems,
      centerLabel: cLabel,
      centerValue: cValue,
      regionalCards: cards,
    }
  }, [metric, totalVolume, totalDeliveries])

  return (
    <Card className='h-full border border-border shadow-sm'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <div className='space-y-1'>
          <CardTitle className='font-manrope text-base font-semibold'>
            Qualité de livraison par région
          </CardTitle>
          <CardDescription className='text-xs text-muted-foreground'>
            Taux de conformité et traçabilité sur les 10 régions du Cameroun
          </CardDescription>
        </div>
        <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
          <SelectTrigger className='h-8 w-[170px] text-xs font-medium'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align='end'>
            <SelectItem value='rate' className='text-xs'>Taux de livraison (%)</SelectItem>
            <SelectItem value='volume' className='text-xs'>Volume livré (TM)</SelectItem>
            <SelectItem value='deliveries' className='text-xs'>Bons de livraison</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className='pt-2'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-12 items-center'>
          {/* Gauche : Donut Chart avec KPI au centre et pilules d'état */}
          <div className='lg:col-span-5 flex flex-col items-center justify-center gap-3'>
            <div className='relative flex items-center justify-center size-[210px] shrink-0'>
              <ResponsiveContainer width='100%' height={210}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey='value'
                    nameKey='name'
                    innerRadius={66}
                    outerRadius={92}
                    paddingAngle={4}
                    cornerRadius={5}
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor='middle'
                              dominantBaseline='middle'
                            >
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 10}
                                className='fill-muted-foreground text-xs font-medium'
                              >
                                {centerLabel}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 16}
                                className='fill-foreground text-2xl font-bold tracking-tight'
                              >
                                {centerValue}
                              </tspan>
                            </text>
                          )
                        }
                        return null
                      }}
                    />
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      const item = payload?.[0]?.payload
                      if (active && item) {
                        return (
                          <div className='rounded-md border border-border bg-popover p-2 text-xs shadow-md'>
                            <p className='font-semibold text-foreground'>{item.name}</p>
                            <p className='text-muted-foreground mt-0.5'>
                              {item.formattedValue} ({item.percentage}% du total)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className='flex flex-wrap items-center justify-center gap-2 text-xs'>
              <span className='rounded-md border border-border bg-muted/40 px-2.5 py-1 text-muted-foreground'>
                <strong className='text-foreground'>10/10</strong> Régions actives
              </span>
              <span className='rounded-md border border-border bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300'>
                <strong>94.9%</strong> Taux moyen national
              </span>
            </div>
          </div>

          {/* Droite : Grille complète des 10 régions sans vide blanc */}
          <div className='lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
            {regionalCards.map((r) => (
              <div
                key={r.code}
                className='flex flex-col justify-between rounded-md border border-border bg-card p-2.5 shadow-2xs hover:bg-muted/20 transition-colors'
              >
                <div className='flex items-center justify-between text-xs'>
                  <div className='flex items-center gap-1.5 min-w-0'>
                    <span
                      className='h-3 w-1 rounded-full shrink-0'
                      style={{ backgroundColor: r.color }}
                    />
                    <span className='font-semibold text-foreground truncate'>
                      {r.name}
                    </span>
                  </div>
                  <span className='font-bold text-foreground tabular-nums'>
                    {r.mainDisplay}
                  </span>
                </div>
                <div className='mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground'>
                  <span className='truncate'>{r.subDisplay}</span>
                  <span className='font-medium text-foreground/80 tabular-nums'>
                    {r.share}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
