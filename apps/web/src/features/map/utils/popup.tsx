import type { ClientSiteView } from '../data/client-sites'
import type { GeoAnomalyView } from '../data/geo-anomalies'
import type { ZoneView } from '../../zones/data/zones'
import type { RegionSummary } from '../lib/regions'
import type { VracSummary } from '../lib/vrac-volume'
import type { VracTourRoute } from '../data/itineraries'
import type { MapTheme } from './map-theme'
import {
  popupLine,
  escapePopupValue,
  createSitePopupContent,
} from '../../sites/utils/site-graphics'
import { formatTm } from './format'

export type PopupContent = string

export function buildClientSitePopupContent(
  cs: ClientSiteView,
  _theme: MapTheme,
): PopupContent {
  return [
    popupLine('Région', escapePopupValue(cs.region)),
    popupLine('Client', escapePopupValue(cs.clientName)),
    popupLine(
      'Voir la fiche',
      `<a href="/client-sites" style="color:#2563eb;text-decoration:underline;">Ouvrir la fiche client →</a>`,
    ),
  ].join('')
}

export function buildZonePopupContent(zone: ZoneView, _theme: MapTheme): PopupContent {
  return [
    popupLine('Région', escapePopupValue(zone.region)),
    popupLine('Sites', String(zone.siteCount)),
    popupLine('Sites clients', String(zone.clientSiteCount)),
  ].join('')
}

export function buildRegionPopupContent(
  region: RegionSummary,
  _theme: MapTheme,
): PopupContent {
  return [
    popupLine('Région', escapePopupValue(region.name)),
    popupLine('Centres & Dépôts', String(region.siteCount)),
    popupLine('Sites clients', String(region.clientSiteCount)),
    popupLine('Anomalies actives', String(region.anomalyCount)),
  ].join('')
}

export function buildVracPopupContent(vrac: VracSummary, _theme: MapTheme): PopupContent {
  return [
    popupLine('Total VRAC tracé', formatTm(vrac.totalTM)),
    popupLine('Camions actifs', String(vrac.activeTruckCount)),
  ].join('')
}

export function buildAnomalyPopupContent(
  anomaly: GeoAnomalyView,
  _theme: MapTheme,
): PopupContent {
  const lines: string[] = [
    popupLine('Catégorie', escapePopupValue(anomaly.category)),
    popupLine('Gravité', `<span style="color:#ef4444;font-weight:700">${escapePopupValue(anomaly.severity)}</span>`),
    popupLine('Statut', escapePopupValue(anomaly.status)),
  ]
  if (anomaly.entity_label) {
    lines.push(popupLine('Entité concernée', escapePopupValue(anomaly.entity_label)))
  }
  return lines.join('')
}

export function buildRoutePopupContent(
  route: VracTourRoute,
  _theme: MapTheme,
): PopupContent {
  return [
    popupLine('Code tournée', escapePopupValue(route.tourCode)),
    popupLine('Statut', `<span style="color:#f59e0b;font-weight:600">${escapePopupValue(route.statusLabel)}</span>`),
    popupLine('Marketeur', escapePopupValue(route.marketerName)),
    popupLine('Transporteur', escapePopupValue(route.transporterName)),
    popupLine('Citerne VRAC', escapePopupValue(route.vehiclePlate)),
    popupLine('Chauffeur', escapePopupValue(route.driverName)),
    popupLine('Cargaison GPL', `<span style="font-weight:700;color:#10b981">${formatTm(route.loadedQuantityTM)}</span>`),
    popupLine('Trajet prévu', `${route.distanceKm} km (~${route.estimatedDurationMin} min)`),
    popupLine('Point départ', escapePopupValue(route.departureName)),
    popupLine('Point livraison', escapePopupValue(route.destinationName)),
  ].join('')
}

export { createSitePopupContent as buildSitePopupContent }
