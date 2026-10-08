import { describe, expect, it } from 'vitest'
import {
  buildAnomalyPopupContent,
  buildClientSitePopupContent,
  buildRegionPopupContent,
  buildRoutePopupContent,
  buildVracPopupContent,
  buildZonePopupContent,
  popupHtmlLine,
  popupLine,
} from './popup'
import type { ClientSiteView } from '../data/client-sites'
import type { GeoAnomalyView } from '../data/geo-anomalies'
import { DOUALA_VRAC_ROUTE } from '../data/itineraries'

describe('map popup builders', () => {
  it('popupLine escapes HTML in values by default to prevent XSS', () => {
    const line = popupLine('Test', '<script>alert("xss")</script>')
    expect(line).toContain('&lt;script&gt;')
    expect(line).not.toContain('<script>')
  })

  it('popupHtmlLine preserves raw HTML without escaping tags', () => {
    const line = popupHtmlLine(
      'Statut',
      '<span style="color:#10b981;font-weight:700;">VALIDE</span>'
    )
    expect(line).toContain('<span style="color:#10b981;font-weight:700;">VALIDE</span>')
    expect(line).not.toContain('&lt;span')
  })

  it('buildClientSitePopupContent renders clickable link and no escaped HTML entities for tags', () => {
    const cs: ClientSiteView = {
      id: 'cs-1',
      name: 'Hôtel Akwa',
      clientName: 'Groupe Akwa',
      client_org_id: 'org-1',
      current_marketeur_org_id: null,
      city: 'Douala',
      region: 'Littoral',
      latitude: 4.05,
      longitude: 9.7,
      markerType: 'client-delivery',
      is_active: true,
    }
    const html = buildClientSitePopupContent(cs, 'light')

    expect(html).toContain('class="fleet-truck-popup"')
    expect(html).toContain('<a href="/client-sites"')
    expect(html).toContain('Ouvrir la fiche client →</a>')
    expect(html).not.toContain('&lt;a')
    expect(html).not.toContain('&gt;')
  })

  it('buildAnomalyPopupContent renders styled severity tag and no escaped span tags', () => {
    const anomaly: GeoAnomalyView = {
      id: 'anom-1',
      type: 'Écart de pesée',
      category: 'INVESTIGATION',
      severity: 'CRITIQUE',
      status: 'OPEN',
      latitude: 4.05,
      longitude: 9.7,
      entity_label: 'Site Bonabéri',
    }
    const html = buildAnomalyPopupContent(anomaly, 'dark')

    expect(html).toContain('class="fleet-truck-popup"')
    expect(html).toContain('data-popup-theme="dark"')
    expect(html).toContain('<span style="color:#ef4444;font-weight:700;">CRITIQUE</span>')
    expect(html).not.toContain('&lt;span')
    expect(html).not.toContain('&lt;/span&gt;')
  })

  it('buildRoutePopupContent renders styled status and cargo without escaped tags', () => {
    const html = buildRoutePopupContent(DOUALA_VRAC_ROUTE, 'light')

    expect(html).toContain('class="fleet-truck-popup"')
    expect(html).toContain('<span style="color:#f59e0b;font-weight:600;">En transit — Traversée Pont du Wouri</span>')
    expect(html).toContain('<span style="font-weight:700;color:#10b981;">18,5 TM</span>')
    expect(html).not.toContain('&lt;span')
    expect(html).not.toContain('&lt;/span&gt;')
  })

  it('buildZonePopupContent and buildRegionPopupContent wrap in fleet-truck-popup container', () => {
    const zoneHtml = buildZonePopupContent({
      id: 'z-1',
      code: 'LITTORAL',
      name: 'Zone Littoral',
      region: 'LITTORAL',
      siteCount: 12,
      clientSiteCount: 30,
    })
    expect(zoneHtml).toContain('class="fleet-truck-popup"')

    const regionHtml = buildRegionPopupContent({
      code: 'LITTORAL',
      name: 'Littoral',
      latitude: 4.05,
      longitude: 9.7,
      siteCount: 15,
      clientSiteCount: 45,
      anomalyCount: 2,
    })
    expect(regionHtml).toContain('class="fleet-truck-popup"')

    const vracHtml = buildVracPopupContent({
      totalTM: 2151.1,
      unit: 'TM',
      activeTruckCount: 18,
    })
    expect(vracHtml).toContain('class="fleet-truck-popup"')
  })
})
