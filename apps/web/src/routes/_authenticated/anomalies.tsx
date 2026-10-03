import { createFileRoute, Outlet } from '@tanstack/react-router'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/anomalies')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: AnomaliesLayout,


})





function AnomaliesLayout() {


  return <Outlet />


}