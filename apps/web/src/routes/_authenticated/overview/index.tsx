import { createFileRoute } from '@tanstack/react-router'
import { useRoleStore } from '@/store/role-store'
import { DashboardPage } from '@/features/dashboard'

function OverviewRouteComponent() {
  const role = useRoleStore((s) => s.activeRole)
  return <DashboardPage role={role} />
}

export const Route = createFileRoute('/_authenticated/overview/')({
  component: OverviewRouteComponent,
})