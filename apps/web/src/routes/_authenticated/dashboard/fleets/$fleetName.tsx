import { createFileRoute } from '@tanstack/react-router'
import { DashboardFleetDetail } from '@/features/dashboard/components/dashboard-fleet-detail'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'
import { dashboardSearchSchema } from '@/features/dashboard/data/dashboard-query'

export const Route = createFileRoute('/_authenticated/dashboard/fleets/$fleetName')({
  // The period, range and fleet that opened the page travel in the search so the
  // dashboard can be restored exactly on the way back.
  validateSearch: dashboardSearchSchema,
  component: DashboardFleetDetail,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})
