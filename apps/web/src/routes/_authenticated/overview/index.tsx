import { createFileRoute, redirect } from '@tanstack/react-router'
import { useRoleStore } from '@/store/role-store'
import { DashboardPage } from '@/features/dashboard'

function OverviewRouteComponent() {
  const role = useRoleStore((s) => s.activeRole)
  return <DashboardPage role={role} />
}

export const Route = createFileRoute('/_authenticated/overview/')({
  beforeLoad: () => {
    // L'Intégrateur a son propre tableau de bord (parc appareils IoT) :
    // /overview retombe sinon sur le dashboard national SUPERADMIN.
    const role = useRoleStore.getState().activeRole
    if (role === 'INTEGRATEUR') {
      throw redirect({ to: '/dashboard-integrateur' })
    }
  },
  component: OverviewRouteComponent,
})
