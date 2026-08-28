import { describe, expect, it } from 'vitest'
import { driverFields, driverFromForm } from './drivers-crud'

describe('drivers-crud config', () => {
  it('requires first_name, last_name and org_id', () => {
    expect(driverFields.find((f) => f.name === 'first_name')?.required).toBe(true)
    expect(driverFields.find((f) => f.name === 'last_name')?.required).toBe(true)
    expect(driverFields.find((f) => f.name === 'org_id')?.required).toBe(true)
  })
  it('builds a Partial<Driver> payload', () => {
    const out = driverFromForm({
      first_name: 'Ali',
      last_name: 'Njoya',
      org_id: 'org-1',
      license_number: 'CM-123',
      is_active: true,
    })
    expect(out.first_name).toBe('Ali')
    expect(out.last_name).toBe('Njoya')
    expect(out.org_id).toBe('org-1')
    expect(out.license_number).toBe('CM-123')
    expect(out.is_active).toBe(true)
  })
})