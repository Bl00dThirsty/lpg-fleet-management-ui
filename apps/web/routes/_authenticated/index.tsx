import { createFileRoute, redirect } from '@tanstack/react-router'
import { useRoleStore } from '@/store/role-store'
import { roleSlug } from '@/config/rbac/sidebar-by-role'

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: () => {
    const role = useRoleStore.getState().activeRole
    throw redirect({ to: '/$role', params: { role: roleSlug(role) } })
  },
})
