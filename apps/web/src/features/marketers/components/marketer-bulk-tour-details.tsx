import { lazy, Suspense } from 'react'
import { AlertTriangle, Copy, FileText, PackageOpen, Truck } from 'lucide-react'
import { toast } from 'sonner'
import type { Organization } from '@lpg/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToursStore } from '@/store/tours-store'
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
  const deliveryEvents = useToursStore((state) => state.deliveryEvents)
  const documents = deliveryEvents.filter(
    (event) =>
      event.tour_id === trip.id &&
      event.proof_url &&
      /^https?:\/\//i.test(event.proof_url)
  )
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
          <TabsTrigger className={tabClass} value='documents'>
            Documents & BL
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
                <span>{trip.progressPercent}% complété</span>
                <span className='text-muted-foreground'>
                  · ETA : {formatBulkTourDate(trip.expectedArrivalAt)}
                </span>
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
            <div className='flex flex-wrap justify-between gap-3 text-xs text-muted-foreground'>
              <span>Livreur : {trip.livreur_name ?? 'Non affecté'}</span>
              <span>
                {trip.completed_checkpoints} / {trip.checkpoint_count} étapes
                terminées · {formatTm(trip.deliveredQuantity)} livrées
              </span>
            </div>
          </TabsContent>
          <TabsContent value='documents' className='m-0 p-5'>
            {documents.length ? (
              <ul className='space-y-3'>
                {documents.map((document) => (
                  <li key={document.id}>
                    <a
                      href={document.proof_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-3 rounded-(--radius) border p-4 text-sm hover:bg-muted'
                    >
                      <FileText className='size-4' />
                      Justificatif de livraison —{' '}
                      {document.site_name ?? `Étape ${document.sequence}`}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className='grid min-h-40 place-items-center rounded-(--radius) border border-dashed p-5 text-center text-sm text-muted-foreground'>
                Aucun bon de livraison ni justificatif joint à cette tournée.
              </div>
            )}
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
