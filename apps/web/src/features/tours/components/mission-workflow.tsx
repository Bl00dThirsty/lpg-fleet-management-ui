import type { PickupStatus } from '@lpg/types'
import { pickupStatusLabels } from '@/features/pickups/data/pickups'
import { Check } from 'lucide-react'
import { CHAINS } from '../data/tour-machine'
import { tourStatusLabels, type TourActivity } from '../data/tour-activity'
export function MissionWorkflow({ trip }: { trip: TourActivity }) {
  const pickupSteps: PickupStatus[] = ['DRAFT', 'VALIDATED', 'INPROGRESS', 'COMPLETED']
  const steps = trip.mission_kind === 'PICKUP' ? pickupSteps.map(status => ({status,label:pickupStatusLabels[status]})) : CHAINS[trip.execution_mode].map(status => ({status,label:tourStatusLabels[status]}))
  const current = trip.mission_kind === 'PICKUP' ? trip.pickup_status : trip.tourneeStatus
  const active = steps.findIndex(step => step.status === current)
  return (
    <ol
      aria-label='Cycle de vie de la mission'
      className='flex overflow-x-auto gap-3 py-4'
    >
      {steps.map(({status,label}, index) => (
        <li
          key={status}
          aria-current={index === active ? 'step' : undefined}
          className='flex min-w-28 flex-1 items-center gap-2 text-xs'
        >
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${index === active ? 'border-primary bg-primary text-primary-foreground' : index < active ? 'border-primary text-primary' : 'text-muted-foreground'}`}
          >
            {index < active ? <Check className='size-4' /> : index + 1}
          </span>
          <span
            className={
              index === active ? 'font-semibold' : 'text-muted-foreground'
            }
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  )
}
