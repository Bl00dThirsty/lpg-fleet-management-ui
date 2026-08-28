import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { executionModeLabels, type TourActivity } from '../data/tour-activity'

type TourActiveHeaderProps = {
  trip: TourActivity
  trips: readonly TourActivity[]
  onSelectTrip: (routeId: string) => void
}

export function TourActiveHeader({
  trip,
  trips,
  onSelectTrip,
}: TourActiveHeaderProps) {
  const selectedIndex = trips.findIndex((candidate) => candidate.id === trip.id)
  const previousTrip = selectedIndex > 0 ? trips[selectedIndex - 1] : null
  const nextTrip =
    selectedIndex >= 0 && selectedIndex < trips.length - 1
      ? trips[selectedIndex + 1]
      : null

  return (
    <Card className='border-transparent bg-background/80 shadow-sm'>
      <CardHeader className='border-b bg-muted/30'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <CardTitle>Tournée active</CardTitle>
            <CardDescription>
              Changez rapidement de mission sans revenir à la liste.
            </CardDescription>
          </div>
          <span className='text-xs text-muted-foreground'>
            {executionModeLabels[trip.execution_mode]} · {trips.length} tournée{trips.length > 1 ? 's' : ''} dans la sélection
          </span>
        </div>
      </CardHeader>
      <CardContent className='flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <p className='font-display text-lg font-semibold tracking-tight'>
            {trip.reference}
          </p>
          <p className='text-sm text-muted-foreground'>
            {trip.originSite.name} → {trip.destinationSite.name}
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <Button
            type='button'
            variant='outline'
            className='h-10'
            onClick={() => previousTrip && onSelectTrip(previousTrip.id)}
            disabled={!previousTrip}
          >
            <ArrowLeft data-icon='inline-start' />
            Précédente
          </Button>
          <Select value={trip.id} onValueChange={onSelectTrip}>
            <SelectTrigger className='h-10 min-w-[260px]'>
              <SelectValue placeholder='Choisir une tournée' />
            </SelectTrigger>
            <SelectContent>
              {trips.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.reference} — {candidate.originSite.city} /{' '}
                  {candidate.destinationSite.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type='button'
            variant='outline'
            className='h-10'
            onClick={() => nextTrip && onSelectTrip(nextTrip.id)}
            disabled={!nextTrip}
          >
            Suivante
            <ArrowRight data-icon='inline-end' />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
