import { useState } from 'react'
import { Search, Truck } from 'lucide-react'
import type { Organization } from '@lpg/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { formatTm } from '@/features/map/utils/format'
import {
  tourStatusLabels,
  routeStatusClasses,
  type TourActivity,
} from '@/features/tours/data/tour-activity'
import { useMarketerBulkTours } from '../data/marketer-bulk-tours'
import {
  filterBulkTours,
  matchesBulkTourFilter,
  formatBulkTourDate,
  type BulkTourFilter,
} from '../lib/marketer-bulk-tours'
import { MarketerBulkTourDetails } from './marketer-bulk-tour-details'

const filters: { value: BulkTourFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'active', label: 'En transit' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'delayed', label: 'Retards' },
]

// Layout adapted from trip-tracking at 19bcba64581420332756166037fb2b70d3ff9fbe.
export function MarketerBulkRoutes({ marketer }: { marketer: Organization }) {
  const { activities, loading, error, retry } = useMarketerBulkTours(
    marketer.id
  )
  const [filter, setFilter] = useState<BulkTourFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const visibleTrips = filterBulkTours(activities, filter, query)
  const selectedTrip =
    visibleTrips.find((trip) => trip.id === selectedId) ?? visibleTrips[0]

  function selectTrip(id: string) {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 1023px)').matches) setDetailsOpen(true)
  }

  if (error)
    return (
      <div
        role='alert'
        className='rounded-(--radius) border bg-card p-8 text-center'
      >
        <p>Impossible de charger les détails des tournées.</p>
        <Button variant='outline' className='mt-3' onClick={() => void retry()}>
          Réessayer
        </Button>
      </div>
    )

  return (
    <section
      aria-label='Suivi des tournées VRAC'
      className='overflow-hidden rounded-(--radius) border bg-card text-card-foreground shadow-sm'
    >
      <div className='flex items-center justify-between gap-3 border-b px-5 py-4'>
        <h2 className='text-sm font-semibold'>Suivi des tournées VRAC</h2>
        <span className='text-xs text-muted-foreground'>
          {activities.length} tournée{activities.length > 1 ? 's' : ''} · GPL
          Vrac
        </span>
      </div>
      <div className='grid min-h-[680px] lg:h-[760px] lg:grid-cols-[340px_minmax(0,1fr)]'>
        <aside
          aria-label='Liste des tournées VRAC'
          className='flex min-h-0 flex-col border-b bg-muted/10 lg:border-r lg:border-b-0'
        >
          <h3 className='px-4 pt-5 pb-4 text-sm font-semibold'>
            Tournées du marketeur
          </h3>
          <div
            className='mx-4 flex rounded-(--radius) bg-muted p-1'
            aria-label='Filtrer les tournées'
          >
            {filters.map(({ value, label }) => (
              <button
                key={value}
                type='button'
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  'flex-1 rounded-(--radius) px-1 py-2 text-[11px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  filter === value
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label} (
                {
                  activities.filter((trip) =>
                    matchesBulkTourFilter(trip, value)
                  ).length
                }
                )
              </button>
            ))}
          </div>
          <div className='relative mx-4 my-4'>
            <Search className='pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground' />
            <Input
              aria-label='Rechercher une tournée VRAC'
              placeholder='Tournée, camion ou client…'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className='pl-9'
            />
          </div>
          <div
            className='min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4'
            aria-busy={loading}
          >
            {loading ? (
              <p
                role='status'
                className='py-12 text-center text-sm text-muted-foreground'
              >
                Chargement des tournées…
              </p>
            ) : visibleTrips.length ? (
              visibleTrips.map((trip) => (
                <BulkTourCard
                  key={trip.id}
                  trip={trip}
                  active={selectedTrip?.id === trip.id}
                  onSelect={selectTrip}
                />
              ))
            ) : (
              <p
                role='status'
                className='py-12 text-center text-sm text-muted-foreground'
              >
                {activities.length
                  ? 'Aucune tournée ne correspond à votre recherche.'
                  : 'Aucune tournée VRAC pour ce marketeur.'}
              </p>
            )}
          </div>
        </aside>
        <div className='hidden min-h-0 min-w-0 lg:block'>
          {selectedTrip ? (
            <MarketerBulkTourDetails
              key={selectedTrip.id}
              trip={selectedTrip}
              marketer={marketer}
            />
          ) : (
            <div className='grid h-full place-items-center p-8 text-center text-sm text-muted-foreground'>
              Sélectionnez une tournée pour consulter son trajet et ses détails.
            </div>
          )}
        </div>
      </div>
      <Sheet
        open={detailsOpen && Boolean(selectedTrip)}
        onOpenChange={setDetailsOpen}
      >
        <SheetContent side='right' className='w-full gap-0 p-0 sm:max-w-2xl'>
          <SheetHeader className='sr-only'>
            <SheetTitle>Tournée {selectedTrip?.reference}</SheetTitle>
            <SheetDescription>
              Itinéraire et détails de la tournée VRAC sélectionnée.
            </SheetDescription>
          </SheetHeader>
          {selectedTrip && (
            <MarketerBulkTourDetails
              key={selectedTrip.id}
              trip={selectedTrip}
              marketer={marketer}
            />
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

function BulkTourCard({
  trip,
  active,
  onSelect,
}: {
  trip: TourActivity
  active: boolean
  onSelect: (id: string) => void
}) {
  const progress = Math.max(0, Math.min(100, trip.progressPercent))
  return (
    <button
      type='button'
      aria-pressed={active}
      aria-label={`Afficher la tournée ${trip.reference}`}
      onClick={() => onSelect(trip.id)}
      className={cn(
        'flex w-full flex-col gap-5 rounded-(--radius) border bg-card p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active && 'border-primary bg-muted/40'
      )}
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-sm font-medium'>{trip.reference}</span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px]',
            routeStatusClasses[trip.status]
          )}
        >
          <span className='size-1.5 rounded-full bg-current' />
          {tourStatusLabels[trip.tourneeStatus]}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-3 text-xs'>
        <div>
          <p className='font-medium'>{trip.originSite.city}</p>
          <p className='mt-1 text-muted-foreground'>{trip.originSite.name}</p>
        </div>
        <div className='text-right'>
          <p className='font-medium'>{trip.destinationSite.city}</p>
          <p className='mt-1 text-muted-foreground'>
            {trip.destinationSite.name}
          </p>
        </div>
      </div>
      <div
        className='flex items-center gap-1'
        aria-label={`${progress} % complété`}
      >
        <span
          className='min-w-0 border-t border-dashed border-foreground'
          style={{ flexGrow: progress, flexBasis: 0 }}
        />
        <Truck className='size-4 shrink-0 text-primary' />
        <span
          className='min-w-0 border-t border-dashed border-border'
          style={{ flexGrow: 100 - progress, flexBasis: 0 }}
        />
      </div>
      <div className='grid grid-cols-2 gap-2 text-xs'>
        <div>
          <p className='text-muted-foreground'>Chargement</p>
          <p className='mt-1 font-medium'>
            GPL Vrac · {formatTm(trip.loadedQuantity)}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-muted-foreground'>Arrivée estimée</p>
          <p className='mt-1 font-medium tabular-nums'>
            {formatBulkTourDate(trip.expectedArrivalAt)}
          </p>
        </div>
      </div>
    </button>
  )
}
