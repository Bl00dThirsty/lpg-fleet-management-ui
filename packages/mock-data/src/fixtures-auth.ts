export interface AuthUserRecord {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'INTEGRATEUR' | 'AGENT' | 'MARKETEUR' | 'LIVREUR'
}

/**
 * Demo credentials. One user per role so the dev role-switcher and real login
 * both work against the mock backend. Passwords are intentionally simple.
 * This is simulation-only — the real backend owns identity and security.
 */
export const AUTH_FIXTURES: AuthUserRecord[] = [
  { id: 'user-1', email: 'superadmin@lpg.cm', password: 'password', firstName: 'Aminata', lastName: 'Ndiaye', role: 'SUPER_ADMIN' },
  { id: 'user-2', email: 'admin@lpg.cm', password: 'password', firstName: 'Paul', lastName: 'Biya', role: 'ADMIN' },
  { id: 'user-3', email: 'supervisor@lpg.cm', password: 'password', firstName: 'Chantal', lastName: 'Ebongo', role: 'SUPERVISOR' },
  { id: 'user-4', email: 'integrateur@lpg.cm', password: 'password', firstName: 'Marc', lastName: 'Fotso', role: 'INTEGRATEUR' },
  { id: 'user-5', email: 'agent@lpg.cm', password: 'password', firstName: 'Sandra', lastName: 'Mbarga', role: 'AGENT' },
  { id: 'user-6', email: 'marketeur@lpg.cm', password: 'password', firstName: 'Jean', lastName: 'Nkono', role: 'MARKETEUR' },
  { id: 'user-7', email: 'livreur@lpg.cm', password: 'password', firstName: 'Andre', lastName: 'Tchoumi', role: 'LIVREUR' },
]
