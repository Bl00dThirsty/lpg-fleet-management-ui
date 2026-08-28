import { createFileRoute } from '@tanstack/react-router'


import { ReportsPage } from '@/features/reports'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/reports/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: ReportsPage,


})