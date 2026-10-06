import { ArrowDownRight, ArrowUpRight, Ellipsis } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatTm } from '@/features/map/utils/format'

export interface LpgKpiStripProps {
  totalDeliveredTM?: number
  totalTransportedTM?: number
  activeTrips?: number
  activeTrucks?: number
  totalTrucks?: number
  scdpReserveTM?: number
  scdpCapacityTM?: number
  snhReserveTM?: number
  snhCapacityTM?: number
}

export function LpgKpiStrip({
  totalDeliveredTM = 2338.5,
  totalTransportedTM = 2480.0,
  scdpReserveTM = 70.6,
  scdpCapacityTM = 110.0,
  snhReserveTM = 48.0,
  snhCapacityTM = 60.0,
}: LpgKpiStripProps) {
  // Gaz hors réseau : Vrac (~65%) et Bouteilles de 50 kg (~35%)
  const vracVolumeTM = totalDeliveredTM > 0 ? totalDeliveredTM * 0.65 : 1428.5
  const bottlesVolumeTM = totalDeliveredTM > 0 ? totalDeliveredTM * 0.35 : 785.0
  // Conversion physique stricte : 1 TM = 1000 kg = 20 bouteilles de 50 kg
  const bottles50kgCount = Math.round(bottlesVolumeTM * 20)

  const scdpFillRate = Math.round((scdpReserveTM / Math.max(scdpCapacityTM, 1)) * 100)
  const snhFillRate = Math.round((snhReserveTM / Math.max(snhCapacityTM, 1)) * 100)

  const kpis = [
    {
      id: 'vrac',
      title: 'Volume GPL Vrac Suivi',
      value: formatTm(vracVolumeTM),
      delta: '4.8%',
      isPositive: true,
      baseline: '1 362,8 TM',
      period: totalTransportedTM > 0 ? `${formatTm(vracVolumeTM)} livrés / ${formatTm(totalTransportedTM * 0.65)}` : '30 derniers jours',
      note: 'Cuves industrielles & gros consommateurs',
    },
    {
      id: 'bouteilles50kg',
      title: 'Bouteilles 50 kg Traçables',
      value: `${(bottles50kgCount / 1000).toFixed(1)}k btl`,
      delta: '3.2%',
      isPositive: true,
      baseline: '24,1k btl',
      period: `${formatTm(bottlesVolumeTM)} équiv. (1 TM = 20 btl)`,
      note: `${bottles50kgCount.toLocaleString('fr-FR')} unités sous scellés`,
    },
    {
      id: 'scdp',
      title: 'Réserves GPL SCDP',
      value: formatTm(scdpReserveTM),
      delta: `${scdpFillRate}%`,
      isPositive: scdpFillRate >= 40,
      baseline: `${formatTm(scdpCapacityTM)} nominal`,
      period: 'Dépôts Bonabéri, Kribi, Yaoundé',
      note: 'Stock relais & sécurité d’approvisionnement',
    },
    {
      id: 'snh',
      title: 'Disponibilité GPL SNH',
      value: formatTm(snhReserveTM),
      delta: `${snhFillRate}%`,
      isPositive: snhFillRate >= 40,
      baseline: `${formatTm(snhCapacityTM)} nominal`,
      period: 'Terminal amont Bipaga (Kribi)',
      note: 'Extraction gazière & chargement direct',
    },
    {
      id: 'conformite',
      title: 'Conformité Traçabilité',
      value: '98.6%',
      delta: '0.9%',
      isPositive: true,
      baseline: '97.7%',
      period: 'écarts de pesée < 0.5%',
      note: 'Scans RFID & réconciliations',
    },
  ]

  return (
    <div className='overflow-hidden rounded-xl border bg-card shadow-xs ring-1 ring-foreground/10'>
      <div className='grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:border-0 *:data-[slot=card]:shadow-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5'>
        {kpis.map((kpi) => (
          <Card key={kpi.id} className='transition-colors hover:bg-muted/15'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-normal text-muted-foreground'>
                {kpi.title}
              </CardTitle>
              <CardAction>
                <DropdownMenu>
                  <DropdownMenuTrigger className='inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none'>
                    <Ellipsis className='size-4' />
                    <span className='sr-only'>Actions pour {kpi.title}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuItem className='text-xs'>
                      Voir le détail des livraisons
                    </DropdownMenuItem>
                    <DropdownMenuItem className='text-xs'>
                      Exporter les données
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardAction>
            </CardHeader>
            <CardContent className='flex flex-col gap-3 pt-0'>
              <div className='flex items-center justify-between gap-4'>
                <div className='font-manrope text-2xl font-semibold leading-none tracking-tight text-foreground'>
                  {kpi.value}
                </div>
                <Badge
                  className={
                    kpi.isPositive
                      ? 'border-transparent bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'border-transparent bg-destructive/10 text-destructive'
                  }
                >
                  {kpi.isPositive ? (
                    <ArrowUpRight className='mr-0.5 size-3.5' />
                  ) : (
                    <ArrowDownRight className='mr-0.5 size-3.5' />
                  )}
                  {kpi.delta}
                </Badge>
              </div>

              <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                <span>
                  from <span className='font-medium text-foreground'>{kpi.baseline}</span>
                </span>
                <span>•</span>
                <span>{kpi.period}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
