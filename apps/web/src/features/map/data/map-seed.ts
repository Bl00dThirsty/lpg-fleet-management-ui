import type { Site } from '@/features/sites/data/sites'
import type { ClientSiteView } from './client-sites'
import type { GeoAnomalyView } from './geo-anomalies'
import type { RegionSummary } from '../lib/regions'
import type { VracSummary } from '../lib/vrac-volume'

/**
 * Jeu de données de graine réaliste (Cameroun - Douala & Yaoundé)
 * Permet un rendu interactif immédiat et complet de la carte même si le backend
 * ne renvoie pas encore de données en base locale.
 */

export const DEFAULT_MAP_SITES: readonly Site[] = [
  {
    id: 'site-scdp-bonaberi',
    name: 'Dépôt SCDP Bonabéri',
    type: 'scdp',
    city: 'Douala',
    region: 'Littoral',
    operator: 'SCDP (Société Camerounaise des Dépôts Pétroliers)',
    latitude: 4.0700,
    longitude: 9.6800,
    description: 'Dépôt stratégique national — Stockage de sécurité et approvisionnement des centres emplisseurs.',
    status: 'active',
    isKeySite: true,
  },
  {
    id: 'site-total-bonaberi',
    name: 'Total Bonabéri (Centre Emplisseur & Vrac)',
    type: 'filling-center',
    city: 'Douala',
    region: 'Littoral',
    operator: 'TotalEnergies Marketing Cameroun',
    latitude: 4.0650,
    longitude: 9.6750,
    description: 'Centre principal de conditionnement bouteilles 50 kg et distribution VRAC pour la région du Littoral.',
    status: 'active',
    isKeySite: true,
  },
  {
    id: 'site-scdp-nsam',
    name: 'Dépôt SCDP Nsam',
    type: 'scdp',
    city: 'Yaoundé',
    region: 'Centre',
    operator: 'SCDP',
    latitude: 3.8350,
    longitude: 11.5050,
    description: 'Dépôt central de Yaoundé pour la distribution du Centre et Sud.',
    status: 'active',
    isKeySite: true,
  },
  {
    id: 'site-total-bafoussam',
    name: 'Total Bafoussam (Dépôt Relais)',
    type: 'depot',
    city: 'Bafoussam',
    region: 'Ouest',
    operator: 'TotalEnergies Marketing Cameroun',
    latitude: 5.4780,
    longitude: 10.4180,
    description: 'Point relais d\'approvisionnement pour la région Ouest et Nord-Ouest.',
    status: 'active',
    isKeySite: false,
  },
]

export const DEFAULT_MAP_CLIENT_SITES: readonly ClientSiteView[] = [
  {
    id: 'cs-akwa-palace',
    name: 'Akwa Palace Hotel (Cuves GPL Vrac)',
    city: 'Douala',
    region: 'Littoral',
    clientName: 'Groupe Hôtelier Akwa Palace',
    client_org_id: 'org-akwa-palace',
    current_marketeur_org_id: 'org-total-cameroun',
    is_active: true,
    markerType: 'client-delivery',
    latitude: 4.0500,
    longitude: 9.7000,
  },
  {
    id: 'cs-hotel-sawa',
    name: 'Hôtel Sawa Douala',
    city: 'Douala',
    region: 'Littoral',
    clientName: 'Société Hôtelière du Sawa',
    client_org_id: 'org-sawa',
    current_marketeur_org_id: 'org-total-cameroun',
    is_active: true,
    markerType: 'client-delivery',
    latitude: 4.0450,
    longitude: 9.6950,
  },
  {
    id: 'cs-sabc-ndokoti',
    name: 'Boissons du Cameroun — Usine Ndokoti',
    city: 'Douala',
    region: 'Littoral',
    clientName: 'SABC (Société Anonyme des Brasseries du Cameroun)',
    client_org_id: 'org-sabc',
    current_marketeur_org_id: 'org-total-cameroun',
    is_active: true,
    markerType: 'client-delivery',
    latitude: 4.0420,
    longitude: 9.7380,
  },
  {
    id: 'cs-hilton-yaounde',
    name: 'Hilton Hotel Yaoundé',
    city: 'Yaoundé',
    region: 'Centre',
    clientName: 'Hilton Worldwide Yaoundé',
    client_org_id: 'org-hilton',
    current_marketeur_org_id: 'org-tradex',
    is_active: true,
    markerType: 'client-delivery',
    latitude: 3.8680,
    longitude: 11.5200,
  },
]

export const DEFAULT_MAP_ANOMALIES: readonly GeoAnomalyView[] = [
  {
    id: 'ano-dla-001',
    type: 'VOLUMEGAP',
    category: 'INVESTIGATION',
    severity: 'ELEVE',
    status: 'NOUVEAU',
    entity_type: 'SITE',
    entity_id: 'site-total-bonaberi',
    entity_label: 'Total Bonabéri (Centre Emplisseur)',
    latitude: 4.0650,
    longitude: 9.6750,
  },
  {
    id: 'ano-yde-002',
    type: 'CHECKPOINTMISSED',
    category: 'TECHNICAL',
    severity: 'MODERE',
    status: 'ENCOURS',
    entity_type: 'SITE',
    entity_id: 'site-scdp-nsam',
    entity_label: 'Dépôt SCDP Nsam',
    latitude: 3.8350,
    longitude: 11.5050,
  },
]

export const DEFAULT_MAP_VRAC_SUMMARY: VracSummary = {
  totalTM: 33.5,
  unit: 'TM',
  activeTruckCount: 2,
}

export const CAMEROON_REGIONS_SEEDED: readonly RegionSummary[] = [
  { code: 'ADAMAOUA', name: 'Adamaoua', siteCount: 1, clientSiteCount: 0, anomalyCount: 0, longitude: 13.58, latitude: 7.36 },
  { code: 'CENTRE', name: 'Centre', siteCount: 3, clientSiteCount: 2, anomalyCount: 1, longitude: 11.52, latitude: 3.87 },
  { code: 'EST', name: 'Est', siteCount: 1, clientSiteCount: 0, anomalyCount: 0, longitude: 14.08, latitude: 4.58 },
  { code: 'EXTREMENORD', name: 'Extrême-Nord', siteCount: 1, clientSiteCount: 0, anomalyCount: 0, longitude: 14.33, latitude: 10.59 },
  { code: 'LITTORAL', name: 'Littoral', siteCount: 5, clientSiteCount: 4, anomalyCount: 1, longitude: 9.70, latitude: 4.05 },
  { code: 'NORD', name: 'Nord', siteCount: 1, clientSiteCount: 0, anomalyCount: 0, longitude: 13.40, latitude: 9.30 },
  { code: 'NORDOUEST', name: 'Nord-Ouest', siteCount: 1, clientSiteCount: 0, anomalyCount: 0, longitude: 10.15, latitude: 5.96 },
  { code: 'OUEST', name: 'Ouest', siteCount: 2, clientSiteCount: 1, anomalyCount: 0, longitude: 10.42, latitude: 5.48 },
  { code: 'SUD', name: 'Sud', siteCount: 1, clientSiteCount: 0, anomalyCount: 0, longitude: 11.15, latitude: 2.92 },
  { code: 'SUDOUEST', name: 'Sud-Ouest', siteCount: 2, clientSiteCount: 1, anomalyCount: 0, longitude: 9.24, latitude: 4.16 },
]
