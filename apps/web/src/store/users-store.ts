import { create } from 'zustand'
import { curated } from '@lpg/mock-data'
import { getCreatableRoles, hasPermission } from '@lpg/permissions'
import type { Role, User as CuratedUser } from '@lpg/types'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'

export type UserPatch = Partial<Pick<CuratedUser,
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'system_role'
  | 'org_id'
  | 'is_active'
>>

interface UsersState {
  users: CuratedUser[]
  createUser: (user: Omit<CuratedUser, 'id' | 'created_at' | 'updated_at'>) => void
  updateUser: (id: string, patch: UserPatch) => void
  setStatus: (id: string, active: boolean) => void
  deleteUser: (id: string) => void
  resetPassword: (id: string) => void
  resetMfa: (id: string) => void
  lockUntil: (id: string, iso?: string | null) => void
  unlock: (id: string) => void
}

export const useUsersStore = create<UsersState>()((set, get) => ({
  users: (curated.users as CuratedUser[]).map((u) => ({ ...u })),

  createUser(user) {
    // Defense in depth: the sheet already restricts the role select via
    // getCreatableRoles, but a direct store call must be gated too. A creator
    // may only create roles at or below their own hierarchy level, and a
    // non-REGULATEUR (MARKETEUR/TRANSPORTEUR/AGENT/LIVREUR) may only create
    // users inside their own org.
    const authUser = useAuthStore.getState().user
    const role = (authUser?.system_role ?? 'LIVREUR') as Role
    const creatable = getCreatableRoles(role)
    if (!creatable.includes(user.system_role)) {
      throw new Error('Impossible de créer ce rôle depuis le rôle courant.')
    }
    if (user.system_role === 'LIVREUR' && !hasPermission(role, 'livreurs.write')) {
      throw new Error('Accès refusé.')
    }
    const scope = getScope(authUser)
    if (scope.view !== 'org' && user.org_id !== scope.orgId) {
      throw new Error('Accès refusé.')
    }
    const id = `user-${crypto.randomUUID().slice(0, 8)}`
    const now = new Date().toISOString()
    set((s) => ({
      users: [{ ...user, id, created_at: now, updated_at: now } as CuratedUser, ...s.users],
    }))
  },

  updateUser(id, patch) {
    const authUser = useAuthStore.getState().user
    const role = (authUser?.system_role ?? 'LIVREUR') as Role
    const target = get().users.find((user) => user.id === id)
    if (!target) return
    if (target.system_role === 'LIVREUR' || role === 'LIVREUR') {
      if (!hasPermission(role, 'livreurs.write')) throw new Error('Accès refusé.')
      if (patch.system_role && patch.system_role !== 'LIVREUR') {
        throw new Error('Le rôle LIVREUR est verrouillé.')
      }
      assertLivreurOrgScope(authUser, target.org_id)
    } else if (!hasPermission(role, 'users.write')) {
      throw new Error('Accès refusé.')
    }
    const creatable = getCreatableRoles(role)
    if (patch.system_role && !creatable.includes(patch.system_role)) {
      throw new Error('Impossible de créer ce rôle depuis le rôle courant.')
    }
    const scope = getScope(authUser)
    if (scope.view !== 'org' && patch.org_id && patch.org_id !== scope.orgId) {
      throw new Error('Accès refusé.')
    }
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, ...patch } : u,
      ),
    }))
  },

  setStatus(id, active) {
    const target = get().users.find((user) => user.id === id)
    const authUser = useAuthStore.getState().user
    const role = (authUser?.system_role ?? 'LIVREUR') as Role
    if (target?.system_role === 'LIVREUR' || role === 'LIVREUR') {
      if (!hasPermission(role, 'livreurs.write')) throw new Error('Accès refusé.')
      if (target) assertLivreurOrgScope(authUser, target.org_id)
    } else if (!hasPermission(role, 'users.write')) {
      throw new Error('Accès refusé.')
    }
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, is_active: active } : u,
      ),
    }))
  },

  deleteUser(id) {
    const target = get().users.find((user) => user.id === id)
    if (!target) return
    const authUser = useAuthStore.getState().user
    const role = (authUser?.system_role ?? 'LIVREUR') as Role
    if (target.system_role === 'LIVREUR' || role === 'LIVREUR') {
      if (!hasPermission(role, 'livreurs.manage')) throw new Error('Accès refusé.')
      assertLivreurOrgScope(authUser, target.org_id)
    } else if (!hasPermission(role, 'users.delete')) {
      throw new Error('Accès refusé.')
    }
    const now = new Date().toISOString()
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, deleted_at: now, updated_at: now } : u,
      ),
    }))
  },

  resetPassword(id) {
    const u = get().users.find((x) => x.id === id)
    if (!u) return
    const role = (useAuthStore.getState().user?.system_role ?? 'LIVREUR') as Role
    if (!hasPermission(role, 'users.reset')) throw new Error('Accès refusé.')
  },

  resetMfa(id) {
    const target = get().users.find((x) => x.id === id)
    if (!target) return
    const role = (useAuthStore.getState().user?.system_role ?? 'LIVREUR') as Role
    if (target.system_role === 'LIVREUR' || role === 'LIVREUR') {
      if (!hasPermission(role, 'livreurs.write')) throw new Error('Accès refusé.')
      assertLivreurOrgScope(useAuthStore.getState().user, target.org_id)
    } else if (!hasPermission(role, 'users.write')) {
      throw new Error('Accès refusé.')
    }
    const now = new Date().toISOString()
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, mfa_status: 'DISABLED', updated_at: now } : u,
      ),
    }))
  },

  lockUntil(id, iso) {
    assertUsersWrite()
    const stamp = iso ?? new Date(Date.now() + 15 * 60 * 1000).toISOString()
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, locked_until: stamp } : u,
      ),
    }))
  },

  unlock(id) {
    assertUsersWrite()
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, locked_until: null } : u,
      ),
    }))
  },
}))

function assertUsersWrite() {
  const role = (useAuthStore.getState().user?.system_role ?? 'LIVREUR') as Role
  if (!hasPermission(role, 'users.write')) throw new Error('Accès refusé.')
}

function assertLivreurOrgScope(authUser: Parameters<typeof getScope>[0], targetOrgId: string) {
  const scope = getScope(authUser)
  if (scope.view !== 'org' && scope.orgId !== targetOrgId) {
    throw new Error('Accès refusé.')
  }
}

export function listOrgsForRole(role: Role): string[] {
  const seen = new Set<string>()
  for (const u of useUsersStore.getState().users) {
    if (u.system_role === role && u.org_id) seen.add(u.org_id)
  }
  return [...seen]
}
