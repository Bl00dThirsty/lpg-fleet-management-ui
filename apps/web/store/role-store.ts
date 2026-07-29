import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Role, ROLES } from '@/config/rbac/roles'

type RoleState = {
  activeRole: Role
  setActiveRole: (role: Role) => void
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      activeRole: 'SUPER_ADMIN',
      setActiveRole: (role) => set({ activeRole: role }),
    }),
    {
      name: 'lpg-active-role',
      partialize: (state) => ({ activeRole: state.activeRole }),
    }
  )
)

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}
