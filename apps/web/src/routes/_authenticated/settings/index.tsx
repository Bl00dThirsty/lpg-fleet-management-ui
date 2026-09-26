import { createFileRoute, redirect } from '@tanstack/react-router'
import { hasPermission } from '@lpg/permissions'
import { settingsLandingPath } from '@/config/rbac/route-access'
import { useAuthStore } from '@/store/auth-store'
import type { Role } from '@/config/rbac/roles'

export const Route = createFileRoute('/_authenticated/settings/')({
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.system_role as Role | undefined
    const hasSettingsAccess = Boolean(
      role &&
        (hasPermission(role, 'settings.read') || hasPermission(role, 'settings.write')),
    )
    throw redirect({ to: settingsLandingPath(hasSettingsAccess) })
  },
})
