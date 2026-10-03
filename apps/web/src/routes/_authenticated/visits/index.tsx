import { createFileRoute } from '@tanstack/react-router'


import { VisitsPage } from '@/features/visits'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/visits/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: VisitsPage,


})