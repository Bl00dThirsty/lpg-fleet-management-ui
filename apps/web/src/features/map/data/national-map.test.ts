import { describe, it, expect } from 'vitest'
import { getNationalMapView, type NationalMapView } from './national-map'

const inline: NationalMapView = {
  sites: [
    {
      id: 'site-1',
      name: 'Dépôt Douala',
      type: 'depot',
      city: 'Douala',
      region: 'Littoral',
      operator: 'SCDP',
      latitude: 4.05,
      longitude: 9.7,
      description: 'Dépôt test',
      status: 'active',
    },
  ],
  clientSites: [
    {
      id: 'cs-1',
      name: 'Client Yaoundé',
      city: 'Yaoundé',
      region: 'Centre',
      clientName: 'Client Test',
      client_org_id: 'org-client',
      current_marketeur_org_id: null,
      is_active: true,
      markerType: 'client-delivery',
      longitude: 11.5,
      latitude: 3.87,
    },
  ],
  zones: [
    {
      id: 'zone-centre',
      code: 'CENTRE',
      name: 'Centre',
      siteCount: 1,
      clientSiteCount: 1,
      region: 'CENTRE',
    },
  ],
  regions: [
    {
      code: 'CENTRE',
      name: 'Centre',
      siteCount: 1,
      clientSiteCount: 1,
      anomalyCount: 1,
      longitude: 11.5,
      latitude: 3.87,
    },
  ],
  anomalies: [
    {
      id: 'ano-1',
      type: 'VOLUMEGAP',
      category: 'INVESTIGATION',
      severity: 'ELEVE',
      status: 'NOUVEAU',
      entity_type: 'SITE',
      entity_id: 'site-1',
      entity_label: 'Dépôt Douala',
      latitude: 4.05,
      longitude: 9.7,
    },
  ],
  vrac: { totalTM: 12.5, unit: 'TM', activeTruckCount: 2 },
  routes: [],
}

describe('getNationalMapView', () => {
  it('exposes every aggregated sub-view', () => {
    const view = getNationalMapView(inline)
    expect(Array.isArray(view.sites)).toBe(true)
    expect(Array.isArray(view.clientSites)).toBe(true)
    expect(Array.isArray(view.zones)).toBe(true)
    expect(Array.isArray(view.regions)).toBe(true)
    expect(Array.isArray(view.anomalies)).toBe(true)
    expect(typeof view.vrac.totalTM).toBe('number')
    expect(view.sites).toHaveLength(1)
    expect(view.vrac.unit).toBe('TM')
  })

  it('flags at least one anomaly when rows are provided', () => {
    const view = getNationalMapView(inline)
    expect(view.anomalies.length).toBeGreaterThan(0)
    expect(view.anomalies[0]?.category).toBe('INVESTIGATION')
  })

  it('defaults to the (empty) entity-data collections', () => {
    const view = getNationalMapView()
    expect(view.sites).toEqual([])
    expect(view.clientSites).toEqual([])
    expect(view.anomalies).toEqual([])
    expect(typeof view.vrac.totalTM).toBe('number')
  })
})
