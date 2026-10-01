import { createFileRoute, Outlet } from '@tanstack/react-router'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/dashboard')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: DashboardLayout,


})





function DashboardLayout() {


  return <Outlet />


}


