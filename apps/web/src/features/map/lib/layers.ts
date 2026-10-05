import type { NationalMapView } from '../data/national-map'
import { siteMarkerTokens } from '../../sites/utils/site-graphics'
import type { MapTheme } from '../utils/map-theme'
import { getSiteIconUrl, rgbaFromTuple } from '../utils/map-theme'
import {
  buildClientSitePopupContent,
  buildZonePopupContent,
  buildRegionPopupContent,
  buildVracPopupContent,
  buildAnomalyPopupContent,
  buildSitePopupContent,
} from '../utils/popup'

export type MapLayerKey =
  | 'sites'
  | 'clientSites'
  | 'zones'
  | 'regions'
  | 'anomalies'
  | 'vrac'
  | 'routes'

export interface MapLayerSpec {
  key: MapLayerKey
  label: string
  enabled: boolean
  marker: { icon: string; color: string; size: number }
  content: (feature: unknown) => string
}

export function getInitialLayers(): Record<MapLayerKey, boolean> {
  return {
    sites: true,
    clientSites: true,
    zones: false,
    regions: true,
    anomalies: false,
    vrac: true,
    routes: true,
  }
}

export const LAYER_LABELS: Record<MapLayerKey, string> = {
  sites: 'Sites marchands & Dépôts',
  clientSites: 'Sites clients (Livraisons)',
  zones: 'Zones géographiques',
  regions: 'Régions (10)',
  anomalies: 'Alertes & Anomalies',
  vrac: 'Volume VRAC (TM)',
  routes: 'Itinéraires VRAC (Traçabilité)',
}

export function buildLayerSpecs(
  view: NationalMapView,
  theme: MapTheme,
  toggles: Record<MapLayerKey, boolean>,
): MapLayerSpec[] {
  const specs: MapLayerSpec[] = []

  if (toggles.sites) {
    const token = siteMarkerTokens['filling-center']
    specs.push({
      key: 'sites',
      label: LAYER_LABELS.sites,
      enabled: true,
      marker: {
        icon: getSiteIconUrl('filling-center', theme),
        color: rgbaFromTuple(token.color),
        size: token.size,
      },
      content: (f) =>
        buildSitePopupContent(f as Parameters<typeof buildSitePopupContent>[0], theme),
    })
  }

  if (toggles.clientSites) {
    const token = siteMarkerTokens['delivery-point']
    specs.push({
      key: 'clientSites',
      label: LAYER_LABELS.clientSites,
      enabled: true,
      marker: {
        icon: getSiteIconUrl('delivery-point', theme),
        color: rgbaFromTuple(token.color),
        size: token.size,
      },
      content: (f) =>
        buildClientSitePopupContent(f as Parameters<typeof buildClientSitePopupContent>[0], theme),
    })
  }

  if (toggles.zones) {
    specs.push({
      key: 'zones',
      label: LAYER_LABELS.zones,
      enabled: true,
      marker: { icon: 'zone', color: '#6366F1', size: 12 },
      content: (f) => buildZonePopupContent(f as Parameters<typeof buildZonePopupContent>[0], theme),
    })
  }

  if (toggles.regions) {
    specs.push({
      key: 'regions',
      label: LAYER_LABELS.regions,
      enabled: true,
      marker: { icon: 'region', color: '#3B82F6', size: 20 },
      content: (f) =>
        buildRegionPopupContent(f as Parameters<typeof buildRegionPopupContent>[0], theme),
    })
  }

  if (toggles.anomalies) {
    specs.push({
      key: 'anomalies',
      label: LAYER_LABELS.anomalies,
      enabled: true,
      marker: { icon: 'anomaly', color: '#EF4444', size: 16 },
      content: (f) =>
        buildAnomalyPopupContent(f as Parameters<typeof buildAnomalyPopupContent>[0], theme),
    })
  }

  if (toggles.vrac) {
    specs.push({
      key: 'vrac',
      label: LAYER_LABELS.vrac,
      enabled: true,
      marker: { icon: 'vrac', color: '#F59E0B', size: 16 },
      content: () => buildVracPopupContent(view.vrac, theme),
    })
  }

  if (toggles.routes) {
    specs.push({
      key: 'routes',
      label: LAYER_LABELS.routes,
      enabled: true,
      marker: { icon: 'routes', color: '#2563EB', size: 18 },
      content: () => 'Itinéraire VRAC sous surveillance temps réel',
    })
  }

  return specs
}
