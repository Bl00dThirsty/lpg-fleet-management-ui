import { createFileRoute } from '@tanstack/react-router'


import { MaintenancePage } from '@/features/maintenance'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/maintenance/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: MaintenancePage,


})