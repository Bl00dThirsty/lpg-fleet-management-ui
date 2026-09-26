import { describe, expect, it } from 'vitest'
import { curated } from '@lpg/mock-data'

const sourceOrganizationIds = [
  'org-0007-neptn-000-000000000001',
  'org-0006-tradex-000-000000000001',
  'org-0009-boco-000-000000000001',
  'org-0003-total-0000-000000000001',
  'org-0002-sctm-0000-000000000001',
  'org-0005-camg-0000-000000000001',
  'org-0009-AXX-0000-000000000001',
  'org-0004-aza--0000-000000000001',
  'org-0009-scdp--0000-000000000001',
  'org-0001-snh-0000-000000000001',
]

const expectedOrganizationTypes: Record<string, string> = {
  'org-0007-neptn-000-000000000001': 'MARKETEUR',
  'org-0006-tradex-000-000000000001': 'MARKETEUR',
  'org-0009-boco-000-000000000001': 'MARKETEUR',
  'org-0003-total-0000-000000000001': 'MARKETEUR',
  'org-0002-sctm-0000-000000000001': 'MARKETEUR',
  'org-0005-camg-0000-000000000001': 'MARKETEUR',
  'org-0009-AXX-0000-000000000001': 'MARKETEUR',
  'org-0004-aza--0000-000000000001': 'MARKETEUR',
  'org-0009-scdp--0000-000000000001': 'DEPOT',
  'org-0001-snh-0000-000000000001': 'DEPOT',
} as const

const expectedOperationalSiteCounts: Record<string, number> = {
  'org-0007-neptn-000-000000000001': 45,
  'org-0006-tradex-000-000000000001': 30,
  'org-0009-boco-000-000000000001': 20,
  'org-0003-total-0000-000000000001': 77,
  'org-0002-sctm-0000-000000000001': 5,
  'org-0005-camg-0000-000000000001': 0,
  'org-0009-AXX-0000-000000000001': 15,
  'org-0004-aza--0000-000000000001': 4,
  'org-0009-scdp--0000-000000000001': 6,
  'org-0001-snh-0000-000000000001': 2,
} as const

const expectedSourceSiteFingerprint = 'c18214cb7dce566f3c0f52d7e94a4407d63cf3616a3f6451ceb0722a335aa812'

const regions = new Set([
  'ADAMAOUA',
  'CENTRE',
  'EST',
  'EXTREMENORD',
  'LITTORAL',
  'NORD',
  'NORDOUEST',
  'OUEST',
  'SUD',
  'SUDOUEST',
])

const siteFunctions = new Set(['CENTREEMPLISSEUR', 'ENTREPOT', 'POINTAPPROVISIONABLE'])
const schemaOrganizationFields = new Set([
  'id',
  'name',
  'type',
  'registration_number',
  'tax_id',
  'is_active',
  'operational_site_count',
  'client_site_count',
  'vehicle_count',
  'driver_count',
  'user_count',
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
])
const schemaSiteFields = new Set([
  'id',
  'org_id',
  'region',
  'name',
  'functions',
  'address',
  'geo_point',
  'geo_confidence_score',
  'delivery_count',
  'is_verified',
  'verified_at',
  'verified_by',
  'status',
  'reason',
  'is_active',
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
])

const marketOrganizations = () => curated.organizations.filter((org) => sourceOrganizationIds.includes(org.id))
const marketSites = () => curated.sites.filter((site) => site.id.startsWith('site-market-'))
const canonicalMarketRecords = () =>
  marketSites()
    .map((site) => ({
      org_id: site.org_id,
      region: site.region,
      name: site.name,
      address: site.address,
      function: site.functions,
      geo_point: site.geo_point,
    }))
    .sort((left, right) => {
      const leftKey = `${left.org_id}\u0000${left.name}`
      const rightKey = `${right.org_id}\u0000${right.name}`
      return leftKey.localeCompare(rightKey)
    })
const marketFingerprint = async () => {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalMarketRecords()))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

describe('canonical market fixture', () => {
  it('matches the ten source organizations exactly', () => {
    expect(marketOrganizations().map((org) => org.id).sort()).toEqual([...sourceOrganizationIds].sort())
    expect(new Set(curated.organizations.map((org) => org.id)).size).toBe(curated.organizations.length)
  })

  it('matches the exact operational site counts for all source organizations', () => {
    for (const organization of marketOrganizations()) {
      expect(organization.operational_site_count).toBe(expectedOperationalSiteCounts[organization.id])
    }
  })

  it('resolves every imported site to a typed source organization', () => {
    for (const site of marketSites()) {
      expect(sourceOrganizationIds).toContain(site.org_id)
      const organization = curated.organizations.find((org) => org.id === site.org_id)
      if (!organization) throw new Error(`Missing source organization for imported site: ${site.org_id}`)
      expect(organization.type).toBe(expectedOrganizationTypes[site.org_id])
    }
  })

  it('matches the deterministic fingerprint over exactly six source-backed fields for all 204 records', async () => {
    expect(marketSites()).toHaveLength(204)
    expect(await marketFingerprint()).toBe(expectedSourceSiteFingerprint)
  })

  it('derives imported site counts for every source organization and matches operational_site_count', () => {
    const actualCounts = new Map<string, number>(sourceOrganizationIds.map((id) => [id, 0]))
    for (const site of marketSites()) actualCounts.set(site.org_id, (actualCounts.get(site.org_id) ?? 0) + 1)
    for (const organization of marketOrganizations()) {
      expect(actualCounts.get(organization.id)).toBe(organization.operational_site_count)
    }
    expect(actualCounts.get('org-0005-camg-0000-000000000001')).toBe(0)
  })

  it('asserts the exact expected type for all ten source organizations', () => {
    for (const organization of marketOrganizations()) {
      expect(organization.type).toBe(expectedOrganizationTypes[organization.id])
    }
  })

  it('uses only schema organization fields for source organizations', () => {
    for (const org of marketOrganizations()) {
      expect(Object.keys(org)).toEqual(expect.arrayContaining([...schemaOrganizationFields]))
      for (const key of Object.keys(org)) expect(schemaOrganizationFields.has(key)).toBe(true)
      expect(org.operational_site_count).toBeGreaterThanOrEqual(0)
    }
  })

  it('contains exactly 204 market sites without duplicate organization or site identities', () => {
    expect(marketSites()).toHaveLength(204)
    expect(new Set(marketSites().map((site) => site.org_id)).size).toBe(9)
    expect(new Set(marketSites().map((site) => `${site.org_id}\u0000${site.name}`)).size).toBe(204)
  })

  it('keeps source-backed regions, functions, coordinates, and normalized import lifecycle', () => {
    for (const site of marketSites()) {
      expect(regions.has(site.region)).toBe(true)
      const functions = site.functions ?? []
      const [longitude, latitude] = site.geo_point ?? []
      expect(functions.length).toBeGreaterThan(0)
      for (const value of functions) expect(siteFunctions.has(value)).toBe(true)
      expect(site.geo_point).toHaveLength(2)
      expect(longitude).toBeGreaterThanOrEqual(8.5)
      expect(longitude).toBeLessThanOrEqual(16.5)
      expect(latitude).toBeGreaterThanOrEqual(1.7)
      expect(latitude).toBeLessThanOrEqual(13.5)
      expect(site.status).toBe('UNASSIGNED')
      expect(site.is_verified).toBe(false)
      expect(site.geo_confidence_score).toBe(0)
      expect(site.verified_at).toBeNull()
      expect(site.verified_by).toBeNull()
      expect(site.delivery_count).toBe(0)
      expect(Object.keys(site)).toEqual(expect.arrayContaining([...schemaSiteFields]))
      for (const key of Object.keys(site)) expect(schemaSiteFields.has(key)).toBe(true)
    }
  })

  it('assigns the required function by organization type', () => {
    for (const site of marketSites()) {
      const organization = curated.organizations.find((org) => org.id === site.org_id)
      if (!organization) throw new Error(`Missing source organization for imported site: ${site.org_id}`)
      if (organization.type === 'MARKETEUR') expect(site.functions).toEqual(['POINTAPPROVISIONABLE'])
      if (organization.type === 'DEPOT') expect(site.functions).toEqual(['ENTREPOT'])
    }
  })

  it('has no market client sites and no CAMGAZ sites', () => {
    expect(curated.client_sites.some((site) => site.id.startsWith('site-market-'))).toBe(false)
    expect(marketSites().filter((site) => site.org_id === 'org-0005-camg-0000-000000000001')).toHaveLength(0)
  })

  it('documents the known source anomalies as review-required without changing their source data', () => {
    const byName = new Map(marketSites().map((site) => [site.name, site]))
    expect(byName.get('Alpha AXX Bamendzi')?.geo_point).toEqual([10.42712933551413, 5.481730476338303])
    expect(byName.get('AXX Bamendzi 1')?.geo_point).toEqual(byName.get('Alpha AXX Bamendzi')?.geo_point)
    expect(byName.get('AXX Nyom')?.geo_point).toEqual([13.723860916092487, 7.035052501939056])
    expect(byName.get('TotalEnergies Jouvence')?.geo_point).toBeDefined()
    expect(byName.get('Station Tradex Maroua-Djarengol')?.geo_point).toEqual(byName.get('Dépôt SCDP Maroua')?.geo_point)
    for (const name of ['Alpha AXX Bamendzi', 'AXX Bamendzi 1', 'AXX Nyom', 'TotalEnergies Jouvence', 'Station Tradex Maroua-Djarengol', 'Dépôt SCDP Maroua']) {
      const site = byName.get(name)
      expect(site?.status).toBe('UNASSIGNED')
      expect(site?.is_verified).toBe(false)
    }
  })
})
