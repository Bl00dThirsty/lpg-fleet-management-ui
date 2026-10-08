import { describe, expect, it } from 'vitest'
import type { ClientSite, Site } from '@lpg/types'
import {
  buildDraftTourActivity,
  clientSiteToOperationalSite,
} from './tour-draft-preview'

const source = {
  id: 'source',
  name: 'Dépôt',
  geo_point: [9.65, 4.08],
  region: 'LITTORAL',
  address: 'Bonabéri, Douala',
  org_id: 'org',
} as Site
const client = {
  id: 'client',
  name: 'Client Douala',
  geo_point: [9.71, 4.05],
  region: 'LITTORAL',
  address: 'Bassa, Douala',
} as ClientSite
const draft = {
  sourceSiteId: source.id,
  type: 'BOUTEILLES50KG' as const,
  requested_quantity: 50,
  checkpoints: [
    {
      site_id: '',
      client_site_id: client.id,
      sequence: 2,
      expected_quantity: 50,
    },
  ],
}
const options = { sourceSites: [source], clientSites: [client] }

describe('draft route preview', () => {
  it('uses supplied live coordinates in longitude/latitude order', () => {
    const result = buildDraftTourActivity(draft, options)
    expect(result?.originSite.longitude).toBe(9.65)
    expect(result?.destinationSite.latitude).toBe(4.05)
    expect(result?.stops.map((s) => s.siteId)).toEqual(['source', 'client'])
    expect(result?.completed_checkpoints).toBe(0)
    expect(result?.stops.every((s) => !s.completed)).toBe(true)
    expect(result?.expectedArrivalAt).toBe('')
  })
  it('never substitutes another depot for an unknown source', () => {
    expect(
      buildDraftTourActivity({ ...draft, sourceSiteId: 'unknown' }, options)
    ).toBeNull()
  })
  it('does not silently omit an unresolved destination', () => {
    expect(
      buildDraftTourActivity(draft, { ...options, clientSites: [] })
    ).toBeNull()
  })
  it('rejects absent or out-of-range coordinates instead of inventing a location', () => {
    expect(
      clientSiteToOperationalSite({
        ...client,
        geo_point: undefined,
      } as unknown as ClientSite)
    ).toBeNull()
    expect(
      clientSiteToOperationalSite({ ...client, geo_point: [181, 4] })
    ).toBeNull()
    expect(
      buildDraftTourActivity(draft, {
        ...options,
        sourceSites: [{ ...source, geo_point: [9, NaN] }],
      })
    ).toBeNull()
  })
  it('uses an edited destination before the previously loaded version', () => {
    const result = buildDraftTourActivity(draft, {
      ...options,
      customClientSites: [{ ...client, geo_point: [11.51, 3.88] }],
    })
    expect(result?.destinationSite.longitude).toBe(11.51)
  })
  it('excludes deleted destinations', () => {
    expect(
      buildDraftTourActivity(draft, {
        ...options,
        clientSites: [{ ...client, deleted_at: '2026-10-07' }],
      })
    ).toBeNull()
  })
})
