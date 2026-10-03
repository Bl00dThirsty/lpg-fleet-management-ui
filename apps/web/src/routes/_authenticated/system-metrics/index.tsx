import { createFileRoute } from '@tanstack/react-router'


import { SystemMetricsPage } from '@/features/system-metrics'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/system-metrics/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: SystemMetricsPage,


})