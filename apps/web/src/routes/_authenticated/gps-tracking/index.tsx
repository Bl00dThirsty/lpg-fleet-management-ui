import { createFileRoute } from '@tanstack/react-router'


import { GpsTrackingPage } from '@/features/gps-tracking'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/gps-tracking/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: GpsTrackingPage,


})