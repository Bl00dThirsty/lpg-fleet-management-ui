import { createFileRoute } from '@tanstack/react-router'


import { DepotsPage } from '@/features/depots'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/depots/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: DepotsPage,


})