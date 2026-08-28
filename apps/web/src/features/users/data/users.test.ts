import { describe, expect, it } from 'vitest'
import { getUsers, userStatusLabel, mfaStatusLabel } from './users'

describe('users view-model', () => {
  it('projects the curated users fixture into UserView rows', () => {
    const users = getUsers()
    expect(users.length).toBe(29)

    const superadmin = users.find((u) => u.role === 'SUPERADMIN')
    expect(superadmin).toBeDefined()
    expect(superadmin!.roleLabel).toBe('Super Admin')
    expect(superadmin!.fullName).toBeTruthy()
    expect(superadmin!.status).toBe('ACTIVE')

    const roles = new Set(users.map((u) => u.role))
    expect(roles.size).toBe(8)
  })

  it('resolves the org display name from the org FK', () => {
    const users = getUsers()
    const withOrg = users.filter((u) => u.orgId && u.orgName !== '—')
    expect(withOrg.length).toBe(users.length)
  })

  it('labels statuses in French', () => {
    expect(userStatusLabel('ACTIVE')).toBe('Actif')
    expect(userStatusLabel('INACTIVE')).toBe('Inactif')
    expect(mfaStatusLabel('DISABLED')).toBe('Désactivé')
  })
})