import { createFileRoute } from '@tanstack/react-router'


import { DriversPage } from '@/features/drivers'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/drivers/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: DriversPage,


})