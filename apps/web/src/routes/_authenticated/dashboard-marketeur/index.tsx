import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/features/dashboard'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

export const Route = createFileRoute('/_authenticated/dashboard-marketeur/')({
  component: () => <DashboardPage role='MARKETEUR' />,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})