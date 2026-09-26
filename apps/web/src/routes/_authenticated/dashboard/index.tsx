import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/features/dashboard'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'
import { dashboardSearchSchema } from '@/features/dashboard/data/dashboard-query'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  validateSearch: dashboardSearchSchema,
  component: () => <DashboardPage />,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})
