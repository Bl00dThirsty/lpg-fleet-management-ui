import { describe, expect, it } from 'vitest'
import { getClients, getClientSites, clientStatusLabel } from './clients'

describe('clients view-model', () => {
  it('maps each curated client with its linked site count', () => {
    const clients = getClients()
    expect(clients.length).toBe(4)
    expect(clients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'client-0001-shc', clientSiteCount: 2 }),
        expect.objectContaining({ id: 'client-0002-cb', clientSiteCount: 1 }),
        expect.objectContaining({ id: 'client-0003-iacam', clientSiteCount: 1 }),
        expect.objectContaining({ id: 'client-0004-pharmanord', clientSiteCount: 1 }),
      ]),
    )
    expect(clients.reduce((acc, c) => acc + c.clientSiteCount, 0)).toBe(5)
  })

  it('returns the client sites a client owns (matched on org FK)', () => {
    const sites = getClientSites('org-0012-shc------0000000000001')
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

  it('labels statuses in French', () => {
    expect(clientStatusLabel('ACTIVE')).toBe('Actif')
    expect(clientStatusLabel('INACTIVE')).toBe('Inactif')
  })
})