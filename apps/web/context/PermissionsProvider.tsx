import { createContext, useContext, type ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { defineAbilitiesFor, type Role } from '@lpg/permissions'
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

  // Derive the session from the authenticated user (single source of truth).
  const session: MockSession | null = user
    ? { role: user.role as Role, orgName: user.email.split('@')[1] ?? 'lpg.cm' }
    : null

  const setSession = (newSession: MockSession | null) => {
    // Session is driven by the auth store; explicit set is a no-op for role
    // switcher but kept for API compatibility.
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
