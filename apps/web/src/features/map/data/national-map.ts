import { getZones, type ZoneView } from '../../zones/data/zones'
import { getGeoAnomalies, type GeoAnomalyView } from './geo-anomalies'
import { clientSites, type ClientSiteView } from './client-sites'
import { sites, type Site } from '../../sites/data/sites'
import { regionsForMap, type RegionSummary } from '../lib/regions'
import { aggregateVracVolume, type VracSummary } from '../lib/vrac-volume'
import { getAllVracRoutes, type VracTourRoute } from './itineraries'

export interface NationalMapView {
  sites: readonly Site[]
  clientSites: readonly ClientSiteView[]
  zones: readonly ZoneView[]
  regions: readonly RegionSummary[]
  anomalies: readonly GeoAnomalyView[]
  vrac: VracSummary
  routes: readonly VracTourRoute[]
}

export function getNationalMapView(overrides: Partial<NationalMapView> = {}): NationalMapView {
  return {
    sites: overrides.sites ?? sites,
    clientSites: overrides.clientSites ?? clientSites,
    zones: overrides.zones ?? getZones(),
    regions: overrides.regions ?? regionsForMap(),
    anomalies: overrides.anomalies ?? getGeoAnomalies(),
    vrac: overrides.vrac ?? aggregateVracVolume(),
    routes: overrides.routes ?? getAllVracRoutes(),
  }
}
