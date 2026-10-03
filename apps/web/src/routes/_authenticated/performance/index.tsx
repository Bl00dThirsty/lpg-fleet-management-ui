import { createFileRoute } from '@tanstack/react-router'


import { PerformancePage } from '@/features/performance'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/performance/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: PerformancePage,


})