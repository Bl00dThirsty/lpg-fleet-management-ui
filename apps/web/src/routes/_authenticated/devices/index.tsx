import { createFileRoute } from '@tanstack/react-router'


import { DevicesPage } from '@/features/devices'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/devices/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: DevicesPage,


})