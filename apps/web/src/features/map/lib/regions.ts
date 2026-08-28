import { curated } from '@lpg/mock-data'
import type { Region } from '@lpg/types'
import { getZones } from '../../zones/data/zones'
import { getGeoAnomalies, type GeoAnomalyView } from '../data/geo-anomalies'

export interface RegionSummary {
  code: Region
  name: string
  siteCount: number
  clientSiteCount: number
  anomalyCount: number
  longitude: number
  latitude: number
}

export function getRegionSummary(
  code: Region,
  geoAnomalies: readonly GeoAnomalyView[] = getGeoAnomalies(),
): RegionSummary {
  const region = curated.regions.find((r) => r.code === code)
  const zone = getZones().find((z) => z.region === code)!
  const points = [
    ...curated.sites.filter((s) => s.region === code && s.geo_point),
    ...curated.client_sites.filter((cs) => cs.region === code && cs.geo_point),
  ].map((s) => {
    const geo = s.geo_point as [number, number]
    return { lng: geo[0], lat: geo[1] }
  })
  const centroid =
    points.length === 0
      ? { lng: 0, lat: 0 }
      : {
          lng: points.reduce((a, p) => a + p.lng, 0) / points.length,
          lat: points.reduce((a, p) => a + p.lat, 0) / points.length,
        }
  return {
    code,
    name: region?.name ?? code,
    siteCount: zone.siteCount,
    clientSiteCount: zone.clientSiteCount,
    anomalyCount: geoAnomalies.filter((a) => a.region === code).length,
    longitude: centroid.lng,
    latitude: centroid.lat,
  }
}

export function regionsForMap(): readonly RegionSummary[] {
  const geoAnomalies = getGeoAnomalies()
  return curated.regions.map((r) => getRegionSummary(r.code as Region, geoAnomalies))
}
