import { describe, expect, it } from 'vitest'
import {
  getActiveCustomRoleCount,
  getCustomRoleAssignmentCount,
  getCustomRoles,
} from './custom-roles'

describe('custom-roles view-model', () => {
  it('lists custom roles with permission counts', () => {
    const roles = getCustomRoles()
    expect(roles.length).toBeGreaterThanOrEqual(1)
    for (const role of roles) {
      expect(role.name).toBeTruthy()
      expect(role.permissionCount).toBeGreaterThanOrEqual(1)
      expect(role.permissions).toHaveLength(role.permissionCount)
      expect(role.orgName).toBeTruthy()
    }
  })

  it('resolves member counts from assignments', () => {
    const roles = getCustomRoles()
    const totalAssignments = roles.reduce((acc, r) => acc + r.memberCount, 0)
    expect(totalAssignments).toBe(getCustomRoleAssignmentCount())
  })

  it('tracks active roles', () => {
    expect(getActiveCustomRoleCount()).toBe(getCustomRoles().filter((r) => r.isActive).length)
  })

  it('excludes soft-deleted roles from the live list', () => {
    const base = getCustomRoles()
    const now = new Date().toISOString()
    const source: import('@lpg/types').CustomRole[] = [
      {
        id: 'role-live',
        name: 'Live',
        description: 'test',
        org_id: base[0]?.orgId ?? 'org-1',
        permissions_json: { 'users.read': true },
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'role-deleted',
        name: 'Supprimé',
        description: 'test',
        org_id: base[0]?.orgId ?? 'org-1',
        permissions_json: { 'users.read': true },
        is_active: true,
        deleted_at: now,
        created_at: now,
        updated_at: now,
      },
    ]
    const result = getCustomRoles(source)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('role-live')
    expect(result.some((r) => r.id === 'role-deleted')).toBe(false)
  })
})