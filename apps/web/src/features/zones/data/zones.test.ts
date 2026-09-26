import { describe, expect, it } from 'vitest'
import { getZones, getZoneOptions } from './zones'

describe('zones view-model', () => {
  it('renders one ZoneView per curated region', () => {
    const zones = getZones()
    expect(zones.length).toBe(10)
    expect(zones[0]).toMatchObject({
      id: expect.any(String),
      code: expect.any(String),
      name: expect.any(String),
      siteCount: expect.any(Number),
      clientSiteCount: expect.any(Number),
    })
  })

  it('derives site and client-site counts by region code', () => {
    const centre = getZones().find((z) => z.code === 'CENTRE')
    const littoral = getZones().find((z) => z.code === 'LITTORAL')
    // Sanity: each curated region exposes both a siteCount and a clientSiteCount.
    // Absolute counts drift as the curated JSON grows, so assert semantics.
    expect(centre).toBeDefined()
    expect(littoral).toBeDefined()
    expect(centre!.siteCount).toBeGreaterThan(0)
    expect(centre!.clientSiteCount).toBeGreaterThan(0)
    expect(littoral!.siteCount).toBeGreaterThan(0)
    expect(littoral!.clientSiteCount).toBeGreaterThan(0)
  })

  it('exposes filter options with French labels', () => {
    const options = getZoneOptions()
    expect(options.length).toBe(10)
    expect(options[1]).toEqual({ label: 'Centre', value: 'CENTRE' })
  })
})