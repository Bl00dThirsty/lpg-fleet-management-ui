/**
 * Permission gating for CRUD actions, derived from the active role
 * (`useRoleStore`) and `@lpg/permissions` `can()`. UI gating is UX only —
 * the backend remains the real enforcement boundary.
 */

import { useRoleStore } from '@/store/role-store'
import { can, type Resource } from '@lpg/permissions'

export interface EntityPermissions {
  canRead: boolean
  canCreate: boolean
  canWrite: boolean
  canDelete: boolean
}

export function useEntityPermission(resource: Resource): EntityPermissions {
  const activeRole = useRoleStore((s) => s.activeRole)
  return {
    canRead: can(activeRole, 'read', resource),
    canCreate: can(activeRole, 'create', resource),
    canWrite: can(activeRole, 'write', resource),
    canDelete: can(activeRole, 'delete', resource),
  }
}
