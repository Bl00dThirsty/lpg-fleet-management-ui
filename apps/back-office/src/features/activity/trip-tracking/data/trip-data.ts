export type TripStatus =
  | 'Planifié'
  | 'En transit'
  | 'En livraison'
  | 'Livré'
  | 'Retardé'

export type Coordinate = [number, number] // [longitude, latitude]

export type TripLocation = {
  name: string
  city: string
  coordinates: Coordinate
}

export type MarketerInfo = {
  id: string
  name: string
  initials: string
  tier: string
}

export type Trip = {
  id: string
  status: TripStatus
  progress: number
  origin: TripLocation
  destination: TripLocation
  marketer: MarketerInfo
  cargo: string // e.g. "GPL Vrac" or "Bouteilles 50kg"
  volume: string // e.g. "18 TM" or "600 Bouteilles"
  truckPlate: string
  driver: string
  eta: string // Estimated Time of Arrival
  etaMeta: string // e.g. "Aujourd'hui, 14:00"
  handling: {
    label: string
    note: string
    tags: { label: string; type?: 'warning' | 'info' }[]
  }
}

export const trips: Trip[] = [
  {
    id: 'TRN-2045',
    status: 'En transit',
    progress: 45,
    origin: {
      name: 'Dépôt SCDP',
      city: 'Douala',
      coordinates: [9.7, 4.05], // Longitude, Latitude
    },
    destination: {
      name: 'Total Nsam',
      city: 'Yaoundé',
      coordinates: [11.5167, 3.8667],
    },
    marketer: {
      id: 'MKT-001',
      name: 'TOTALENERGIES',
      initials: 'TE',
      tier: 'Premium',
    },
    cargo: 'GPL Vrac',
    volume: '20 TM',
    truckPlate: 'LT 3344 AB',
    driver: 'Azambou Yvana',
    eta: '16:30',
    etaMeta: "Aujourd'hui",
    handling: {
      label: 'Attention Route Nationale 3',
      note: 'Travaux en cours près de Pouma. Ralentissement attendu.',
      tags: [{ label: 'Trafic', type: 'warning' }],
    },
  },
  {
    id: 'TRN-2046',
    status: 'En livraison',
    progress: 85,
    origin: {
      name: 'Dépôt SCDP',
      city: 'Yaoundé',
      coordinates: [11.5167, 3.8667],
    },
    destination: {
      name: 'Tradex Biyem-Assi',
      city: 'Yaoundé',
      coordinates: [11.49, 3.83],
    },
    marketer: {
      id: 'MKT-006',
      name: 'TRADEX',
      initials: 'TR',
      tier: 'Standard',
    },
    cargo: 'BouteilleS 50kg',
    volume: '500 Bouteilles',
    truckPlate: 'CE 1100 MN',
    driver: 'Eteme Jean',
    eta: '11:00',
    etaMeta: "Aujourd'hui",
    handling: {
      label: 'Déchargement Manuel',
      note: 'Le chariot élévateur de la station est en panne.',
      tags: [{ label: 'Manutention', type: 'info' }],
    },
  },
  {
    id: 'TRN-2047',
    status: 'Planifié',
    progress: 0,
    origin: {
      name: 'Dépôt Bonaberi',
      city: 'Douala',
      coordinates: [9.67, 4.08],
    },
    destination: {
      name: 'Camgaz Bamenda',
      city: 'Bamenda',
      coordinates: [10.15, 5.96],
    },
    marketer: {
      id: 'MKT-002',
      name: 'CAMGAZ',
      initials: 'CG',
      tier: 'Premium',
    },
    cargo: 'GPL Vrac',
    volume: '18 TM',
    truckPlate: 'LT 5566 CD',
    driver: 'Malonguem Laura',
    eta: '08:00',
    etaMeta: 'Demain',
    handling: {
      label: 'Longue Distance',
      note: 'Vérification complète du tracteur requise avant le départ.',
      tags: [{ label: 'Maintenance', type: 'warning' }],
    },
  },
]
