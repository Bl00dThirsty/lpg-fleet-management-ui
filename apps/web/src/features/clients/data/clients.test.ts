import { curated } from '@lpg/mock-data'
import { describe, expect, it } from 'vitest'
import { getClients, getClientSites, clientStatusLabel } from './clients'

describe('clients view-model', () => {
  it('maps each curated client with its linked site count', () => {
    const clients = getClients(
      curated.clients,
      curated.organizations,
      curated.client_sites
    )
    expect(clients.length).toBe(5)
    expect(clients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'client-0001-shc', clientSiteCount: 2 }),
        expect.objectContaining({ id: 'client-0002-cb', clientSiteCount: 1 }),
        expect.objectContaining({
          id: 'client-0003-iacam',
          clientSiteCount: 1,
        }),
        expect.objectContaining({
          id: 'client-0004-pharmanord',
          clientSiteCount: 1,
        }),
      ])
    )
    expect(clients.reduce((acc, c) => acc + c.clientSiteCount, 0)).toBe(11)
  })

  it('returns the client sites a client owns (matched on org FK)', () => {
    const sites = getClientSites(
      'org-0012-shc------0000000000001',
      curated.client_sites
    )
    expect(sites.length).toBe(2)
    for (const site of sites) {
      expect(site).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        region: expect.any(String),
        verified: expect.any(Boolean),
      })
    }
  })

  it('never substitutes fixtures for an empty server response', () => {
    expect(getClients([], [], [])).toEqual([])
    expect(getClientSites('org-0016-dovv-client-000000000001', [])).toEqual([])
  })
  it('maps the four requested DOVV locations from supplied server rows', () => {
    const sites = getClientSites(
      'org-0016-dovv-client-000000000001',
      curated.client_sites
    )
    for (const [name, latitude, longitude] of [
      ['DOVV Bastos', 3.8931714687015564, 11.509708527395427],
      ['DOVV Essos', 3.8740303466534582, 11.540261758285174],
      ['DOVV Opep', 3.8674535260724783, 11.564058005327091],
      ['DOVV Mimboman', 3.861552287240034, 11.572595242995828],
    ]) {
      expect(sites.find((s) => s.name === name)).toMatchObject({
        latitude,
        longitude,
        region: 'CENTRE',
      })
    }
  })
  it('labels statuses in French', () => {
    expect(clientStatusLabel('ACTIVE')).toBe('Actif')
    expect(clientStatusLabel('INACTIVE')).toBe('Inactif')
  })
})
