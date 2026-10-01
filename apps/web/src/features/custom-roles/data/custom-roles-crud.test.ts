import { describe, expect, it } from 'vitest'
import { customRoleFields, customRoleFromForm, customRoleToForm } from './custom-roles-crud'

describe('custom-roles-crud config', () => {
  it('builds permissions_json from an array of codes', () => {
    const out = customRoleFromForm({
      name: 'Contrôleur',
      description: 'Rôle de contrôle',
      org_id: 'org-0001',
      is_active: true,
      permission_codes: ['sites.read', 'sites.write', 'trucks.read'],
    })
    expect(out.name).toBe('Contrôleur')
    expect(out.org_id).toBe('org-0001')
    expect(out.is_active).toBe(true)
    expect(out.permissions_json).toEqual({
      'sites.read': true,
      'sites.write': true,
      'trucks.read': true,
    })
  })

  it('handles empty permission selection', () => {
    const out = customRoleFromForm({
      name: 'Lecture seule',
      description: '',
      org_id: 'org-0002',
      is_active: false,
      permission_codes: [],
    })
    expect(out.permissions_json).toEqual({})
  })

  it('round-trips a CustomRole into form values', () => {
    const form = customRoleToForm({
      id: 'cr-1',
      name: 'Contrôleur',
      description: 'Rôle de contrôle',
      org_id: 'org-0001',
      permissions_json: { 'sites.read': true, 'sites.write': true, 'trucks.read': false },
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    })
    expect(form).toMatchObject({
      id: 'cr-1',
      name: 'Contrôleur',
      description: 'Rôle de contrôle',
      org_id: 'org-0001',
      is_active: true,
      permission_codes: ['sites.read', 'sites.write'],
    })
  })

  it('exposes a checklist field for permissions', () => {
    const checklist = customRoleFields.find((f) => f.name === 'permission_codes')
    expect(checklist?.type).toBe('checklist')
    expect(checklist?.options?.length).toBeGreaterThan(0)
  })
})
