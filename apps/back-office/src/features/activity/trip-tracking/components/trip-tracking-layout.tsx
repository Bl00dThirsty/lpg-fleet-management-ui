import { useState } from 'react'
import { trips } from '../data/trip-data'
import { TripDetails } from './trip-details'
import { CheckpointsList } from './checkpoints-list'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function SuiviTripsLayout({ tripId }: { tripId: string }) {
  const selectedTrip = trips.find((trip) => trip.id === tripId) ?? trips[0]
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null)

  return (
    <div className='flex flex-col flex-1 min-h-0'>
      <div className='px-4 py-2 border-b bg-muted/20'>
        <Button variant='ghost' size='sm' asChild className='gap-2'>
          <Link to='/activity/trip-tracking'>
            <ArrowLeft className='size-4' />
            Retour à la liste
          </Link>
        </Button>
      </div>
      <div className='grid flex-1 min-h-0 overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x'>
        <div className='h-full overflow-hidden bg-muted/10'>
          <CheckpointsList 
            trip={selectedTrip} 
            selectedCheckpointId={selectedCheckpointId}
            onSelectCheckpoint={setSelectedCheckpointId}
          />
        </div>
        <div className='hidden h-full overflow-hidden lg:block bg-background'>
          <TripDetails trip={selectedTrip} selectedCheckpointId={selectedCheckpointId} />
        </div>
      </div>
    </div>
  )
}
