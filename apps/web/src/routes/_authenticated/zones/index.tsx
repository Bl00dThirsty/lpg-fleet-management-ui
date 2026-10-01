import { createFileRoute } from '@tanstack/react-router'


import { ZonesPage } from '@/features/zones'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/zones/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: ZonesPage,


})