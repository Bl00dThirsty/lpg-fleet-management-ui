import { create } from 'zustand'
import { type Role, ROLES } from '@/config/rbac/roles'
import { useAuthStore } from '@/store/auth-store'

type RoleState = {
  activeRole: Role
  setActiveRole: (role: Role) => void
}

// No privileged default, never persisted. The active role is a derived value:
// it follows the authenticated user's `system_role` (see `PermissionsProvider`,
// which reconciles it on every auth change). It starts at the lowest-privilege
// role so a pre-login / non-authenticated render can never present admin UI.
const initialRole: Role =
  (useAuthStore.getState().user?.system_role as Role | undefined) ?? 'LIVREUR'

export const useRoleStore = create<RoleState>()((set) => ({
  activeRole: initialRole,
  setActiveRole: (role) => set({ activeRole: role }),
}))

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}
