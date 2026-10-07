import { useMemo, useState } from 'react'
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
import {
  DELIVERY_CADENCE_DATA,
  buildCadenceRegions,
} from '../data/regional-stats'

const cadenceChartConfig = {
  volume: {
    color: '#059669', // Émeraude vive
    label: 'Volume (TM)',
  },
} satisfies ChartConfig

function DeliveryCadenceBarShape(props: BarShapeProps) {
  const { height, payload, width, x, y } = props
  const barPayload = payload as (typeof DELIVERY_CADENCE_DATA)[number] | undefined
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
  const {
    formattedTotalMonthVolume,
    rotatingActiveVolumeFormatted,
    topRegions,
    allRegions,
  } = useMemo(() => buildCadenceRegions(), [])

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
              {rotatingActiveVolumeFormatted}
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
            data={DELIVERY_CADENCE_DATA}
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
          {topRegions.map((region, idx) => {
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
                  {region.formattedVolume}
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
              {formattedTotalMonthVolume}
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
                {allRegions.map((region) => (
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
                        {region.formattedVolume}
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
