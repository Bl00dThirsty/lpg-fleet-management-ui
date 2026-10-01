import { curated } from '@lpg/mock-data'
import type { Role } from '@lpg/types'

export interface PasswordUserView {
  id: string
  email: string
  fullName: string
  role: string
  mustChange: boolean
  lastLogin: string | null
  lockedUntil: string | null
}

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Administrateur',
  SUPERVISOR: 'Superviseur',
  INTEGRATEUR: 'Intégrateur',
  AGENT: 'Agent validateur',
  MARKETEUR: 'Marketeur',
  TRANSPORTEUR: 'Transporteur',
  LIVREUR: 'Livreur',
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

export function getPasswordUsers(): PasswordUserView[] {
  return (curated.users as {
    id: string
    email: string
    first_name: string
    last_name: string
    system_role: Role
    must_change_password?: boolean
    last_login_at?: string | null
    locked_until?: string | null
  }[]).map((user) => ({
    id: user.id,
    email: user.email,
    fullName: `${user.first_name} ${user.last_name}`.trim(),
    role: roleLabel(user.system_role),
    mustChange: user.must_change_password ?? false,
    lastLogin: user.last_login_at ?? null,
    lockedUntil: user.locked_until ?? null,
  }))
}

export function getPasswordSummary() {
  const rows = getPasswordUsers()
  return {
    total: rows.length,
    mustChange: rows.filter((r) => r.mustChange).length,
    locked: rows.filter((r) => r.lockedUntil).length,
  }
}