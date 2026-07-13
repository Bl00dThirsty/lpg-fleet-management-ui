import { createContext, useContext, ReactNode, useState } from 'react';
import { defineAbilitiesFor, Role } from '@lpg/permissions';
import { AbilityContext } from './AbilityContext';

export interface MockSession {
  role: Role;
  orgName: string;
  subRole?: string; // e.g. "Superadmin", "Admin Info"
}

export const PermissionsContext = createContext<{
  session: MockSession | null;
  setSession: (session: MockSession | null) => void;
  logout: () => void;
} | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<MockSession | null>(() => {
    const saved = localStorage.getItem('lpg-mock-session');
    return saved ? JSON.parse(saved) : null;
  });

  const setSession = (newSession: MockSession | null) => {
    setSessionState(newSession);
    if (newSession) {
      localStorage.setItem('lpg-mock-session', JSON.stringify(newSession));
    } else {
      localStorage.removeItem('lpg-mock-session');
    }
  };

  const logout = () => {
    setSession(null);
  };

  // If no session, they have a generic "GUEST" ability with no access (empty ability)
  const ability = defineAbilitiesFor(session?.role || ('GUEST' as Role));

  return (
    <PermissionsContext.Provider value={{ session, setSession, logout }}>
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
