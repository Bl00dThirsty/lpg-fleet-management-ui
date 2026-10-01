import { describe, expect, it } from 'vitest'
import {
  getPermissionMatrix,
  getMatrixRoles,
  getMatrixCategories,
  roleLabel,
  getPermissionCountByRole,
} from './permissions-matrix'

describe('permissions-matrix view-model', () => {
  it('builds one row per catalog permission', () => {
    const rows = getPermissionMatrix()
    expect(rows.length).toBeGreaterThanOrEqual(50)
    for (const row of rows) {
      expect(row.label).toBeTruthy()
      expect(getMatrixRoles().length).toBeGreaterThan(0)
    }
  })

  it('grants every permission to SUPERADMIN', () => {
    const rows = getPermissionMatrix()
    expect(rows.every((r) => r.grants.SUPERADMIN)).toBe(true)
  })

  it('maps roles and categories with labels', () => {
    expect(getMatrixCategories().length).toBeGreaterThanOrEqual(5)
    expect(roleLabel('SUPERADMIN')).toBe('Super Admin')
  })

  it('counts grants per role', () => {
    const counts = getPermissionCountByRole()
    expect(counts.SUPERADMIN).toBe(getPermissionMatrix().length)
  })
})