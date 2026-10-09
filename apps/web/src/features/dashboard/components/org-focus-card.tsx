import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { StatusDistribution } from '@/components/charts/status-distribution'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { Role } from '@/config/rbac/roles'
import { formatTm } from '@/features/map/utils/format'


const MARKETEUR_SITES = [
  { name: 'Complexe Bonabéri', volumeTM: 96.4 },
  { name: 'Cuverie Wouri Est', volumeTM: 78.2 },
  { name: 'Dépôt Bonamoussadi', volumeTM: 64.9 },
  { name: 'Site Nylon Messa', volumeTM: 51.3 },
]

const sitesChartConfig = {
  volume: {
    label: 'Volume livré (TM)',
    color: '#10b981',
  },
} satisfies ChartConfig

const fleetChartConfig = {
  'en-tournee': { label: 'En tournée', color: '#059669' },
  'a-quai': { label: 'À quai', color: '#f59e0b' },
  'hors-ligne': { label: 'Hors ligne', color: '#64748b' },
} satisfies ChartConfig

import { useMemo } from 'react'
import type { DeliveryTour } from '@lpg/types'

type OrgFocusCardProps = {
  role: Role
  activeTrucks?: number
  totalTrucks?: number
  tours?: readonly DeliveryTour[]
}

function MarketeurTopSites({ tours }: { tours?: readonly DeliveryTour[] }) {
  const dynamicSites = useMemo(() => {
    if (!tours || tours.length === 0) return MARKETEUR_SITES
    const siteMap = new Map<string, number>()
    for (const t of tours) {
      const q = Math.max(0, t.delivered_quantity ?? t.requested_quantity ?? 0)
      const tm = t.type === 'VRAC' ? q : q / 20
      if (t.checkpoints && t.checkpoints.length > 0) {
        for (const cp of t.checkpoints) {
          const namedCp = cp as { site_name?: string; name?: string; site_id?: string }
          const name = namedCp.site_name ?? namedCp.name ?? namedCp.site_id ?? 'Site client'
          siteMap.set(name, (siteMap.get(name) ?? 0) + tm)
        }
      } else {
        const name = t.destination_site_id ?? t.source_site_id ?? 'Site de destination'
        siteMap.set(name, (siteMap.get(name) ?? 0) + tm)
      }
    }
    const entries = Array.from(siteMap.entries()).map(([name, volumeTM]) => ({
      name,
      volumeTM: Math.round(volumeTM * 10) / 10,
    })).sort((a, b) => b.volumeTM - a.volumeTM).slice(0, 5)

    return entries.length > 0 ? entries : MARKETEUR_SITES
  }, [tours])

  const topVolume = Math.round(dynamicSites.reduce((sum, site) => sum + site.volumeTM, 0) * 10) / 10
  const totalPeriod = Math.max(topVolume, 1)
  const share = Math.min(100, Math.round((topVolume / totalPeriod) * 100))

  return (
    <>
      <ChartContainer config={sitesChartConfig} className='h-56 w-full'>
        <BarChart
          data={dynamicSites}
          layout='vertical'
          margin={{ left: 4, right: 16, top: 4, bottom: 0 }}
          accessibilityLayer
        >
          <XAxis type='number' hide />
          <YAxis
            type='category'
            dataKey='name'
            tickLine={false}
            axisLine={false}
            width={140}
            className='text-xs'
          />
          <ChartTooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={
              <ChartTooltipContent
                formatter={(value) => [
                  formatTm(Number(value)),
                  'Volume livré',
                ]}
              />
            }
          />
          <Bar
            dataKey='volumeTM'
            fill='var(--color-volume)'
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ChartContainer>
      <div className='flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground'>
        <span>
          Top 5 :{' '}
          <strong className='text-foreground'>
            {formatTm(topVolume)}
          </strong>{' '}
          livrés
        </span>
        <span>{share} % du volume livré sur la période</span>
      </div>
    </>
  )
}

function TransporteurFleetStatus({ activeTrucks, totalTrucks }: OrgFocusCardProps) {
  const total = totalTrucks ?? 18
  const onTour = Math.min(activeTrucks ?? 12, total)
  const offline = Math.max(Math.min(2, total - onTour), 0)
  const atDock = Math.max(total - onTour - offline, 0)

  const data = [
    { key: 'en-tournee', label: 'En tournée', value: onTour },
    { key: 'a-quai', label: 'À quai', value: atDock },
    { key: 'hors-ligne', label: 'Hors ligne', value: offline },
  ].filter((item) => item.value > 0)

  return (
    <>
      <StatusDistribution data={data} config={fleetChartConfig} height={220} />
      <div className='flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground'>
        <span>
          <strong className='text-foreground'>{onTour}</strong> en tournée
        </span>
        <span>
          <strong className='text-foreground'>{atDock}</strong> à quai
        </span>
        <span>
          <strong className='text-foreground'>{offline}</strong> hors ligne
        </span>
        <span>
          <strong className='text-foreground'>{total}</strong> camions
        </span>
      </div>
    </>
  )
}

export function OrgFocusCard(props: OrgFocusCardProps) {
  const isMarketeur = props.role === 'MARKETEUR'

  return (
    <Card className='h-full border border-border shadow-sm'>
      <CardHeader className='pb-3'>
        <div className='space-y-1'>
          <CardTitle className='font-manrope text-base font-semibold'>
            {isMarketeur
              ? 'Mes sites clients les plus livrés'
              : 'État de ma flotte'}
          </CardTitle>
          <CardDescription className='text-xs text-muted-foreground'>
            {isMarketeur
              ? 'Top 5 des sites par volume livré (1 mois).'
              : 'Répartition des camions par statut.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='flex flex-col gap-3'>
        {isMarketeur ? <MarketeurTopSites tours={props.tours} /> : <TransporteurFleetStatus {...props} />}
      </CardContent>
    </Card>
  )
}
