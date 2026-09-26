import { curated } from '@lpg/mock-data'
import type { User as CuratedUser } from '@lpg/types'
import type { MfaStatus } from '@lpg/types'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { useUsersStore } from '@/store/users-store'
import { makeStatusDisplay } from '@/lib/ui/status-display'
import { mfaStatusDisplay } from '@/lib/ui/status-display-mfa'

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

const LIVREUR_STATUS_LABELS: Record<LivreurStatus, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
}

const LIVREUR_STATUS_CLASSES: Record<LivreurStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  INACTIVE: 'bg-slate-100 text-slate-700',
}

/** Single source of truth for the livreur status UI (AGENTS.md §3). */
export const livreurStatusDisplay = makeStatusDisplay<LivreurStatus>({
  labels: LIVREUR_STATUS_LABELS,
  classes: LIVREUR_STATUS_CLASSES,
})

export function livreurStatusLabel(status: LivreurStatus): string {
  return livreurStatusDisplay.label(status)
}

export function mfaStatusLabel(status: MfaStatus): string {
  // Re-export the shared MFA display so consumers that already import
  // `mfaStatusLabel` from this module keep working.
  return mfaStatusDisplay.label(status)
}
