import { type ElementType } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, MapPinned, Package, Truck } from 'lucide-react'
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
}: TourLpgVariationPanelProps) {
  const { t } = useTranslation('dashboard')
  // The dashboard namespace owns the canonical \unavailable\ wording.
  const unavailableLabel = t('telemetry.unavailable')
  const variation = buildRouteLpgVariation(trip)

  if (!trip.telemetry.some((point) => point.meterReading != null)) {
    return (
      <Card className='overflow-hidden border-transparent shadow-sm'>
        <CardHeader className='border-b bg-muted/20'>
          <CardTitle>{t('telemetry.variationTitle')}</CardTitle>
          <CardDescription>{t('telemetry.variationUnavailable')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const [loadingStage, liveStage, deliveredStage, remainingStage] =
    variation.stages as [
      RouteLpgVariationStage,
      RouteLpgVariationStage,
      RouteLpgVariationStage,
      RouteLpgVariationStage,
    ]

  return (
    <Card className='overflow-hidden border-transparent shadow-sm'>
      <CardHeader className='border-b bg-muted/20'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <CardTitle>{t('variation.title')}</CardTitle>
            <CardDescription>{t('variation.description')}</CardDescription>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Badge variant='outline' className='gap-1 border-transparent bg-background/70'>
              <Truck className='size-3.5' />
              {trip.truck.id}
            </Badge>
            <Badge variant='outline' className='gap-1 border-transparent bg-background/70'>
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
            hint={t('variation.departHint', { site: trip.originSite.name })}
            formatQuantity={formatQuantity}
            unavailableLabel={unavailableLabel}
          />

          <FlowConnector
            value={
              liveStage.delta == null
                ? unavailableLabel
                : formatQuantity(Math.abs(liveStage.delta))
            }
            label={t('variation.measured')}
          />

          <StageCard
            stage={liveStage}
            hint={t('variation.lastPing', {
              location: trip.truck.current_location ?? '—',
            })}
            formatQuantity={formatQuantity}
            unavailableLabel={unavailableLabel}
          />

          <FlowConnector
            value={formatQuantity(variation.delivered)}
            label={t('variation.delivered')}
          />

          <StageCard
            stage={deliveredStage}
            hint={t('variation.deliveredHint')}
            formatQuantity={formatQuantity}
            unavailableLabel={unavailableLabel}
          />

          <FlowConnector
            value={formatQuantity(trip.remainingQuantity)}
            label={t('variation.remaining')}
          />

          <StageCard
            stage={remainingStage}
            hint={t('variation.remainingHint')}
            formatQuantity={formatQuantity}
            unavailableLabel={unavailableLabel}
          />
        </div>

        <div className='grid gap-3 md:grid-cols-3'>
          <MetricTile
            icon={Package}
            label={t('variation.recordedDelivery')}
            value={formatQuantity(variation.delivered)}
            hint={t('variation.deliveredPercentHint', {
              value: variation.deliveredPercent,
            })}
          />
          <MetricTile
            icon={ArrowRight}
            label={t('variation.nextStopLabel')}
            // Only a genuinely pending checkpoint can be named here; the tour
            // never projects a quantity for a stop that was already visited.
            value={variation.nextStopSiteName ?? t('variation.noNextStop')}
            hint={
              trip.status === 'completed'
                ? t('variation.finalized')
                : t('variation.nextStopLabel')
            }
          />
          <MetricTile
            icon={Package}
            label={t('variation.liveReading')}
            value={
              variation.liveReading == null
                ? unavailableLabel
                : formatQuantity(variation.liveReading)
            }
            hint={t('variation.stageLive')}
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
  unavailableLabel,
}: {
  stage: RouteLpgVariationStage
  hint: string
  formatQuantity: (value: number) => string
  unavailableLabel: string
}) {
  const { t } = useTranslation('dashboard')
  const tone = toneClasses[stage.tone]
  // An absent measurement renders as unavailable, never as a measured zero.
  const deltaText =
    stage.delta == null || stage.delta === 0
      ? stage.delta === 0
        ? t('variation.baseline')
        : unavailableLabel
      : `${stage.delta > 0 ? '+' : '-'}${formatQuantity(Math.abs(stage.delta))}`

  return (
    <div className='min-w-0 flex-1 rounded-2xl bg-muted/30 p-4 shadow-xs'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-sm font-medium'>{t(stage.labelKey)}</p>
          <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
        </div>
        <Badge className={cn('font-medium', tone.badge)}>
          {stage.percent == null ? unavailableLabel : `${stage.percent}%`}
        </Badge>
      </div>

      <div className='mt-4 space-y-3'>
        <p className='text-2xl font-semibold tracking-tight'>
          {stage.quantity == null
            ? unavailableLabel
            : formatQuantity(stage.quantity)}
        </p>

        <div className='space-y-1.5'>
          <div className='h-2 overflow-hidden rounded-full bg-muted'>
            <div
              className={cn('h-full rounded-full transition-all', tone.line)}
              style={{ width: `${Math.max(stage.percent ?? 0, stage.quantity == null ? 0 : 4)}%` }}
            />
          </div>
          <p className='text-xs text-muted-foreground'>{deltaText}</p>
        </div>
      </div>
    </div>
  )
}

function FlowConnector({ value, label }: { value: string; label: string }) {
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
