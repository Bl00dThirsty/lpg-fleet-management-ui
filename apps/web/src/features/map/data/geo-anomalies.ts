import type { Anomaly, Site as CuratedSite, ClientSite } from '@lpg/types'

export interface GeoAnomalyView {
  id: string
  type: string
  category: 'INVESTIGATION' | 'TECHNICAL'
  severity: string
  status: string
  entity_type?: string | null
  entity_id?: string | null
  entity_label?: string | null
  latitude: number
  longitude: number
}

function resolveGeo(anomaly: Anomaly, sites: CuratedSite[], clientSites: ClientSite[]): { lat: number; lng: number } | null {
  if (anomaly.site_id) {
    const site = sites.find((s) => s.id === anomaly.site_id)
    const geo = site?.geo_point as [number, number] | null | undefined
    if (geo) return { lat: geo[1], lng: geo[0] }
  }
  if (anomaly.client_site_id) {
    const cs = clientSites.find((c) => c.id === anomaly.client_site_id)
    const geo = cs?.geo_point as [number, number] | null | undefined
    if (geo) return { lat: geo[1], lng: geo[0] }
  }
  return null
}

function entityLabel(anomaly: Anomaly, sites: CuratedSite[], clientSites: ClientSite[]): string | null {
  if (anomaly.site_id) {
    const site = sites.find((s) => s.id === anomaly.site_id)
    return site?.name ?? anomaly.site_id
  }
  if (anomaly.client_site_id) {
    const cs = clientSites.find((c) => c.id === anomaly.client_site_id)
    return cs?.name ?? anomaly.client_site_id
  }
  return anomaly.entity_id ?? null
}

export function getGeoAnomalies(
  rawAnomalies: Anomaly[] = [],
  sites: CuratedSite[] = [],
  clientSites: ClientSite[] = []
): readonly GeoAnomalyView[] {
  return rawAnomalies
    .map((a): GeoAnomalyView | null => {
      const geo = resolveGeo(a, sites, clientSites)
      if (!geo) return null
      return {
        id: a.id,
        type: a.type,
        category: a.category,
        severity: a.severity,
        status: a.status,
        entity_type: a.entity_type ?? null,
        entity_id: a.entity_id ?? null,
        entity_label: entityLabel(a, sites, clientSites),
        latitude: geo.lat,
        longitude: geo.lng,
      }
    })
    .filter((v): v is GeoAnomalyView => v !== null)
}
