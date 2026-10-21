import { createFileRoute } from '@tanstack/react-router'
import { useRoleStore } from '@/store/role-store'
import { DashboardPage } from '@/features/dashboard'
import { IntegrateurDashboardPage } from '@/features/integrateur-dashboard'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

function OverviewRouteComponent() {
  const role = useRoleStore((s) => s.activeRole)
  if (role === 'INTEGRATEUR') return <IntegrateurDashboardPage />
  return <DashboardPage role={role} />
}

export const Route = createFileRoute('/_authenticated/overview/')({
  component: OverviewRouteComponent,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})
