import { describe, expect, it, beforeEach } from 'vitest'
import { useUsersStore } from './users-store'
import { useAuthStore } from './auth-store'
import { curated } from '@lpg/mock-data'
import { getLivreurs } from '@/features/livreurs/data/livreurs'

const USER_FIXTURE_ID = 'user-0001-csph-super'
const USER_FIXTURE_EMAIL = 'b.ndoumbetane@csph.cm'
const USER_ACTIVE_ID = 'user-0007-sctm-marketeur'
const SCTM_ORG = 'org-0002-sctm-0000-000000000001'
const OTHER_ORG = 'org-0003-total-0000-000000000001'

const AUTH_BASE = {
  id: 'u-auth',
  email: 'auth@csph.cm',
  first_name: 'Auth',
  last_name: 'User',
  site_ids: [] as string[],
}

function setAuthUser(
  system_role: 'SUPERADMIN' | 'ADMIN' | 'AGENT' | 'MARKETEUR' | 'TRANSPORTEUR',
  org_id?: string,
) {
  const org_type =
    system_role === 'MARKETEUR'
      ? ('MARKETEUR' as const)
      : system_role === 'TRANSPORTEUR'
        ? ('TRANSPORTEUR' as const)
        : ('REGULATEUR' as const)
  useAuthStore.setState({
    user: { ...AUTH_BASE, id: `u-${system_role.toLowerCase()}`, system_role, org_type, org_id },
  })
}

function newUser(overrides: Partial<Record<'system_role' | 'org_id', string>> = {}) {
  return {
    first_name: 'Nouveau',
    last_name: 'Test',
    email: `nouveau-${Math.random()}@test.cm`,
    system_role: (overrides.system_role ?? 'MARKETEUR') as 'MARKETEUR',
    org_id: overrides.org_id ?? SCTM_ORG,
    is_active: true,
  }
}

function livreurId(orgId = SCTM_ORG) {
  const livreur = curated.users.find(
    (user) => user.system_role === 'LIVREUR' && user.org_id === orgId,
  )
  if (!livreur) throw new Error(`No livreur fixture for ${orgId}`)
  return livreur.id
}

function freshSeed() {
  return {
    users: (curated.users as ReturnType<typeof useUsersStore.getState>['users']).map(
      (u) => ({ ...u }),
    ),
  }
}

describe('users store', () => {
  beforeEach(() => {
    useUsersStore.setState(freshSeed())
    setAuthUser('SUPERADMIN')
  })

  it('seeds with the curated users', () => {
    expect(useUsersStore.getState().users.length).toBe(curated.users.length)
  })

  it('does not mutate the shared curated fixture on init', () => {
    const first = curated.users[0]
    if (!first) throw new Error('expected curated.users[0] to exist')
    const idBefore = first.id
    useUsersStore.getState().updateUser(idBefore, { email: 'x@y.z' })
    expect(curated.users[0]?.id).toBe(idBefore)
    expect(curated.users[0]?.email).not.toBe('x@y.z')
  })

  describe('updateUser', () => {
    it('patches only the specified fields', () => {
      const before = useUsersStore.getState().users.find((u) => u.id === USER_FIXTURE_ID)
      useUsersStore.getState().updateUser(USER_FIXTURE_ID, {
        email: 'new@example.cm',
      })
      const after = useUsersStore.getState().users.find((u) => u.id === USER_FIXTURE_ID)
      expect(after?.email).toBe('new@example.cm')
      expect(after?.first_name).toBe(before?.first_name)
      expect(after?.last_name).toBe(before?.last_name)
      expect(after?.system_role).toBe(before?.system_role)
    })

    it('does nothing when the id does not exist', () => {
      const lenBefore = useUsersStore.getState().users.length
      useUsersStore.getState().updateUser('does-not-exist', { email: 'x@y.z' })
      expect(useUsersStore.getState().users.length).toBe(lenBefore)
    })
  })

  describe('setStatus', () => {
    it('flips is_active to false', () => {
      useUsersStore.getState().setStatus(USER_ACTIVE_ID, false)
      const u = useUsersStore.getState().users.find((x) => x.id === USER_ACTIVE_ID)
      expect(u?.is_active).toBe(false)
    })

    it('flips is_active back to true', () => {
      useUsersStore.getState().setStatus(USER_ACTIVE_ID, false)
      useUsersStore.getState().setStatus(USER_ACTIVE_ID, true)
      const u = useUsersStore.getState().users.find((x) => x.id === USER_ACTIVE_ID)
      expect(u?.is_active).toBe(true)
    })
  })

  describe('createUser', () => {
    beforeEach(() => {
      useAuthStore.setState({ user: null })
      // The hierarchy guard reads the live auth state; an authenticated
      // SUPERADMIN clears the role check so the plain mutation tests exercise
      // the prepend behaviour, not the guard.
      setAuthUser('SUPERADMIN')
    })

    it('prepends a new user with generated id and timestamps', () => {
      const before = useUsersStore.getState().users.length
      useUsersStore.getState().createUser(newUser() as never)
      const after = useUsersStore.getState().users.length
      expect(after).toBe(before + 1)
      const first = useUsersStore.getState().users[0]
      expect(first?.email).toContain('nouveau-')
      expect(first?.id).toBeDefined()
      expect(first?.created_at).toBeDefined()
    })

    it('does not mutate the shared curated fixture on init', () => {
      const seeded = curated.users.length
      useUsersStore.getState().createUser(newUser() as never)
      expect(curated.users.length).toBe(seeded)
    })

    describe('hierarchy & org-scope guards', () => {
      it('rejects creating an ADMIN when the creator is a MARKETEUR', () => {
        setAuthUser('MARKETEUR', SCTM_ORG)
        expect(() =>
          useUsersStore.getState().createUser({
            ...newUser({ system_role: 'ADMIN' }),
          } as never),
        ).toThrow('Impossible de créer ce rôle depuis le rôle courant.')
      })

      it('rejects creating a SUPERADMIN when the creator is a MARKETEUR', () => {
        setAuthUser('MARKETEUR', SCTM_ORG)
        expect(() =>
          useUsersStore.getState().createUser({
            ...newUser({ system_role: 'SUPERADMIN' }),
          } as never),
        ).toThrow('Impossible de créer ce rôle depuis le rôle courant.')
      })

      it('allows a SUPERADMIN to create an ADMIN', () => {
        setAuthUser('SUPERADMIN')
        const before = useUsersStore.getState().users.length
        useUsersStore.getState().createUser({
          ...newUser({ system_role: 'ADMIN', org_id: OTHER_ORG }),
        } as never)
        expect(useUsersStore.getState().users.length).toBe(before + 1)
        expect(useUsersStore.getState().users[0]?.system_role).toBe('ADMIN')
      })

      it('rejects a MARKETEUR creating a user outside their own org', () => {
        setAuthUser('MARKETEUR', SCTM_ORG)
        expect(() =>
          useUsersStore.getState().createUser({
            ...newUser({ system_role: 'MARKETEUR', org_id: OTHER_ORG }),
          } as never),
        ).toThrow('Accès refusé.')
      })

      it('allows a MARKETEUR to create a user inside their own org', () => {
        setAuthUser('MARKETEUR', SCTM_ORG)
        const before = useUsersStore.getState().users.length
        useUsersStore.getState().createUser(newUser() as never)
        expect(useUsersStore.getState().users.length).toBe(before + 1)
        expect(useUsersStore.getState().users[0]?.org_id).toBe(SCTM_ORG)
      })
    })
  })

  describe('deleteUser', () => {
    it('soft-deletes a livreur and hides it from the livreur view', () => {
      setAuthUser('SUPERADMIN')
      const id = livreurId()
      const lenBefore = getLivreurs().length

      useUsersStore.getState().deleteUser(id)

      const deleted = useUsersStore.getState().users.find((u) => u.id === id)
      expect(deleted?.deleted_at).toBeTruthy()
      expect(getLivreurs()).toHaveLength(lenBefore - 1)
    })

    it('does nothing on a missing id', () => {
      const lenBefore = useUsersStore.getState().users.length
      useUsersStore.getState().deleteUser('does-not-exist')
      expect(useUsersStore.getState().users.length).toBe(lenBefore)
    })
  })

  describe('livreur permissions and scope', () => {
    it('allows a marketeur to create and update only livreurs in its own org', () => {
      setAuthUser('MARKETEUR', SCTM_ORG)
      const before = useUsersStore.getState().users.length

      useUsersStore.getState().createUser({
        ...newUser({ system_role: 'LIVREUR', org_id: SCTM_ORG }),
      } as never)
      expect(useUsersStore.getState().users).toHaveLength(before + 1)

      expect(() =>
        useUsersStore.getState().createUser({
          ...newUser({ system_role: 'LIVREUR', org_id: OTHER_ORG }),
        } as never),
      ).toThrow('Accès refusé.')

      expect(() =>
        useUsersStore.getState().updateUser(livreurId(OTHER_ORG), {
          email: 'cross-org@example.cm',
        }),
      ).toThrow('Accès refusé.')
    })

    it('rejects livreur mutations for an agent with read-only access', () => {
      setAuthUser('AGENT')
      const id = livreurId()

      expect(() => useUsersStore.getState().setStatus(id, false)).toThrow('Accès refusé.')
      expect(() => useUsersStore.getState().deleteUser(id)).toThrow('Accès refusé.')
    })

    it('allows an admin to manage livreurs across organizations', () => {
      setAuthUser('ADMIN', OTHER_ORG)
      const id = livreurId(SCTM_ORG)

      useUsersStore.getState().updateUser(id, { email: 'admin-edit@example.cm' })
      useUsersStore.getState().setStatus(id, false)

      const updated = useUsersStore.getState().users.find((user) => user.id === id)
      expect(updated?.email).toBe('admin-edit@example.cm')
      expect(updated?.is_active).toBe(false)
    })
  })

  describe('resetPassword', () => {
    it('does not mutate the user row (acked via toast at the UI layer)', () => {
      const before = useUsersStore.getState().users.find((u) => u.id === USER_FIXTURE_ID)
      useUsersStore.getState().resetPassword(USER_FIXTURE_ID)
      const after = useUsersStore.getState().users.find((u) => u.id === USER_FIXTURE_ID)
      expect(after).toEqual(before)
    })
  })

  describe('lockUntil / unlock', () => {
    it('sets locked_until to a future iso when no arg passed', () => {
      useUsersStore.getState().lockUntil(USER_FIXTURE_ID)
      const u = useUsersStore.getState().users.find((x) => x.id === USER_FIXTURE_ID)
      expect(u?.locked_until).not.toBeNull()
      expect(typeof u?.locked_until).toBe('string')
    })

    it('sets a custom iso and unlock clears it back to null', () => {
      const stamp = '2030-01-01T00:00:00Z'
      useUsersStore.getState().lockUntil(USER_FIXTURE_ID, stamp)
      const locked = useUsersStore.getState().users.find((x) => x.id === USER_FIXTURE_ID)
      expect(locked?.locked_until).toBe(stamp)
      useUsersStore.getState().unlock(USER_FIXTURE_ID)
      const freed = useUsersStore.getState().users.find((x) => x.id === USER_FIXTURE_ID)
      expect(freed?.locked_until).toBeNull()
    })
  })

  describe('multi-mutation shape', () => {
    it('after update + status-flip + lock, only the targeted row changed', () => {
      const othersBefore = useUsersStore
        .getState()
        .users.filter((u) => u.id !== USER_FIXTURE_ID)
        .map((u) => ({ id: u.id, email: u.email, is_active: u.is_active, locked_until: u.locked_until }))

      useUsersStore.getState().updateUser(USER_FIXTURE_ID, { email: 'locked@example.cm' })
      useUsersStore.getState().setStatus(USER_FIXTURE_ID, false)
      useUsersStore.getState().lockUntil(USER_FIXTURE_ID, '2030-12-31T00:00:00Z')

      const othersAfter = useUsersStore
        .getState()
        .users.filter((u) => u.id !== USER_FIXTURE_ID)
        .map((u) => ({ id: u.id, email: u.email, is_active: u.is_active, locked_until: u.locked_until }))

      expect(othersAfter).toEqual(othersBefore)

      const target = useUsersStore.getState().users.find((u) => u.id === USER_FIXTURE_ID)
      expect(target?.email).toBe('locked@example.cm')
      expect(target?.is_active).toBe(false)
      expect(target?.locked_until).toBe('2030-12-31T00:00:00Z')
    })
  })
})

describe('users store fixture id sanity', () => {
  it('fixture ids exist in curated.users', () => {
    const ids = new Set(curated.users.map((u) => u.id))
    expect(ids.has(USER_FIXTURE_ID)).toBe(true)
    expect(ids.has(USER_ACTIVE_ID)).toBe(true)
  })

  it('fixture email matches seed', () => {
    const u = curated.users.find((u) => u.id === USER_FIXTURE_ID)
    expect(u?.email).toBe(USER_FIXTURE_EMAIL)
  })
})
