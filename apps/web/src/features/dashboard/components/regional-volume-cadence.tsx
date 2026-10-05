import { useState } from 'react'
import { Ellipsis } from 'lucide-react'
import { Bar, BarChart, type BarShapeProps, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// 30 jours de rotations et flux de livraison (fréquence sur 1 mois)
const deliveryCadenceData = [
  { day: 1, volume: 42 },
  { day: 2, volume: 55 },
  { day: 3, volume: 68 },
  { day: 4, volume: 74 },
  { day: 5, volume: 62 },
  { day: 6, volume: 20 },
  { day: 7, volume: 15 },
  { day: 8, volume: 58 },
  { day: 9, volume: 65 },
  { day: 10, volume: 70 },
  { day: 11, volume: 82 },
  { day: 12, volume: 78 },
  { day: 13, volume: 25 },
  { day: 14, volume: 18 },
  { day: 15, volume: 64 },
  { day: 16, volume: 72 },
  { day: 17, volume: 85 },
  { day: 18, volume: 90 },
  { day: 19, volume: 68 },
  { day: 20, volume: 22 },
  { day: 21, volume: 16 },
  { day: 22, volume: 60 },
  { day: 23, volume: 75 },
  { day: 24, volume: 88 },
  { day: 25, volume: 92 },
  { day: 26, volume: 80 },
  { day: 27, volume: 24 },
  { day: 28, volume: 19 },
  { day: 29, volume: 76 },
  { day: 30, volume: 84 },
]

// Les 10 régions du Cameroun avec volume livré mensuel (TM)
export const regionalMonthlyVolumeStats = [
  {
    code: 'LT',
    name: 'Littoral',
    volumeTM: 642.8,
    share: '29.9%',
    colorClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    code: 'CE',
    name: 'Centre',
    volumeTM: 485.2,
    share: '22.6%',
    colorClass:
      'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  {
    code: 'OU',
    name: 'Ouest',
    volumeTM: 218.4,
    share: '10.2%',
    colorClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  {
    code: 'SU',
    name: 'Sud',
    volumeTM: 185.0,
    share: '8.6%',
    colorClass:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  {
    code: 'EN',
    name: 'Extrême-Nord',
    volumeTM: 142.1,
    share: '6.6%',
    colorClass:
      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  },
  {
    code: 'SW',
    name: 'Sud-Ouest',
    volumeTM: 124.6,
    share: '5.8%',
    colorClass:
      'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  },
  {
    code: 'NO',
    name: 'Nord',
    volumeTM: 112.3,
    share: '5.2%',
    colorClass:
      'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  },
  {
    code: 'AD',
    name: 'Adamaoua',
    volumeTM: 98.5,
    share: '4.6%',
    colorClass:
      'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  },
  {
    code: 'ES',
    name: 'Est',
    volumeTM: 74.0,
    share: '3.4%',
    colorClass:
      'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  },
  {
    code: 'NW',
    name: 'Nord-Ouest',
    volumeTM: 68.2,
    share: '3.1%',
    colorClass:
      'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30',
  },
]

const topRegionsMonthly = regionalMonthlyVolumeStats.slice(0, 4)

const cadenceChartConfig = {
  volume: {
    color: '#059669', // Émeraude vive
    label: 'Volume (TM)',
  },
} satisfies ChartConfig

function DeliveryCadenceBarShape(props: BarShapeProps) {
  const { height, payload, width, x, y } = props
  const barPayload = payload as (typeof deliveryCadenceData)[number] | undefined
  const barHeightValue = Number(height)
  const barWidthValue = Number(width)
  const xValue = Number(x)
  const yValue = Number(y)
  const volume = barPayload?.volume ?? 0

  // Couleurs indicatives et dynamiques : dégradé émeraude et ligne de base ambre
  const fill = volume >= 75 ? '#059669' : '#10b981'
  const fillOpacity = volume >= 75 ? 0.95 : volume >= 40 ? 0.75 : 0.45
  const baselineFill = volume < 25 ? '#f59e0b' : '#059669'
  const baselineY = yValue + barHeightValue - 2
  const barGap = 3
  const barHeight = Math.max(0, barHeightValue - barGap)

  return (
    <g>
      <rect
        x={xValue}
        y={baselineY}
        width={barWidthValue}
        height={2}
        rx={1}
        fill={baselineFill}
        fillOpacity={0.9}
      />
      {volume > 0 && barHeight > 0 ? (
        <rect
          x={xValue}
          y={yValue}
          width={barWidthValue}
          height={barHeight}
          rx={2}
          fill={fill}
          fillOpacity={fillOpacity}
        />
      ) : null}
    </g>
  )
}

export function RegionalVolumeCadence() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const totalMonthVolumeTM = regionalMonthlyVolumeStats.reduce(
    (sum, r) => sum + r.volumeTM,
    0
  )

  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <div className='space-y-1'>
          <CardTitle className='font-manrope text-base font-semibold'>
            Fréquence & Volumes Livrés par Région (1 Mois)
          </CardTitle>
          <p className='text-xs text-muted-foreground'>
            Cadence de rotation en temps réel et répartition mensuelle (10
            régions).
          </p>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger className='inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none'>
              <Ellipsis className='size-4' />
              <span className='sr-only'>Actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem
                className='text-xs'
                onClick={() => setDialogOpen(true)}
              >
                Voir les 10 régions
              </DropdownMenuItem>
              <DropdownMenuItem className='text-xs'>
                Rapport de rotation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-col gap-4'>
        <div className='flex items-end justify-between'>
          <div className='flex items-baseline gap-1.5'>
            <span className='font-manrope text-3xl font-semibold tabular-nums leading-none tracking-tight'>
              58.4
            </span>
            <span className='text-xs text-muted-foreground'>
              TM en rotation active aujourd'hui
            </span>
          </div>
          <div className='flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300'>
            <span className='relative flex size-2'>
              <span className='absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75' />
              <span className='relative inline-flex size-2 rounded-full bg-emerald-500' />
            </span>
            <span className='font-medium'>Direct Flotte</span>
          </div>
        </div>

        {/* Histogramme de cadence de livraison en temps réel */}
        <ChartContainer config={cadenceChartConfig} className='h-36 w-full'>
          <BarChart
            data={deliveryCadenceData}
            margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
            barCategoryGap={2}
          >
            <XAxis dataKey='day' hide />
            <YAxis hide domain={[0, 100]} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(val, _name, item) => [
                    `${val} TM livrées`,
                    `Jour ${(item.payload as { day: string | number }).day}`,
                  ]}
                />
              }
            />
            <Bar
              dataKey='volume'
              fill='var(--color-volume)'
              shape={DeliveryCadenceBarShape}
            />
          </BarChart>
        </ChartContainer>

        {/* Grille 2x2 des volumes régionaux avec badges d'identifiants (CE, LT, OU, EN) */}
        <div className='grid grid-cols-2 rounded-lg border border-border/50 bg-muted/10'>
          {topRegionsMonthly.map((region, idx) => {
            const isLeft = idx % 2 === 0
            const isTop = idx < 2
            return (
              <div
                key={region.code}
                className={`flex items-center gap-3 p-3 ${
                  isLeft ? 'border-r border-border/50' : ''
                } ${isTop ? 'border-b border-border/50' : ''}`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${region.colorClass}`}
                >
                  {region.code}
                </span>
                <div className='min-w-0 flex-1 truncate'>
                  <p className='truncate text-xs font-medium text-foreground'>
                    {region.name}
                  </p>
                  <p className='text-[10px] text-muted-foreground'>
                    {region.share} du volume
                  </p>
                </div>
                <span className='font-manrope text-xs font-semibold tabular-nums text-foreground'>
                  {region.volumeTM.toLocaleString('fr-FR')} TM
                </span>
              </div>
            )
          })}
        </div>

        {/* Accès modal aux 10 régions du Cameroun */}
        <div className='flex items-center justify-between pt-1'>
          <span className='text-xs text-muted-foreground'>
            Total 10 régions :{' '}
            <strong className='text-foreground'>
              {totalMonthVolumeTM.toLocaleString('fr-FR')} TM
            </strong>
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs font-medium text-primary hover:bg-primary/10'
              >
                Voir les 10 régions →
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <DialogTitle className='font-manrope text-base'>
                  Répartition des Volumes Livrés par Région (1 Mois)
                </DialogTitle>
              </DialogHeader>
              <div className='space-y-2 max-h-[60vh] overflow-y-auto pr-1'>
                {regionalMonthlyVolumeStats.map((region) => (
                  <div
                    key={region.code}
                    className='flex items-center justify-between rounded-lg border border-border/60 bg-card p-2.5 text-xs'
                  >
                    <div className='flex items-center gap-2.5'>
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${region.colorClass}`}
                      >
                        {region.code}
                      </span>
                      <div>
                        <p className='font-medium text-foreground'>
                          {region.name}
                        </p>
                        <p className='text-[10px] text-muted-foreground'>
                          Part : {region.share}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <span className='font-semibold text-foreground tabular-nums'>
                        {region.volumeTM.toLocaleString('fr-FR')} TM
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
