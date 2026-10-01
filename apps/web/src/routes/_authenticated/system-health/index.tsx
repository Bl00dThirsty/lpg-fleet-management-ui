import { createFileRoute } from '@tanstack/react-router'


import { SystemHealthPage } from '@/features/system-health'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/system-health/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: SystemHealthPage,


})