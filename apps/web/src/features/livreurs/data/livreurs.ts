import { curated } from '@lpg/mock-data'
import type { User as CuratedUser } from '@lpg/types'
import type { MfaStatus } from '@lpg/types'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { useUsersStore } from '@/store/users-store'

export type LivreurStatus = 'ACTIVE' | 'INACTIVE'

export interface LivreurView {
  id: string
  email: string
  fullName: string
  orgId: string
  orgName: string
  status: LivreurStatus
  mfaStatus: MfaStatus
  lastLogin: string
  created_at: string
}

const ORG_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  curated.organizations.map((org) => [org.id, org.name]),
)

export function getLivreurs(
  source = useUsersStore.getState().users,
  scope = getScope(useAuthStore.getState().user),
): LivreurView[] {
  const users = source as CuratedUser[]
  return users
    .filter(
      (user) =>
        user.system_role === 'LIVREUR' &&
        user.deleted_at == null &&
        (scope.view === 'org' || user.org_id === scope.orgId),
    )
    .map((user) => ({
      id: user.id,
      email: user.email,
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      orgId: user.org_id,
      orgName: ORG_NAME_BY_ID[user.org_id] ?? '—',
      status: user.is_active ? 'ACTIVE' : 'INACTIVE',
      mfaStatus: user.mfa_status ?? 'DISABLED',
      lastLogin: user.last_login_at ?? '—',
      created_at: user.created_at ?? '—',
    }))
}

export const LIVREUR_STATUS_LABELS: Record<LivreurStatus, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
}

export function livreurStatusLabel(status: LivreurStatus): string {
  return LIVREUR_STATUS_LABELS[status]
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
