import { type ElementType } from 'react'
import { ArrowRight, Gauge, MapPinned, Package, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  buildRouteLpgVariation,
  type RouteLpgVariationStage,
  type RouteTripView,
} from '../data/tour-activity'

type TourLpgVariationPanelProps = {
  trip: RouteTripView
  formatQuantity: (value: number) => string
  zeroUnit?: string
}

const toneClasses = {
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    line: 'bg-emerald-500',
  },
  sky: {
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    line: 'bg-sky-500',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    line: 'bg-amber-500',
  },
} as const

export function TourLpgVariationPanel({
  trip,
  formatQuantity,
  zeroUnit = '0 TM',
}: TourLpgVariationPanelProps) {
  const variation = buildRouteLpgVariation(trip)
  const [loadingStage, liveStage, projectedStage] = variation.stages as [RouteLpgVariationStage, RouteLpgVariationStage, RouteLpgVariationStage]

  return (
    <Card className='overflow-hidden border-transparent shadow-sm'>
      <CardHeader className='border-b bg-muted/20'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <CardTitle>Variation GPL sur la tournée</CardTitle>
            <CardDescription>
              Comparaison du niveau au chargement, du dernier niveau relevé et
              de la projection après la prochaine livraison.
            </CardDescription>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Badge
              variant='outline'
              className='gap-1 border-transparent bg-background/70'
            >
              <Truck className='size-3.5' />
              {trip.truck.id}
            </Badge>
            <Badge
              variant='outline'
              className='gap-1 border-transparent bg-background/70'
            >
              <MapPinned className='size-3.5' />
              {trip.originSite.city} - {trip.destinationSite.city}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4 p-4'>
        <div className='flex flex-col gap-3 xl:flex-row xl:items-stretch'>
          <StageCard
            stage={loadingStage}
            hint={`Depart ${trip.originSite.name}`}
            formatQuantity={formatQuantity}
          />

          <FlowConnector
            value={formatQuantity(Math.abs(liveStage!.delta))}
            label='variation mesuree'
          />

          <StageCard
            stage={liveStage!}
            hint={`Dernier ping ${trip.truck.current_location}`}
            formatQuantity={formatQuantity}
          />

          <FlowConnector
            value={
              variation.nextDrop > 0
                ? formatQuantity(variation.nextDrop)
                : 'Aucun drop'
            }
            label='prochaine sortie GPL'
          />

          <StageCard
            stage={projectedStage!}
            hint={
              trip.status === 'completed'
                ? 'Mission cloturee'
                : `Projection apres ${trip.nextStop.site.name}`
            }
            formatQuantity={formatQuantity}
          />
        </div>

        <div className='grid gap-3 md:grid-cols-3'>
          <MetricTile
            icon={Package}
            label='Livraison comptabilisée'
            value={formatQuantity(variation.delivered)}
            hint={`${variation.deliveredPercent}% déjà livrés`}
          />
          <MetricTile
            icon={ArrowRight}
            label='Prochaine étape'
            value={
              variation.nextDrop > 0
                ? formatQuantity(variation.nextDrop)
                : 'Aucune sortie GPL'
            }
            hint={
              trip.status === 'completed'
                ? 'Tournée finalisée'
                : trip.nextStop.site.name
            }
          />
          <MetricTile
            icon={Gauge}
            label='Ecart telemetry'
            value={
              variation.telemetryGap > 0
                ? formatQuantity(variation.telemetryGap)
                : zeroUnit
            }
            hint={
              variation.telemetryGap > 0
                ? 'À rapprocher du stock déclaré'
                : 'Stock déclaré cohérent'
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}

function StageCard({
  stage,
  hint,
  formatQuantity,
}: {
  stage: RouteLpgVariationStage
  hint: string
  formatQuantity: (value: number) => string
}) {
  const tone = toneClasses[stage.tone]
  const deltaText =
    stage.delta === 0
      ? 'Base de reference'
      : `${stage.delta > 0 ? '+' : '-'}${formatQuantity(Math.abs(stage.delta))}`

  return (
    <div className='min-w-0 flex-1 rounded-2xl bg-muted/30 p-4 shadow-xs'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-sm font-medium'>{stage.label}</p>
          <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
        </div>
        <Badge className={cn('font-medium', tone.badge)}>{stage.percent}%</Badge>
      </div>

      <div className='mt-4 space-y-3'>
        <p className='text-2xl font-semibold tracking-tight'>
          {formatQuantity(stage.quantity)}
        </p>

        <div className='space-y-1.5'>
          <div className='h-2 overflow-hidden rounded-full bg-muted'>
            <div
              className={cn('h-full rounded-full transition-all', tone.line)}
              style={{ width: `${Math.max(stage.percent, 4)}%` }}
            />
          </div>
          <p className='text-xs text-muted-foreground'>{deltaText}</p>
        </div>
      </div>
    </div>
  )
}

function FlowConnector({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className='flex flex-row items-center justify-center gap-2 rounded-2xl bg-muted/20 px-3 py-2 text-center text-xs text-muted-foreground shadow-xs xl:w-28 xl:flex-col'>
      <ArrowRight className='size-4 text-foreground/70' />
      <div className='space-y-0.5'>
        <p className='font-medium text-foreground'>{value}</p>
        <p>{label}</p>
      </div>
    </div>
  )
}

function MetricTile({
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
