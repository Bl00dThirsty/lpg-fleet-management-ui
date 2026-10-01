import { createFileRoute } from '@tanstack/react-router'


import { ToursPage } from '@/features/super-admin'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/super-admin/tours/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: ToursPage,


})