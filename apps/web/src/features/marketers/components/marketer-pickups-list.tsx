import { getPickupsForMarketer } from '../data/pickups'
import { PickupsTable } from './pickups/pickups-table'

interface MarketerPickupsListProps {
  marketer: { id: string; name: string }
}

export function MarketerPickupsList({ marketer }: MarketerPickupsListProps) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Enlèvements pour {marketer.name}</h2>
      </div>
      <PickupsTable
        data={getPickupsForMarketer(marketer.id)}
        onViewDetails={(pickup) => {
          // Navigate to pickup details
          console.log('View pickup details', pickup)
        }}
      />
    </div>
  )
}