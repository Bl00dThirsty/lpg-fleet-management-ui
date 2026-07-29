import { createFileRoute } from '@tanstack/react-router'
import { TruckDetailsPage } from '@/features/trucks/truck-details'

export const Route = createFileRoute('/_authenticated/trucks/$truckId')({
  component: TruckDetailsPage,
})
