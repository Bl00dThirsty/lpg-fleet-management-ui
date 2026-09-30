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

export function getAllVracRoutes(): VracTourRoute[] {
  return [DOUALA_VRAC_ROUTE, YAOUNDE_VRAC_ROUTE]
}

export function getVracRouteByCode(code: string): VracTourRoute | undefined {
  return getAllVracRoutes().find((r) => r.tourCode === code)
}
