import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useRoleStore } from '@/store/role-store'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'
import { getScope } from '@/features/scope/scope'
import { buildDashboardView } from '@/features/dashboard/data/dashboard'
import { OverviewPage } from '@/features/overview'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

function OverviewRouteComponent() {
  const role = useRoleStore((s) => s.activeRole)
  const user = useAuthStore((s) => s.user)
  const storeTours = useToursStore((s) => s.tours)
  const storeCheckpoints = useToursStore((s) => s.checkpoints)
  const scope = useMemo(() => getScope(user), [user])
  const dashboard = useMemo(
    () => buildDashboardView(role, scope),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, scope, storeTours, storeCheckpoints]
  )
  return <OverviewPage role={role} dashboard={dashboard} />
}

export const Route = createFileRoute('/_authenticated/overview/')({
  component: OverviewRouteComponent,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})