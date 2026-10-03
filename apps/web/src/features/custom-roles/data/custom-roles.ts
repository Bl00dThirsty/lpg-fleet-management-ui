import { custom_roles, curated, user_custom_roles } from '@lpg/mock-data'
import type { CustomRole, UserCustomRole } from '@lpg/types'

export interface CustomRoleView {
  id: string
  name: string
  description: string
  orgId: string
  orgName: string
  permissions: string[]
  permissionCount: number
  isActive: boolean
  members: { userId: string; fullName: string; siteId: string | null }[]
  memberCount: number
}

const ORG_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  curated.organizations.map((org) => [org.id, org.name]),
)

const USER_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  curated.users.map((user) => [user.id, `${user.first_name} ${user.last_name}`.trim()]),
)

function getPermissionCodes(permissionsJson: Record<string, unknown>): string[] {
  return Object.entries(permissionsJson)
    .filter(([, value]) => value === true)
    .map(([code]) => code)
}

export function getCustomRoles(source?: CustomRole[]): CustomRoleView[] {
  const roles = (source ?? (custom_roles as CustomRole[])).filter(
    (role) => role.deleted_at == null,
  )
  const assignments = user_custom_roles as UserCustomRole[]

  return roles.map((role) => {
    const members = assignments
      .filter((a) => a.custom_role_id === role.id)
      .map((a) => ({
        userId: a.user_id,
        fullName: USER_NAME_BY_ID[a.user_id] ?? a.user_id,
        siteId: a.site_id ?? null,
      }))
    const permissions = getPermissionCodes(role.permissions_json)

    return {
      id: role.id,
      name: role.name,
      description: role.description ?? '',
      orgId: role.org_id,
      orgName: ORG_NAME_BY_ID[role.org_id] ?? '',
      permissions,
      permissionCount: permissions.length,
      isActive: role.is_active,
      members,
      memberCount: members.length,
    }
  })
}

export function getActiveCustomRoleCount(): number {
  return getCustomRoles().filter((r) => r.isActive).length
}

export function getCustomRoleAssignmentCount(): number {
  return (user_custom_roles as UserCustomRole[]).length
}