import { createFileRoute } from '@tanstack/react-router'
import { SuiviTripsLayout } from '@/features/activity/trip-tracking-layout'

export const Route = createFileRoute('/_authenticated/activity/trip-tracking')({
  component: SuiviTripsLayout,
})
