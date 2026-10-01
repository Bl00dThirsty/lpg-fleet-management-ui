import { createFileRoute } from '@tanstack/react-router'


import { TransportersPage } from '@/features/transporters'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/transporters/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: TransportersPage,


})


