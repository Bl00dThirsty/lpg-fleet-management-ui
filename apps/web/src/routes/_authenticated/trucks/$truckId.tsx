import { createFileRoute } from '@tanstack/react-router'


import { TruckDetailsPage } from '@/features/trucks/truck-details'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/trucks/$truckId')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: TruckDetailsPage,


})


