import { createFileRoute } from '@tanstack/react-router'
import { SuiviTripsLayout } from '@/features/activity/trip-tracking/components/trip-tracking-layout'
import { trips } from '@/features/activity/trip-tracking/data/trip-data'

export const Route = createFileRoute(
  '/_authenticated/activity/trip-tracking/$tripId',
)({
  component: TripDetailsRoute,
})

function TripDetailsRoute() {
  const { tripId } = Route.useParams()
  const trip = trips.find((t) => t.id === tripId)

  if (!trip) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-muted-foreground'>Tournée introuvable</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full bg-background'>
      <div className='flex shrink-0 items-center justify-between px-4 py-3 sm:px-6'>
        <h1 className='text-xl font-bold tracking-tight'>Détails de la tournée {trip.id}</h1>
      </div>
      <SuiviTripsLayout tripId={tripId} />
    </div>
  )
}
