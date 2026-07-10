import { createContext, useContext, ReactNode, useState } from 'react';
import { defineAbilitiesFor, Role } from '@lpg/permissions';
import { AbilityContext } from './AbilityContext';

export const PermissionsContext = createContext<{
  role: Role;
  setRole: (role: Role) => void;
} | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  // For demo/development purposes, default to CSPH. In a real app, this comes from auth token
  const [role, setRole] = useState<Role>('CSPH');
  const ability = defineAbilitiesFor(role);

  return (
    <PermissionsContext.Provider value={{ role, setRole }}>
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
