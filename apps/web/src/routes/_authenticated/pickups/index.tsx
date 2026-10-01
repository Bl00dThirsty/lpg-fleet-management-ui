import { createFileRoute } from '@tanstack/react-router'
import { PickupsPage } from '@/features/pickups'
import { useAuthStore } from '@/store/auth-store'
import type { Role } from '@/config/rbac/roles'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

function PickupsRouteComponent() {
  const role = useAuthStore((s) => s.user?.system_role) as Role | undefined
  return <PickupsPage role={role ?? 'LIVREUR'} />
}

export const Route = createFileRoute('/_authenticated/pickups/')({
  component: PickupsRouteComponent,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})
