import { anomalies, curated } from '@lpg/mock-data'
import type { Anomaly } from '@lpg/types'

export interface GeoAnomalyView {
  id: string
  type: string
  category: 'INVESTIGATION' | 'TECHNICAL'
  severity: string
  status: string
  entity_type?: string | null
  entity_id?: string | null
  entity_label?: string | null
  region: string
  latitude: number
  longitude: number
}

function resolveGeo(anomaly: Anomaly): { lat: number; lng: number; region: string } | null {
  if (anomaly.site_id) {
    const site = curated.sites.find((s) => s.id === anomaly.site_id)
    const geo = site?.geo_point as [number, number] | null | undefined
    if (geo && site) return { lat: geo[1], lng: geo[0], region: site.region }
  }
  if (anomaly.client_site_id) {
    const cs = curated.client_sites.find((c) => c.id === anomaly.client_site_id)
    const geo = cs?.geo_point as [number, number] | null | undefined
    if (geo && cs) return { lat: geo[1], lng: geo[0], region: cs.region }
  }
  // Vehicle / tour / marketeur anomalies: not geo-resolvable from a single point
  // in the current fixture — drop them from the map layer.
  return null
}

function entityLabel(anomaly: Anomaly): string | null {
  if (anomaly.site_id) {
    const site = curated.sites.find((s) => s.id === anomaly.site_id)
    return site?.name ?? anomaly.site_id
  }
  if (anomaly.client_site_id) {
    const cs = curated.client_sites.find((c) => c.id === anomaly.client_site_id)
    return cs?.name ?? anomaly.client_site_id
  }
  return anomaly.entity_id ?? null
}

export function getGeoAnomalies(): readonly GeoAnomalyView[] {
  return anomalies
    .map((a): GeoAnomalyView | null => {
      const geo = resolveGeo(a)
      if (!geo) return null
      return {
        id: a.id,
        type: a.type,
        category: a.category,
        severity: a.severity,
        status: a.status,
        entity_type: a.entity_type ?? null,
        entity_id: a.entity_id ?? null,
        entity_label: entityLabel(a),
        region: geo.region,
        latitude: geo.lat,
        longitude: geo.lng,
      }
    })
    .filter((v): v is GeoAnomalyView => v !== null)
}
