import type { Region, RegionEntity } from '@lpg/types'
import { getZones } from '../../zones/data/zones'

export const REGION_LABELS: Record<Region, string> = {
  ADAMAOUA: 'Adamaoua',
  CENTRE: 'Centre',
  EST: 'Est',
  EXTREMENORD: 'Extrême-Nord',
  LITTORAL: 'Littoral',
  NORD: 'Nord',
  NORDOUEST: 'Nord-Ouest',
  OUEST: 'Ouest',
  SUD: 'Sud',
  SUDOUEST: 'Sud-Ouest',
}

/** Coordonnées précises des centres géographiques des 10 régions du Cameroun */
export const REGION_CENTROIDS: Record<Region, [number, number]> = {
  ADAMAOUA: [13.58, 7.36],
  CENTRE: [11.52, 3.87],
  EST: [14.08, 4.58],
  EXTREMENORD: [14.33, 10.59],
  LITTORAL: [9.70, 4.05],
  NORD: [13.40, 9.30],
  NORDOUEST: [10.15, 5.96],
  OUEST: [10.42, 5.48],
  SUD: [11.15, 2.92],
  SUDOUEST: [9.24, 4.16],
}

export interface RegionSummary {
  code: Region
  name: string
  siteCount: number
  clientSiteCount: number
  anomalyCount: number
  longitude: number
  latitude: number
}

export function getRegionSummary(code: Region): RegionSummary {
  const zone = getZones().find((z) => z.region === code)
  const centroid = REGION_CENTROIDS[code] ?? [12.3, 8.7]
  return {
    code,
    name: REGION_LABELS[code] ?? code,
    siteCount: zone?.siteCount ?? 0,
    clientSiteCount: zone?.clientSiteCount ?? 0,
    anomalyCount: 0,
    longitude: centroid[0],
    latitude: centroid[1],
  }
}

export function regionsForMap(regionsFromStore: RegionEntity[] = []): readonly RegionSummary[] {
  if (regionsFromStore.length > 0) {
    return regionsFromStore.map((r) => getRegionSummary(r.code))
  }
  // Default to the 10 official regions of Cameroon with accurate centroids
  return (Object.keys(REGION_LABELS) as Region[]).map(getRegionSummary)
}
