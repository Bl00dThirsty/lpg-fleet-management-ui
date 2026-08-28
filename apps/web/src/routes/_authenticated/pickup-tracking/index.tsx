import { createFileRoute } from '@tanstack/react-router'


import { PickupTrackingPage } from '@/features/pickup-tracking'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/pickup-tracking/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: PickupTrackingPage,


})