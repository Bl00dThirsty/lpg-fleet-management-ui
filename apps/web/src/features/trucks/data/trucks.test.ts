import { describe, expect, it } from 'vitest'
import { organizations, curated } from '@lpg/mock-data'
import type { UserScope } from '@/features/scope/scope'
import { getTrucks } from './trucks'

const SCTM_ORG = 'org-0002-sctm-0000-000000000001'
const CSPH_ORG = 'org-0001-csph-0000-000000000001'

describe('getTrucks', () => {
  it('assigns each tenant name from the vehicle organization', () => {
    const source = [
      { ...curated.vehicles[0]!, id: 'vehicle-a', org_id: CSPH_ORG },
      { ...curated.vehicles[0]!, id: 'vehicle-b', org_id: SCTM_ORG },
    ]

    const rows = getTrucks(undefined, source)
    const orgA = organizations.find((org) => org.id === CSPH_ORG)
    const orgB = organizations.find((org) => org.id === SCTM_ORG)

    expect(orgA).toBeDefined()
    expect(orgB).toBeDefined()
    expect(rows[0]?.tenant_name).toBe(orgA?.name)
    expect(rows[1]?.tenant_name).toBe(orgB?.name)
  })

  it('keeps every vehicle for a regulator with an org-wide scope', () => {
    const scope: UserScope = { view: 'org', siteIds: [] }
    expect(getTrucks(scope)).toHaveLength(curated.vehicles.length)
  })

  it('restricts a marketer scope to its own organization vehicles', () => {
    const scope: UserScope = {
      view: 'site',
      orgId: SCTM_ORG,
      siteIds: ['site-0001-sctm-bonaberi'],
      userId: 'user-0007-sctm-marketeur',
    }
    const expected = curated.vehicles.filter((vehicle) => vehicle.org_id === SCTM_ORG)

    expect(expected.length).toBeGreaterThan(0)
    expect(getTrucks(scope)).toHaveLength(expected.length)
  })

  it('restricts a transporter scope to its own organization vehicles', () => {
    const scope: UserScope = {
      view: 'transporter',
      orgId: 'org-0010-translog----000000000001',
      siteIds: [],
      userId: 'user-nobody',
    }
    const expected = curated.vehicles.filter(
      (vehicle) => vehicle.org_id === scope.orgId,
    )

    expect(getTrucks(scope)).toHaveLength(expected.length)
  })

  it('never leaks the whole organization to an agent scope', () => {
    const scope: UserScope = {
      view: 'agent',
      orgId: SCTM_ORG,
      siteIds: ['site-0001-sctm-bonaberi'],
      userId: 'user-0007-sctm-marketeur',
    }

    expect(getTrucks(scope)).toHaveLength(0)
  })

  it('keeps a vehicle created by the user even outside the site set', () => {
    const created = curated.vehicles[0]!
    const scope: UserScope = {
      view: 'agent',
      orgId: SCTM_ORG,
      siteIds: ['site-0001-sctm-bonaberi'],
      userId: 'user-creator',
    }
    const source = [{ ...created, id: 'vehicle-mine', created_by: 'user-creator' }]

    expect(getTrucks(scope, source).map((truck) => truck.id)).toEqual([
      'vehicle-mine',
    ])
  })
})
