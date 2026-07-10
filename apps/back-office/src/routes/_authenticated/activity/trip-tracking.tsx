import { createFileRoute } from '@tanstack/react-router'
import { SuiviTripsLayout } from '@/features/activity/trip-tracking/components/trip-tracking-layout'

export const Route = createFileRoute('/_authenticated/activity/trip-tracking')({
  component: SuiviTripsPage,
})

function SuiviTripsPage() {
  return (
    <div className='flex flex-col h-full bg-background'>
      <div className='flex shrink-0 items-center justify-between px-4 py-3 sm:px-6'>
        <h1 className='text-xl font-bold tracking-tight'>Suivi de mes tournées</h1>
      </div>
      <SuiviTripsLayout />
    </div>
  )
}
