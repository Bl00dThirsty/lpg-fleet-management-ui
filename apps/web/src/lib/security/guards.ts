import { hasPermission, type PermissionCode, type Role } from '@lpg/permissions'
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
