import { describe, expect, it } from 'vitest'
import { clientSiteFormSchema } from './client-site-schema'

describe('clientSiteFormSchema', () => {
  it('validates a correct client site with coordinates', () => {
    const valid = {
      name: 'DOVV Bastos 3e',
      region: 'CENTRE',
      address: 'Rond-point Bastos, Yaoundé',
      latitude: 3.885,
      longitude: 11.512,
      site_contact_name: 'Marc TIENTCHEU',
      site_contact_phone: '+237699334455',
      is_active: true,
    }

    const res = clientSiteFormSchema.safeParse(valid)
    expect(res.success).toBe(true)
  })

  it('rejects missing or out-of-range coordinates', () => {
    const invalidCoords = {
      name: 'DOVV Douala',
      region: 'LITTORAL',
      latitude: 120, // Invalid latitude (> 90)
      longitude: 9.704,
    }

    const res = clientSiteFormSchema.safeParse(invalidCoords)
    expect(res.success).toBe(false)
  })

  it('rejects too short name', () => {
    const invalid = {
      name: 'D',
      region: 'LITTORAL',
      latitude: 4.051,
      longitude: 9.704,
    }

    const res = clientSiteFormSchema.safeParse(invalid)
    expect(res.success).toBe(false)
  })
})
