import { createFileRoute } from '@tanstack/react-router'


import { DeviceAssignmentsPage } from '@/features/device-assignments'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/device-assignments/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: DeviceAssignmentsPage,


})