import type { ClientSiteView } from '../data/client-sites'
import type { GeoAnomalyView } from '../data/geo-anomalies'
import type { ZoneView } from '../../zones/data/zones'
import type { RegionSummary } from '../lib/regions'
import type { VracSummary } from '../lib/vrac-volume'
import type { VracTourRoute } from '../data/itineraries'
import type { MapTheme } from './map-theme'
import {
  popupLine,
  popupHtmlLine,
  escapePopupValue,
  createSitePopupContent,
} from '../../sites/utils/site-graphics'
import { formatTm } from './format'

export type PopupContent = string

export function buildClientSitePopupContent(
  cs: ClientSiteView,
  theme: MapTheme = 'light',
): PopupContent {
  return `
    <div class="fleet-truck-popup" data-popup-theme="${theme}">
      ${popupLine('Région', cs.region)}
      ${popupLine('Client', cs.clientName)}
      ${popupHtmlLine(
        'Voir la fiche',
        `<a href="/client-sites" style="color:#2563eb;text-decoration:underline;font-weight:600;">Ouvrir la fiche client →</a>`,
      )}
    </div>
  `
}

export function buildZonePopupContent(zone: ZoneView, theme: MapTheme = 'light'): PopupContent {
  return `
    <div class="fleet-truck-popup" data-popup-theme="${theme}">
      ${popupLine('Région', zone.region)}
      ${popupLine('Sites', String(zone.siteCount))}
      ${popupLine('Sites clients', String(zone.clientSiteCount))}
    </div>
  `
}

export function buildRegionPopupContent(
  region: RegionSummary,
  theme: MapTheme = 'light',
): PopupContent {
  return `
    <div class="fleet-truck-popup" data-popup-theme="${theme}">
      ${popupLine('Région', region.name)}
      ${popupLine('Centres & Dépôts', String(region.siteCount))}
      ${popupLine('Sites clients', String(region.clientSiteCount))}
      ${popupLine('Anomalies actives', String(region.anomalyCount))}
    </div>
  `
}

export function buildVracPopupContent(vrac: VracSummary, theme: MapTheme = 'light'): PopupContent {
  return `
    <div class="fleet-truck-popup" data-popup-theme="${theme}">
      ${popupLine('Total VRAC tracé', formatTm(vrac.totalTM))}
      ${popupLine('Camions actifs', String(vrac.activeTruckCount))}
    </div>
  `
}

export function buildAnomalyPopupContent(
  anomaly: GeoAnomalyView,
  theme: MapTheme = 'light',
): PopupContent {
  return `
    <div class="fleet-truck-popup" data-popup-theme="${theme}">
      ${popupLine('Catégorie', anomaly.category)}
      ${popupHtmlLine(
        'Gravité',
        `<span style="color:#ef4444;font-weight:700;">${escapePopupValue(anomaly.severity)}</span>`,
      )}
      ${popupLine('Statut', anomaly.status)}
      ${anomaly.entity_label ? popupLine('Entité concernée', anomaly.entity_label) : ''}
    </div>
  `
}

export function buildRoutePopupContent(
  route: VracTourRoute,
  theme: MapTheme = 'light',
): PopupContent {
  return `
    <div class="fleet-truck-popup" data-popup-theme="${theme}">
      ${popupLine('Code tournée', route.tourCode)}
      ${popupHtmlLine(
        'Statut',
        `<span style="color:#f59e0b;font-weight:600;">${escapePopupValue(route.statusLabel)}</span>`,
      )}
      ${popupLine('Marketeur', route.marketerName)}
      ${popupLine('Transporteur', route.transporterName)}
      ${popupLine('Citerne VRAC', route.vehiclePlate)}
      ${popupLine('Chauffeur', route.driverName)}
      ${popupHtmlLine(
        'Cargaison GPL',
        `<span style="font-weight:700;color:#10b981;">${formatTm(route.loadedQuantityTM)}</span>`,
      )}
      ${popupLine('Trajet prévu', `${route.distanceKm} km (~${route.estimatedDurationMin} min)`)}
      ${popupLine('Point départ', route.departureName)}
      ${popupLine('Point livraison', route.destinationName)}
    </div>
  `
}

export {
  popupLine,
  popupHtmlLine,
  escapePopupValue,
  createSitePopupContent as buildSitePopupContent,
}
