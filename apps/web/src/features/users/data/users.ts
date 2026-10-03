import { curated } from '@lpg/mock-data'
import type {
  User as CuratedUser,
  MfaStatus,
  Organization,
} from '@lpg/types'
import type { Role } from '@lpg/permissions'
import { ROLE_LABELS } from '@/config/rbac/roles'
import { useUsersStore } from '@/store/users-store'

export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface UserView {
  id: string
  email: string
  fullName: string
  role: Role
  roleLabel: string
  orgId: string
  orgName: string
  status: UserStatus
  mfaStatus: MfaStatus
  lastLogin: string
  created_at: string
  updated_at: string
}

const ORG_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  (curated.organizations as Organization[]).map((org) => [org.id, org.name]),
)

export function userToView(user: CuratedUser): UserView {
  const role = user.system_role as Role
  return {
    id: user.id,
    email: user.email,
    fullName: `${user.first_name} ${user.last_name}`.trim(),
    role,
    roleLabel: ROLE_LABELS[role] ?? role,
    orgId: user.org_id,
    orgName: ORG_NAME_BY_ID[user.org_id] ?? '—',
    status: user.is_active ? 'ACTIVE' : 'INACTIVE',
    mfaStatus: user.mfa_status ?? 'DISABLED',
    lastLogin: user.last_login_at ?? '—',
    created_at: user.created_at ?? '—',
    updated_at: user.updated_at ?? '—',
  }
}

export function getUsers(): UserView[] {
  return useUsersStore.getState().users.map(userToView)
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
}

export function userStatusLabel(status: UserStatus): string {
  return USER_STATUS_LABELS[status]
}

export const MFA_STATUS_LABELS: Record<MfaStatus, string> = {
  DISABLED: 'Désactivé',
  PENDINGSETUP: 'En attente de configuration',
  ENABLED: 'Activé',
  LOCKED: 'Verrouillé',
}

export function mfaStatusLabel(status: MfaStatus): string {
  return MFA_STATUS_LABELS[status]
}
