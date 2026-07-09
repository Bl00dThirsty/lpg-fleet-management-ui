import * as React from 'react'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { trips } from '../data/trip-data'
import { TripDetails } from './trip-details'
import { TripList } from './trip-list'

export function SuiviTripsLayout() {
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selectedTripId, setSelectedTripId] = React.useState<string | null>(trips[0].id)
  
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? trips[0]

  function handleSelectTrip(tripId: string) {
    setSelectedTripId(tripId)

    // On mobile screens (< 1024px in this context, matching lg breakpoint), open the sheet
    if (window.innerWidth < 1024) {
      setDetailsOpen(true)
    }
  }

  return (
    <>
      <div
        className='grid h-[calc(100vh-var(--header-height,64px))] overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x border-t'
      >
        <div className='h-full overflow-hidden bg-muted/10'>
          <TripList
            trips={trips}
            selectedTripId={selectedTripId}
            onSelectTrip={handleSelectTrip}
          />
        </div>
        <div className='hidden h-full overflow-hidden lg:block bg-background'>
          <TripDetails trip={selectedTrip} />
        </div>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side='right'
          className='w-full gap-0 p-0 sm:max-w-none md:w-3/4'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>{selectedTrip ? `Tournée ${selectedTrip.id}` : 'Détails de la tournée'}</SheetTitle>
            <SheetDescription>Détails de la tournée sélectionnée et suivi du trajet.</SheetDescription>
          </SheetHeader>
          <TripDetails trip={selectedTrip} />
        </SheetContent>
      </Sheet>
    </>
  )
}
