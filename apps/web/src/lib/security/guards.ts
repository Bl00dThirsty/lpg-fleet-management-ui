import {
  hasPermission,
  hasEffectivePermission,
  type CustomPermissionRoles,
  type PermissionCode,
  type Role,
} from '@lpg/permissions'
import type { UserScope } from '@/features/scope/scope'

export const PERMISSION_DENIED = 'PERMISSION_DENIED'

export function assertPermission(role: Role, code: PermissionCode): void {
  if (!hasPermission(role, code)) throw new Error(PERMISSION_DENIED)
}

export function canActOnSite(scope: UserScope, siteId?: string): boolean {
  if (scope.view === 'org') return true
  if (!siteId) return false
  return scope.siteIds.includes(siteId)
}

export function assertSiteAccess(scope: UserScope, siteId?: string): void {
  if (!canActOnSite(scope, siteId)) throw new Error(PERMISSION_DENIED)
}

export function assertActorPermission(
  actor: { system_role: Role; custom_roles?: CustomPermissionRoles },
  code: PermissionCode
): void {
  if (!hasEffectivePermission(actor.system_role, code, actor.custom_roles))
    throw new Error(PERMISSION_DENIED)
}
