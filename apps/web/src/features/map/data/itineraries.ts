export interface RouteCheckpoint {
  id: string
  name: string
  type: 'loading' | 'weighing' | 'waypoint' | 'delivery'
  coords: [number, number] // [lng, lat]
  status: 'COMPLETED' | 'INPROGRESS' | 'PENDING'
  plannedTime: string
  actualTime?: string
  notes?: string
}

export interface VracTourRoute {
  id: string
  tourCode: string
  title: string
  executionMode: 'INTERNAL' | 'EXTERNAL'
  status: 'INPROGRESS' | 'PLANNED' | 'COMPLETED'
  statusLabel: string
  marketerOrgId?: string
  marketerName: string
  transporterName: string
  vehiclePlate: string
  vehicleType: string
  driverName: string
  driverPhone: string
  departureName: string
  departureCoords: [number, number] // [lng, lat]
  destinationName: string
  destinationCoords: [number, number] // [lng, lat]
  currentPosition: [number, number] // [lng, lat]
  loadedQuantityTM: number
  capacityTM: number
  distanceKm: number
  estimatedDurationMin: number
  startedAt: string
  estimatedArrival: string
  product: string
  pressureBars: number
  temperatureCelsius: number
  path: [number, number][] // Mock waypoints, not a road geometry
  roadPaths?: [number, number][][]
  roadStatus?: 'pending' | 'success' | 'error'
  checkpoints: RouteCheckpoint[]
}

/**
 * Itinéraire simulé Douala : Total Bonabéri (Centre Emplisseur) ➔ Pont du Wouri ➔ Akwa Palace Hotel
 * ArcGIS calcule la géométrie routière à partir de ces étapes simulées.
 */
export const DOUALA_VRAC_ROUTE: VracTourRoute = {
  id: 'tour-vrac-dla-001',
  tourCode: 'TR-VRAC-DLA-001',
  title: 'Total Bonabéri → Akwa Palace Hotel',
  executionMode: 'EXTERNAL',
  status: 'INPROGRESS',
  statusLabel: 'En transit — Traversée Pont du Wouri',
  marketerOrgId: 'org-0003-total-0000-000000000001',
  marketerName: 'TotalEnergies Marketing Cameroun',
  transporterName: 'CAMTRANS GPL Logistique',
  vehiclePlate: 'LT-982-AA',
  vehicleType: 'Camion Citerne VRAC (Capacité 25 TM)',
  driverName: 'Jean-Paul Manga',
  driverPhone: '+237 699 45 12 78',
  departureName: 'Total Bonabéri (Centre Emplisseur)',
  departureCoords: [9.6750, 4.0650],
  destinationName: 'Akwa Palace Hotel (Cuve VRAC 20 TM)',
  destinationCoords: [9.7000, 4.0500],
  currentPosition: [9.6980, 4.0630], // Actuellement sur le Pont du Wouri
  loadedQuantityTM: 18.5,
  capacityTM: 25.0,
  distanceKm: 6.8,
  estimatedDurationMin: 22,
  startedAt: '08:30',
  estimatedArrival: '09:15',
  product: 'GPL Industriel / Commercial Vrac (Propane/Butane 70/30)',
  pressureBars: 12.4,
  temperatureCelsius: 24.5,
  path: [
    [9.6750, 4.0650], // Départ : Dépôt & Centre Emplisseur Total Bonabéri
    [9.6805, 4.0680], // RN3 Avenue Bonabéri
    [9.6860, 4.0695], // Carrefour 4ème Bonabéri
    [9.6910, 4.0685], // Échangeur Ouest / Entrée Pont du Wouri
    [9.6980, 4.0630], // Traversée Pont sur le Wouri (milieu du fleuve) — Position actuelle
    [9.7040, 4.0580], // Sortie Est / Rond-Point Deïdo
    [9.7025, 4.0540], // Boulevard de la Liberté (Akwa Nord)
    [9.7000, 4.0500], // Arrivée : Akwa Palace Hotel, Boulevard de la Liberté
  ],
  checkpoints: [
    {
      id: 'cp-1',
      name: 'Total Bonabéri — Chargement & Pesée initiale',
      type: 'loading',
      coords: [9.6750, 4.0650],
      status: 'COMPLETED',
      plannedTime: '08:30',
      actualTime: '08:35',
      notes: '18,5 TM validées au pont-bascule certifié CSPH. Scellés n° CSPH-DLA-8891.',
    },
    {
      id: 'cp-2',
      name: 'Poste de Pesage & Contrôle Bonabéri',
      type: 'weighing',
      coords: [9.6860, 4.0695],
      status: 'COMPLETED',
      plannedTime: '08:45',
      actualTime: '08:48',
      notes: 'Poids brut vérifié : conforme au bon d\'expédition.',
    },
    {
      id: 'cp-3',
      name: 'Traversée Pont du Wouri (Surveillance GPS)',
      type: 'waypoint',
      coords: [9.6980, 4.0630],
      status: 'INPROGRESS',
      plannedTime: '08:55',
      actualTime: '08:56',
      notes: 'Vitesse camion : 38 km/h. Balise GPS active, aucune déviation détectée.',
    },
    {
      id: 'cp-4',
      name: 'Akwa Palace Hotel — Dépotage Cuve Vrac',
      type: 'delivery',
      coords: [9.7000, 4.0500],
      status: 'PENDING',
      plannedTime: '09:15',
      notes: 'Réceptionnaire : Chef de Sécurité Énergie Akwa Palace.',
    },
  ],
}

/**
 * Itinéraire secondaire Yaoundé : SCDP Nsam ➔ Hilton Hotel Yaoundé
 */
export const YAOUNDE_VRAC_ROUTE: VracTourRoute = {
  id: 'tour-vrac-yde-002',
  tourCode: 'TR-VRAC-YDE-002',
  title: 'SCDP Nsam → Hilton Hotel Yaoundé',
  executionMode: 'EXTERNAL',
  status: 'PLANNED',
  statusLabel: 'Planifiée — Départ prévu 14:00',
  marketerOrgId: 'org-0006-tradex-000-000000000001',
  marketerName: 'Tradex Cameroun',
  transporterName: 'Express Gaz Transport',
  vehiclePlate: 'CE-415-BX',
  vehicleType: 'Camion Citerne VRAC (Capacité 20 TM)',
  driverName: 'Samuel Eto\'o Junior',
  driverPhone: '+237 677 88 99 00',
  departureName: 'Dépôt SCDP Nsam (Yaoundé)',
  departureCoords: [11.5050, 3.8350],
  destinationName: 'Hilton Hotel Yaoundé (Boulevard du 20 Mai)',
  destinationCoords: [11.5200, 3.8680],
  currentPosition: [11.5050, 3.8350],
  loadedQuantityTM: 15.0,
  capacityTM: 20.0,
  distanceKm: 5.2,
  estimatedDurationMin: 18,
  startedAt: '14:00',
  estimatedArrival: '14:30',
  product: 'GPL Vrac Hôtellerie',
  pressureBars: 11.8,
  temperatureCelsius: 22.0,
  path: [
    [11.5050, 3.8350],
    [11.5080, 3.8450],
    [11.5120, 3.8550],
    [11.5170, 3.8620],
    [11.5200, 3.8680],
  ],
  checkpoints: [
    {
      id: 'cp-yde-1',
      name: 'Dépôt SCDP Nsam — Chargement',
      type: 'loading',
      coords: [11.5050, 3.8350],
      status: 'PENDING',
      plannedTime: '14:00',
      notes: 'Créneau validé par le responsable dépôt.',
    },
    {
      id: 'cp-yde-2',
      name: 'Hilton Hotel Yaoundé — Dépotage',
      type: 'delivery',
      coords: [11.5200, 3.8680],
      status: 'PENDING',
      plannedTime: '14:30',
      notes: 'Livraison cuve restaurant & chaudières.',
    },
  ],
}

/**
 * Itinéraire SCTM Ouest : SCDP Bafoussam ➔ Brasseries du Cameroun Bafoussam
 */
export const SCTM_VRAC_ROUTE: VracTourRoute = {
  id: 'tour-vrac-bfm-003',
  tourCode: 'TR-VRAC-BFM-003',
  title: 'SCDP Bafoussam → Brasseries du Cameroun',
  executionMode: 'INTERNAL',
  status: 'INPROGRESS',
  statusLabel: 'En cours — Livraison zone industrielle',
  marketerOrgId: 'org-0002-sctm-0000-000000000001',
  marketerName: 'SCTM — Société Camerounaise de Transformations Métalliques',
  transporterName: 'Flotte Interne SCTM',
  vehiclePlate: 'OU-512-AA',
  vehicleType: 'Camion Citerne VRAC (Capacité 22 TM)',
  driverName: 'Michel Kamga',
  driverPhone: '+237 675 33 22 11',
  departureName: 'Dépôt SCDP Bafoussam',
  departureCoords: [10.4150, 5.4750],
  destinationName: 'Brasseries du Cameroun (Usine Bafoussam)',
  destinationCoords: [10.4350, 5.4950],
  currentPosition: [10.4250, 5.4850],
  loadedQuantityTM: 20.0,
  capacityTM: 22.0,
  distanceKm: 4.8,
  estimatedDurationMin: 15,
  startedAt: '10:00',
  estimatedArrival: '10:25',
  product: 'GPL Vrac Industriel',
  pressureBars: 12.0,
  temperatureCelsius: 21.5,
  path: [
    [10.4150, 5.4750],
    [10.4200, 5.4800],
    [10.4250, 5.4850],
    [10.4300, 5.4900],
    [10.4350, 5.4950],
  ],
  checkpoints: [
    {
      id: 'cp-bfm-1',
      name: 'Dépôt SCDP Bafoussam — Chargement',
      type: 'loading',
      coords: [10.4150, 5.4750],
      status: 'COMPLETED',
      plannedTime: '10:00',
      actualTime: '10:05',
    },
    {
      id: 'cp-bfm-2',
      name: 'Usine SABC Bafoussam — Dépotage',
      type: 'delivery',
      coords: [10.4350, 5.4950],
      status: 'PENDING',
      plannedTime: '10:25',
    },
  ],
}

/**
 * Itinéraire Camgaz Littoral / Sud-Ouest : SONARA Limbé ➔ Sawa Hotel Douala
 */
export const CAMGAZ_VRAC_ROUTE: VracTourRoute = {
  id: 'tour-vrac-lmb-004',
  tourCode: 'TR-VRAC-LMB-004',
  title: 'Terminal SONARA Limbé → Sawa Hotel Douala',
  executionMode: 'EXTERNAL',
  status: 'PLANNED',
  statusLabel: 'Planifiée — Convoi inter-urbain',
  marketerOrgId: 'org-0005-camg-0000-000000000001',
  marketerName: 'Camgaz — Société Camerounaise de Gaz',
  transporterName: 'Express Gaz Transport',
  vehiclePlate: 'SW-834-BB',
  vehicleType: 'Camion Citerne VRAC (Capacité 28 TM)',
  driverName: 'David Ngolle',
  driverPhone: '+237 691 22 44 66',
  departureName: 'Raffinerie SONARA Limbé',
  departureCoords: [9.1950, 4.0120],
  destinationName: 'Hôtel Sawa Douala (Bonanjo)',
  destinationCoords: [9.6890, 4.0430],
  currentPosition: [9.1950, 4.0120],
  loadedQuantityTM: 24.5,
  capacityTM: 28.0,
  distanceKm: 65.0,
  estimatedDurationMin: 90,
  startedAt: '15:30',
  estimatedArrival: '17:00',
  product: 'GPL Commercial Propane/Butane',
  pressureBars: 12.2,
  temperatureCelsius: 25.0,
  path: [
    [9.1950, 4.0120],
    [9.2500, 4.0200],
    [9.4000, 4.0300],
    [9.5500, 4.0400],
    [9.6890, 4.0430],
  ],
  checkpoints: [
    {
      id: 'cp-lmb-1',
      name: 'SONARA Limbé — Remplissage Citerne',
      type: 'loading',
      coords: [9.1950, 4.0120],
      status: 'PENDING',
      plannedTime: '15:30',
    },
    {
      id: 'cp-lmb-2',
      name: 'Hôtel Sawa Bonanjo — Dépotage',
      type: 'delivery',
      coords: [9.6890, 4.0430],
      status: 'PENDING',
      plannedTime: '17:00',
    },
  ],
}

export function getAllVracRoutes(): VracTourRoute[] {
  return [DOUALA_VRAC_ROUTE, YAOUNDE_VRAC_ROUTE, SCTM_VRAC_ROUTE, CAMGAZ_VRAC_ROUTE]
}

export function getVracRouteByCode(code: string): VracTourRoute | undefined {
  return getAllVracRoutes().find((r) => r.tourCode === code)
}
