import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { TourneeStatus } from '@lpg/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { tourStatusLabels } from '@/features/tours/data/tour-activity'
import {
  EMPTY_MISSION_FILTERS,
  missionDay,
  type MissionFilters as Filters,
} from '../lib/mission-filters'
import type { MapMission } from '../data/map-missions'
export function MissionFilters({
  filters,
  onChange,
  missions,
  selectedId,
  onSelect,
  loading,
  error,
  retry,
}: {
  filters: Filters
  onChange: (value: Filters) => void
  missions: MapMission[]
  selectedId: string
  onSelect: (id: string) => void
  loading: boolean
  error: string | null
  retry: () => void
}) {
  const invalid = !!filters.from && !!filters.to && filters.from > filters.to
  const active =
    filters.statuses.length + Number(!!filters.from || !!filters.to)
  const selected = missions.find((row) => row.tour.id === selectedId)
  return (
    <section
      aria-label='Filtrer les tournées de la carte'
      className='flex flex-col gap-3 rounded-lg border bg-background p-3 shadow-md'
    >
      <div className='flex items-center justify-between gap-2'>
        <p role='status' className='text-sm font-medium'>
          {loading ? 'Chargement…' : missions.length + ' tournée(s)'}
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline' size='sm'>
              <SlidersHorizontal className='mr-2 size-4' />
              Filtres{active > 0 ? ' (' + active + ')' : ''}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            className='w-[min(22rem,calc(100vw-2rem))]'
          >
            <div className='flex flex-col gap-4'>
              <div>
                <h2 className='font-semibold'>Dates et statuts</h2>
                <p className='text-xs text-muted-foreground'>
                  Départ prévu, sinon départ réel · heure du Cameroun.
                </p>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div className='flex flex-col gap-1'>
                  <Label htmlFor='mission-from'>Du</Label>
                  <Input
                    id='mission-from'
                    type='date'
                    value={filters.from}
                    aria-invalid={invalid}
                    onChange={(e) =>
                      onChange({ ...filters, from: e.target.value })
                    }
                  />
                </div>
                <div className='flex flex-col gap-1'>
                  <Label htmlFor='mission-to'>Au (inclus)</Label>
                  <Input
                    id='mission-to'
                    type='date'
                    value={filters.to}
                    aria-invalid={invalid}
                    onChange={(e) =>
                      onChange({ ...filters, to: e.target.value })
                    }
                  />
                </div>
              </div>
              {invalid && (
                <p role='alert' className='text-xs text-destructive'>
                  La date de fin doit suivre la date de début.
                </p>
              )}
              <fieldset className='flex flex-col gap-2'>
                <legend className='mb-2 text-sm font-medium'>
                  Statuts · plusieurs choix possibles
                </legend>
                {(Object.keys(tourStatusLabels) as TourneeStatus[]).map(
                  (status) => (
                    <div className='flex items-center gap-2' key={status}>
                      <Checkbox
                        id={'mission-status-' + status}
                        checked={filters.statuses.includes(status)}
                        onCheckedChange={(checked) =>
                          onChange({
                            ...filters,
                            statuses: checked
                              ? [...filters.statuses, status]
                              : filters.statuses.filter(
                                  (value) => value !== status
                                ),
                          })
                        }
                      />
                      <Label htmlFor={'mission-status-' + status}>
                        {tourStatusLabels[status]}
                      </Label>
                    </div>
                  )
                )}
              </fieldset>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => onChange(EMPTY_MISSION_FILTERS)}
              >
                <RotateCcw className='mr-2 size-4' />
                Réinitialiser les filtres
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {active > 0 && (
        <p className='text-xs text-muted-foreground'>
          {filters.from || 'Toutes dates'} → {filters.to || 'Sans limite'}
          {filters.statuses.length
            ? ' · ' +
              filters.statuses
                .map((status) => tourStatusLabels[status])
                .join(', ')
            : ''}
        </p>
      )}
      <Select
        value={selectedId}
        onValueChange={onSelect}
        disabled={!!error || loading || !missions.length}
      >
        <SelectTrigger aria-label='Tournées à afficher' className='w-full'>
          <SelectValue placeholder='Choisir une tournée' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='ALL'>Toutes les tournées filtrées</SelectItem>
          {missions.map(({ tour }) => (
            <SelectItem value={tour.id} key={tour.id}>
              {tour.tour_code ?? tour.id} · {missionDay(tour) ?? 'Sans date'} ·{' '}
              {tourStatusLabels[tour.status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <div role='alert' className='text-xs text-destructive'>
          {error}
          <Button size='sm' variant='link' onClick={retry}>
            Réessayer
          </Button>
        </div>
      ) : !loading && !missions.length ? (
        <p className='text-xs text-muted-foreground'>
          Aucune tournée ne correspond aux filtres.
        </p>
      ) : null}
      {selected && (
        <div className='flex flex-col gap-1 text-xs'>
          <p className='font-medium'>
            {selected.tour.requested_quantity}{' '}
            {selected.tour.type === 'VRAC' ? 'TM' : 'btl'} ·{' '}
            {tourStatusLabels[selected.tour.status]}
          </p>
          <p className='text-muted-foreground'>
            {selected.stops.map((stop) => stop.name).join(' → ')}
          </p>
          <Link
            to='/tour-tracking/$tourId'
            params={{ tourId: selected.tour.id }}
            className='text-primary underline'
          >
            Ouvrir la tournée
          </Link>
        </div>
      )}
      {missions.some((row) => row.missingCoordinates) && (
        <p className='text-xs text-muted-foreground'>
          GPS incomplet pour{' '}
          {missions.filter((row) => row.missingCoordinates).length} tournée(s) :
          seules les étapes localisées sont affichées.
        </p>
      )}
    </section>
  )
}
