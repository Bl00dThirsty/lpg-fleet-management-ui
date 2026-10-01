import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/features/dashboard'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: () => <DashboardPage role='SUPERADMIN' />,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})