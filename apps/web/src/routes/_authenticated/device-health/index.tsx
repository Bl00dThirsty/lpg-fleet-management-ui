import { createFileRoute } from '@tanstack/react-router'


import { DeviceHealthPage } from '@/features/device-health'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/device-health/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: DeviceHealthPage,


})