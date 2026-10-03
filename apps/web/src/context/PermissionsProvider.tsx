import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { defineAbilitiesFor } from '@lpg/permissions'
import { type Role } from '@/config/rbac/roles'
import { AbilityContext } from './AbilityContext'

export interface MockSession {
  role: Role
  orgName?: string
  subRole?: string
}

export const PermissionsContext = createContext<{
  session: MockSession | null
  setSession: (session: MockSession | null) => void
  logout: () => void
} | null>(null)

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const setActiveRole = useRoleStore((s) => s.setActiveRole)

  // Keep the UI's active role pinned to the authenticated user's real role.
  // This runs on every auth identity change (login, reload, switch), so a
  // stale or tampered `activeRole` can never present another role's UI.
  useEffect(() => {
    if (user) setActiveRole(user.system_role as Role)
  }, [user?.id, setActiveRole])

  // Derive the session from the authenticated user (single source of truth).
  const session: MockSession | null = user
    ? { role: user.system_role as Role, orgName: user.email.split('@')[1] ?? 'lpg.cm' }
    : null

  const setSession = (newSession: MockSession | null) => {
    // Session is driven by the auth store; kept for API compatibility.
    if (!newSession) logout()
  }

  const ability = defineAbilitiesFor(session?.role || ('GUEST' as Role))

  return (
    <PermissionsContext.Provider value={{ session, setSession, logout }}>
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }
  return context
}
