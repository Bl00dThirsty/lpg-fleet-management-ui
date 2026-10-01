import { getRouteApi } from '@tanstack/react-router'
import { CalendarDays } from 'lucide-react'
import { trips } from '../data/trip-data'
import { TripsTable } from './trips-table'
import { Badge } from '@/components/ui/badge'

const route = getRouteApi('/_authenticated/activity/trip-tracking/')

export function TripsPage() {
  const tableSearch = route.useSearch()
  const navigate = route.useNavigate()

  const handleViewDetails = (trip: typeof trips[0]) => {
    navigate({
      to: '/activity/trip-tracking/$tripId',
      params: { tripId: trip.id },
    })
  }

  const dateText = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <main
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-4 shadow-sm backdrop-blur-sm'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className='text-[30px] leading-none font-semibold tracking-tight sm:text-3xl'>
              Suivi des Tournées
            </h1>
            <p className='mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground sm:text-sm'>
              <CalendarDays className='size-4' />
              {dateText}
            </p>
          </div>
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>
              Liste des tournées actives
            </h2>
            <p className='text-sm text-muted-foreground'>
              Visualisez et gérez l'ensemble des trajets en cours ou planifiés.
            </p>
          </div>
          <Badge
            variant='outline'
            className='border-transparent bg-muted/35 text-foreground'
          >
            {trips.length} tournées
          </Badge>
        </div>
        
        <TripsTable
          data={trips}
          search={tableSearch}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </section>
    </main>
  )
}
