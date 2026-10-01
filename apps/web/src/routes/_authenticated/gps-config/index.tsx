import { createFileRoute } from '@tanstack/react-router'


import { GpsConfigPage } from '@/features/gps-config'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/gps-config/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: GpsConfigPage,


})