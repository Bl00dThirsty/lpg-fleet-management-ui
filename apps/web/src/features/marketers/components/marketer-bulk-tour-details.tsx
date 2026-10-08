import { lazy, Suspense } from 'react'
import { MissionDocuments } from '@/features/tours/components/mission-documents'
import { TourActions } from '@/features/tours/components/tour-actions'
import {
  Activity,
  AlertTriangle,
  Copy,
  MapPin,
  PackageOpen,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Organization } from '@lpg/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { formatTm } from '@/features/map/utils/format'
import {
  tourStatusLabels,
  routeStatusClasses,
  type TourActivity,
} from '@/features/tours/data/tour-activity'
import { formatBulkTourDate } from '../lib/marketer-bulk-tours'

const TourMap = lazy(() =>
  import('@/features/tours/components/tour-corridor-map').then((module) => ({
    default: module.TourCorridorMap,
  }))
)
const tabClass =
  'h-auto rounded-none border-0 border-b-2 border-transparent px-2 py-3 text-xs shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none'

export function MarketerBulkTourDetails({
  trip,
  marketer,
}: {
  trip: TourActivity
  marketer: Organization
}) {
  const alerts = trip.events.filter((event) => event.severity !== 'low')

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(trip.reference)
      toast.success('Référence copiée')
    } catch {
      toast.error('Impossible de copier la référence')
    }
  }

  return (
    <div className='flex h-full min-h-0 flex-col bg-card'>
      <div
        className='shrink-0 overflow-hidden border-b'
        aria-label={`Carte de la tournée ${trip.reference}`}
      >
        <Suspense
          fallback={
            <div
              role='status'
              className='grid h-[300px] place-items-center bg-muted/20 text-sm text-muted-foreground'
            >
              Chargement de la carte…
            </div>
          }
        >
          <TourMap trip={trip} formatDateTime={formatBulkTourDate} compact />
        </Suspense>
      </div>
      <Tabs defaultValue='overview' className='min-h-0 flex-1 gap-0'>
        <TabsList
          aria-label='Détails de la tournée'
          className='h-auto w-full shrink-0 justify-start gap-2 rounded-none border-b bg-transparent px-3 py-0'
        >
          <TabsTrigger className={tabClass} value='overview'>
            Vue d’ensemble
          </TabsTrigger>
          <TabsTrigger className={tabClass} value='activity'>
            Journal d’activité
          </TabsTrigger>
        </TabsList>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <TabsContent value='overview' className='m-0 space-y-4 p-4 sm:p-5'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <h3 className='text-lg font-medium'>{trip.reference}</h3>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7'
                  aria-label='Copier la référence de tournée'
                  onClick={() => void copyReference()}
                >
                  <Copy className='size-3.5' />
                </Button>
              </div>
              <div className='flex flex-wrap items-center gap-2 text-xs'>
                <Badge
                  variant='outline'
                  className={cn('text-[10px]', routeStatusClasses[trip.status])}
                >
                  {tourStatusLabels[trip.tourneeStatus]}
                </Badge>
                <TourActions tour={trip} />
              </div>
            </div>

            <div className='flex items-center justify-between gap-3 border-y py-3'>
              <div className='flex min-w-0 items-center gap-3'>
                <span className='grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold'>
                  {marketer.name.slice(0, 2).toUpperCase()}
                </span>
                <div className='min-w-0'>
                  <p className='text-xs font-medium'>{marketer.name}</p>
                  <p className='mt-0.5 text-xs text-muted-foreground'>
                    Marketeur
                  </p>
                </div>
              </div>
              <Badge variant='secondary'>
                {trip.execution_mode === 'INTERNAL'
                  ? 'Transport interne'
                  : 'Externalisée'}
              </Badge>
            </div>

            <h4 className='text-sm font-medium'>Détails du transport</h4>
            <dl className='grid grid-cols-2 gap-x-4 gap-y-5 border-b pb-4 text-xs xl:grid-cols-4'>
              <div>
                <dt className='text-muted-foreground'>Marchandise</dt>
                <dd className='mt-2 flex items-center gap-2 font-medium'>
                  <PackageOpen className='size-4 text-muted-foreground' />
                  GPL Vrac
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Volume / Quantité</dt>
                <dd className='mt-2 font-medium'>
                  {formatTm(trip.loadedQuantity)}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Camion assigné</dt>
                <dd className='mt-2 flex items-center gap-2 font-medium'>
                  <Truck className='size-4 text-muted-foreground' />
                  {trip.vehicle_plate ?? 'Non affecté'}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Chauffeur</dt>
                <dd className='mt-2 font-medium'>
                  {trip.driver_name ?? 'Non affecté'}
                </dd>
              </div>
            </dl>

            {/* Section Résumé de l'activité */}
            <div className='space-y-3 rounded-lg border bg-muted/15 p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Activity className='size-4 text-primary' />
                  <h4 className='text-xs font-semibold uppercase tracking-wider text-foreground'>
                    Résumé de l'activité
                  </h4>
                </div>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <span>{trip.progressPercent}% complété</span>
                  <span>
                    · ETA : {formatBulkTourDate(trip.expectedArrivalAt)}
                  </span>
                </div>
              </div>
              <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    trip.status === 'incident'
                      ? 'bg-rose-500'
                      : trip.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-primary'
                  )}
                  style={{ width: `${trip.progressPercent}%` }}
                />
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs'>
                <div className='rounded-md border bg-card p-2.5'>
                  <span className='text-muted-foreground block text-[11px]'>
                    Volume initial
                  </span>
                  <span className='font-semibold mt-0.5 block'>
                    {formatTm(trip.loadedQuantity)}
                  </span>
                </div>
                <div className='rounded-md border bg-card p-2.5'>
                  <span className='text-muted-foreground block text-[11px]'>
                    Volume livré
                  </span>
                  <span className='font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block'>
                    {formatTm(trip.deliveredQuantity)}
                  </span>
                </div>
                <div className='rounded-md border bg-card p-2.5'>
                  <span className='text-muted-foreground block text-[11px]'>
                    Volume restant
                  </span>
                  <span className='font-semibold mt-0.5 block'>
                    {formatTm(trip.remainingQuantity)}
                  </span>
                </div>
                <div className='rounded-md border bg-card p-2.5'>
                  <span className='text-muted-foreground block text-[11px]'>
                    Étapes validées
                  </span>
                  <span className='font-semibold mt-0.5 block'>
                    {trip.completed_checkpoints} / {trip.checkpoint_count}
                  </span>
                </div>
              </div>
            </div>

            {alerts.map((event) => (
              <div
                key={event.id}
                className='flex gap-3 rounded-(--radius) border border-amber-300/60 bg-amber-50 p-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
              >
                <AlertTriangle className='mt-0.5 size-4 shrink-0' />
                <div>
                  <p className='text-xs font-medium'>{event.title}</p>
                  <p className='mt-2 text-xs opacity-80'>{event.description}</p>
                </div>
              </div>
            ))}

            {/* Section Étapes de livraison & Bons de validation (BL) */}
            <div className='space-y-3 pt-2'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-semibold flex items-center gap-2'>
                  <MapPin className='size-4 text-primary' />
                  Étapes de livraison & Bons de validation (BL)
                </h4>
                <Badge variant='outline' className='text-xs'>
                  {trip.stops.length} étape{trip.stops.length > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className='space-y-3'>
                {trip.stops.map((stop, idx) => {
                  const isCompleted =
                    stop.completed || trip.tourneeStatus === 'CLOSED'
                  const isCurrent =
                    !isCompleted && stop.id === trip.nextStop?.id

                  return (
                    <div
                      key={stop.id}
                      className={cn(
                        'rounded-lg border bg-card p-3.5 shadow-2xs space-y-2.5 transition',
                        isCompleted
                          ? 'border-emerald-500/30'
                          : isCurrent
                            ? 'border-primary/50 shadow-xs'
                            : 'border-border'
                      )}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <span
                            className={cn(
                              'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                              isCompleted
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : isCurrent
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {idx + 1}
                          </span>
                          <span className='font-medium text-sm text-foreground'>
                            {stop.title}
                          </span>
                          <Badge variant='secondary' className='text-[10px]'>
                            {stop.role === 'loading'
                              ? 'Chargement'
                              : 'Livraison'}
                          </Badge>
                        </div>
                        <Badge
                          variant='outline'
                          className={cn(
                            'text-[10px]',
                            isCompleted
                              ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                              : isCurrent
                                ? 'border-primary/40 text-primary bg-primary/5'
                                : 'text-muted-foreground'
                          )}
                        >
                          {isCompleted
                            ? 'Validé'
                            : isCurrent
                              ? 'En cours'
                              : 'À venir'}
                        </Badge>
                      </div>

                      <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground'>
                        <div>
                          <span className='block text-[11px] opacity-75'>
                            Destinataire / Site
                          </span>
                          <span className='font-medium text-foreground'>
                            {stop.clientName ||
                              stop.pointName ||
                              stop.site.name}
                          </span>
                        </div>
                        <div>
                          <span className='block text-[11px] opacity-75'>
                            Quantité
                          </span>
                          <span className='font-medium text-foreground'>
                            {stop.expectedQuantity != null
                              ? formatTm(stop.expectedQuantity)
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className='block text-[11px] opacity-75'>
                            Localité
                          </span>
                          <span className='font-medium text-foreground'>
                            {stop.city || stop.site.city || 'Cameroun'}
                          </span>
                        </div>
                      </div>

                      <MissionDocuments
                        missionId={trip.id}
                        stops={trip.stops}
                        checkpointId={stop.id}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className='flex flex-wrap justify-between gap-3 text-xs text-muted-foreground pt-2'>
              <span>Livreur : {trip.livreur_name ?? 'Non affecté'}</span>
              <span>
                {trip.completed_checkpoints} / {trip.checkpoint_count} étapes
                terminées · {formatTm(trip.deliveredQuantity)} livrées
              </span>
            </div>
          </TabsContent>
          <TabsContent value='activity' className='m-0 p-5'>
            <ol className='space-y-5 border-l pl-5'>
              {trip.events.map((event) => (
                <li key={event.id} className='relative'>
                  <span className='absolute top-1 -left-[25px] size-2 rounded-full bg-primary' />
                  <p className='text-sm font-medium'>{event.title}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {event.description}
                  </p>
                  <time className='mt-2 block text-xs text-muted-foreground'>
                    {formatBulkTourDate(event.occurredAt)}
                  </time>
                </li>
              ))}
            </ol>
            {!trip.events.length && (
              <p className='text-sm text-muted-foreground'>
                Aucun événement enregistré.
              </p>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
