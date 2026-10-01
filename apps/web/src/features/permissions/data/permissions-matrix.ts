import {
  PERMISSION_CATALOG,
  PERMISSION_CATEGORIES,
  ROLE_GRANTS,
  ROLE_LABELS,
  ROLES,
  type PermissionCategory,
  type PermissionCode,
} from '@lpg/permissions'
import type { Role } from '@lpg/types'

export type { PermissionCategory, PermissionCode }

export interface PermissionMatrixRow {
  code: PermissionCode
  label: string
  category: PermissionCategory
  grants: Record<Role, boolean>
}

const MATRIX_ROLES: readonly Role[] = ROLES

export function getPermissionMatrix(): PermissionMatrixRow[] {
  return PERMISSION_CATALOG.map((entry) => ({
    code: entry.code,
    label: entry.label,
    category: entry.category,
    grants: Object.fromEntries(
      MATRIX_ROLES.map((role) => [role, ROLE_GRANTS[role].includes(entry.code)]),
    ) as Record<Role, boolean>,
  }))
}

export function getMatrixRoles(): readonly Role[] {
  return MATRIX_ROLES
}

export function getMatrixCategories(): readonly { id: PermissionCategory; label: string }[] {
  return PERMISSION_CATEGORIES
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role]
}

export function getPermissionCountByRole(): Record<Role, number> {
  return Object.fromEntries(
    MATRIX_ROLES.map((role) => [role, ROLE_GRANTS[role].length]),
  ) as Record<Role, number>
}