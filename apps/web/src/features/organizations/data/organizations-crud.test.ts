import { describe, expect, it } from 'vitest'
import {
  organizationFields,
  organizationFromForm,
  organizationEditFields,
  siteFromForm,
} from './organizations-crud'

describe('organizations-crud config', () => {
  it('requires name and type', () => {
    expect(organizationFields.find((f) => f.name === 'name')?.required).toBe(true)
    expect(organizationFields.find((f) => f.name === 'type')?.required).toBe(true)
  })
  it('locks org type from the form', () => {
    const out = organizationFromForm({ name: 'X', type: 'DEPOT', is_active: true })
    expect(out.type).toBe('DEPOT')
  })
  it('exposes bundled site fields only on create', () => {
    expect(organizationFields.some((f) => f.name === 'site_name')).toBe(true)
    expect(organizationEditFields.some((f) => f.name === 'site_name')).toBe(false)
  })
  it('builds a site payload when a site name is provided', () => {
    const site = siteFromForm(
      {
        site_name: 'Dépôt test',
        site_region: 'LITTORAL',
        site_address: 'Douala',
        site_latitude: 4.05,
        site_longitude: 9.7,
      },
      'org-1',
    )
    expect(site).not.toBeNull()
    expect(site?.org_id).toBe('org-1')
    expect(site?.region).toBe('LITTORAL')
    expect(site?.geo_point).toEqual([9.7, 4.05])
    expect(site?.status).toBe('UNASSIGNED')
  })
  it('returns null when no site name is provided', () => {
    expect(siteFromForm({}, 'org-1')).toBeNull()
  })
})
