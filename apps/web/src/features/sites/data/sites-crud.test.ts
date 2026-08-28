import { describe, expect, it } from 'vitest'
import { clientSiteFromForm, clientSiteToForm, siteFromForm, siteToForm } from './sites-crud'

describe('sites-crud config', () => {
  it('maps a form onto a Site payload with status default UNASSIGNED', () => {
    const out = siteFromForm({
      name: 'Dépôt Douala',
      org_id: 'org-0001',
      region: 'LITTORAL',
      address: 'Zone portuaire, Douala',
      is_active: true,
    })
    expect(out.name).toBe('Dépôt Douala')
    expect(out.org_id).toBe('org-0001')
    expect(out.region).toBe('LITTORAL')
    expect(out.address).toBe('Zone portuaire, Douala')
    expect(out.status).toBe('UNASSIGNED')
    expect(out.is_active).toBe(true)
  })

  it('round-trips a Site into form values', () => {
    const form = siteToForm({
      id: 'site-1',
      name: 'Dépôt Douala',
      org_id: 'org-0001',
      region: 'LITTORAL',
      address: 'Zone portuaire, Douala',
      status: 'ACTIVE',
      is_active: true,
      is_verified: true,
    })
    expect(form).toMatchObject({
      id: 'site-1',
      name: 'Dépôt Douala',
      org_id: 'org-0001',
      region: 'LITTORAL',
      address: 'Zone portuaire, Douala',
      is_active: true,
    })
  })

  it('client-site variant uses client_org_id', () => {
    const out = clientSiteFromForm({
      name: 'Point de vente Ebolowa',
      client_org_id: 'org-0002',
      region: 'SUD',
      address: 'Marché central',
      is_active: true,
    })
    expect(out.name).toBe('Point de vente Ebolowa')
    expect(out.client_org_id).toBe('org-0002')
    expect(out.region).toBe('SUD')
    expect(out.is_active).toBe(true)
  })

  it('client-site toForm maps from ClientSite shape', () => {
    const form = clientSiteToForm({
      id: 'cs-1',
      name: 'Point de vente Ebolowa',
      client_org_id: 'org-0002',
      region: 'SUD',
      address: 'Marché central',
      is_active: false,
      is_verified: false,
    })
    expect(form).toMatchObject({
      id: 'cs-1',
      name: 'Point de vente Ebolowa',
      client_org_id: 'org-0002',
      region: 'SUD',
      address: 'Marché central',
      is_active: false,
    })
  })

  it('leaves geo_point null when coordinates are omitted (site is not yet geolocalised)', () => {
    const out = siteFromForm({
      name: 'Site sans position',
      org_id: 'org-0001',
      region: 'CENTRE',
      is_active: true,
    })
    expect(out.geo_point).toBeNull()
  })

  it('encodes geo_point as [longitude, latitude] when both coordinates are provided', () => {
    const out = siteFromForm({
      name: 'Dépôt Douala',
      org_id: 'org-0001',
      region: 'LITTORAL',
      latitude: 4.0475,
      longitude: 9.5625,
      is_active: true,
    })
    expect(out.geo_point).toEqual([9.5625, 4.0475])
  })

  it('round-trips geo_point back into separate latitude/longitude fields', () => {
    const form = siteToForm({
      id: 'site-1',
      name: 'Dépôt Douala',
      org_id: 'org-0001',
      region: 'LITTORAL',
      geo_point: [9.5625, 4.0475],
      status: 'ACTIVE',
      is_active: true,
      is_verified: true,
    })
    expect(form.latitude).toBe(4.0475)
    expect(form.longitude).toBe(9.5625)
  })
})
