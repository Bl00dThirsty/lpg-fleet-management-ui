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

export type Checkpoint = {
  id: string
  name: string
  address: string
  status: "pending" | "in_progress" | "completed" | "failed"
  scheduledTime: string
  actualTime?: string
  coordinates: Coordinate
}

export type Trip = {
  id: string
  status: TripStatus
  progress: number
  origin: TripLocation
  destination: TripLocation
  marketer: MarketerInfo
  cargo: string
  cargoType: "vrac" | "bouteille"
  volume: string
  truckPlate: string
  driver: string
  eta: string
  etaMeta: string
  handling: {
    label: string
    note: string
    tags: { label: string; type?: "warning" | "info" }[]
  }
  checkpoints: Checkpoint[]
  createdAt: string
  updatedAt: string
}

export const trips: Trip[] = [
  {
    id: "TRN-2048",
    status: "Retardé",
    progress: 28,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Douala",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "301 Bouteilles",
    truckPlate: "LT 9810 UX",
    driver: "Chauffeur 1",
    eta: "13:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2048-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2048-2", name: "Livraison Station", address: "Douala", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-04T08:00:00Z",
    updatedAt: "2026-07-07T14:30:00Z"
  },
  {
    id: "TRN-2049",
    status: "Retardé",
    progress: 29,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Yaoundé",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "203 Bouteilles",
    truckPlate: "LT 4035 ZT",
    driver: "Chauffeur 2",
    eta: "16:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2049-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2049-2", name: "Livraison Station", address: "Yaoundé", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-07T08:00:00Z",
    updatedAt: "2026-07-13T14:30:00Z"
  },
  {
    id: "TRN-2050",
    status: "Retardé",
    progress: 88,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Bafoussam",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "GPL Vrac",
    cargoType: "vrac",
    volume: "22 TM",
    truckPlate: "LT 2701 YB",
    driver: "Chauffeur 3",
    eta: "12:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2050-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2050-2", name: "Livraison Station", address: "Bafoussam", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-14T14:30:00Z"
  },
  {
    id: "TRN-2051",
    status: "Planifié",
    progress: 0,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Garoua",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "GPL Vrac",
    cargoType: "vrac",
    volume: "16 TM",
    truckPlate: "LT 5494 NW",
    driver: "Chauffeur 4",
    eta: "11:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2051-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2051-2", name: "Livraison Station", address: "Garoua", status: "pending", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-01T14:30:00Z"
  },
  {
    id: "TRN-2052",
    status: "En transit",
    progress: 71,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Kribi",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "GPL Vrac",
    cargoType: "vrac",
    volume: "23 TM",
    truckPlate: "LT 5053 HG",
    driver: "Chauffeur 5",
    eta: "16:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2052-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2052-2", name: "Livraison Station", address: "Kribi", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-12T08:00:00Z",
    updatedAt: "2026-07-12T14:30:00Z"
  },
  {
    id: "TRN-2053",
    status: "En livraison",
    progress: 17,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Limbe",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "585 Bouteilles",
    truckPlate: "LT 6789 SR",
    driver: "Chauffeur 6",
    eta: "10:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2053-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2053-2", name: "Livraison Station", address: "Limbe", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-13T08:00:00Z",
    updatedAt: "2026-07-15T14:30:00Z"
  },
  {
    id: "TRN-2054",
    status: "Livré",
    progress: 100,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Edéa",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "451 Bouteilles",
    truckPlate: "LT 9373 SV",
    driver: "Chauffeur 7",
    eta: "9:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2054-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2054-2", name: "Livraison Station", address: "Edéa", status: "completed", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-03T08:00:00Z",
    updatedAt: "2026-07-07T14:30:00Z"
  },
  {
    id: "TRN-2055",
    status: "Planifié",
    progress: 0,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Douala",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "338 Bouteilles",
    truckPlate: "LT 1407 OZ",
    driver: "Chauffeur 8",
    eta: "12:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2055-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2055-2", name: "Livraison Station", address: "Douala", status: "pending", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-11T08:00:00Z",
    updatedAt: "2026-07-15T14:30:00Z"
  },
  {
    id: "TRN-2056",
    status: "Planifié",
    progress: 0,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Yaoundé",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "GPL Vrac",
    cargoType: "vrac",
    volume: "20 TM",
    truckPlate: "LT 9425 MY",
    driver: "Chauffeur 9",
    eta: "15:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2056-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2056-2", name: "Livraison Station", address: "Yaoundé", status: "pending", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-11T08:00:00Z",
    updatedAt: "2026-07-14T14:30:00Z"
  },
  {
    id: "TRN-2057",
    status: "Planifié",
    progress: 0,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Bafoussam",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "435 Bouteilles",
    truckPlate: "LT 3358 YO",
    driver: "Chauffeur 10",
    eta: "10:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2057-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2057-2", name: "Livraison Station", address: "Bafoussam", status: "pending", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-06T08:00:00Z",
    updatedAt: "2026-07-15T14:30:00Z"
  },
  {
    id: "TRN-2058",
    status: "Planifié",
    progress: 0,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Garoua",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "331 Bouteilles",
    truckPlate: "LT 2723 RL",
    driver: "Chauffeur 11",
    eta: "9:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2058-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2058-2", name: "Livraison Station", address: "Garoua", status: "pending", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-07T08:00:00Z",
    updatedAt: "2026-07-10T14:30:00Z"
  },
  {
    id: "TRN-2059",
    status: "Planifié",
    progress: 0,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Kribi",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "GPL Vrac",
    cargoType: "vrac",
    volume: "16 TM",
    truckPlate: "LT 3255 QY",
    driver: "Chauffeur 12",
    eta: "12:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2059-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2059-2", name: "Livraison Station", address: "Kribi", status: "pending", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-07T08:00:00Z",
    updatedAt: "2026-07-15T14:30:00Z"
  },
  {
    id: "TRN-2060",
    status: "Livré",
    progress: 100,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Limbe",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "342 Bouteilles",
    truckPlate: "LT 4064 BO",
    driver: "Chauffeur 13",
    eta: "8:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2060-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2060-2", name: "Livraison Station", address: "Limbe", status: "completed", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-05T08:00:00Z",
    updatedAt: "2026-07-10T14:30:00Z"
  },
  {
    id: "TRN-2061",
    status: "En livraison",
    progress: 59,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Edéa",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "517 Bouteilles",
    truckPlate: "LT 9557 OF",
    driver: "Chauffeur 14",
    eta: "13:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2061-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2061-2", name: "Livraison Station", address: "Edéa", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-08T08:00:00Z",
    updatedAt: "2026-07-08T14:30:00Z"
  },
  {
    id: "TRN-2062",
    status: "En livraison",
    progress: 27,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Douala",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "415 Bouteilles",
    truckPlate: "LT 1062 GE",
    driver: "Chauffeur 15",
    eta: "14:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2062-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2062-2", name: "Livraison Station", address: "Douala", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-12T08:00:00Z",
    updatedAt: "2026-07-14T14:30:00Z"
  },
  {
    id: "TRN-2063",
    status: "En transit",
    progress: 58,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Yaoundé",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "363 Bouteilles",
    truckPlate: "LT 1286 JD",
    driver: "Chauffeur 16",
    eta: "16:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2063-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2063-2", name: "Livraison Station", address: "Yaoundé", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-05T08:00:00Z",
    updatedAt: "2026-07-10T14:30:00Z"
  },
  {
    id: "TRN-2064",
    status: "Planifié",
    progress: 0,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Bafoussam",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "GPL Vrac",
    cargoType: "vrac",
    volume: "22 TM",
    truckPlate: "LT 4753 MJ",
    driver: "Chauffeur 17",
    eta: "12:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2064-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2064-2", name: "Livraison Station", address: "Bafoussam", status: "pending", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-12T08:00:00Z",
    updatedAt: "2026-07-14T14:30:00Z"
  },
  {
    id: "TRN-2065",
    status: "Retardé",
    progress: 60,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Garoua",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "263 Bouteilles",
    truckPlate: "LT 1429 OU",
    driver: "Chauffeur 18",
    eta: "16:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2065-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2065-2", name: "Livraison Station", address: "Garoua", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-04T14:30:00Z"
  },
  {
    id: "TRN-2066",
    status: "En livraison",
    progress: 35,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Kribi",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "559 Bouteilles",
    truckPlate: "LT 8382 XD",
    driver: "Chauffeur 19",
    eta: "14:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2066-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2066-2", name: "Livraison Station", address: "Kribi", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-02T08:00:00Z",
    updatedAt: "2026-07-11T14:30:00Z"
  },
  {
    id: "TRN-2067",
    status: "Retardé",
    progress: 40,
    origin: {
      name: "Dépôt SCDP",
      city: "Douala",
      coordinates: [9.7, 4.05],
    },
    destination: {
      name: "Station Total",
      city: "Limbe",
      coordinates: [11.5, 3.8],
    },
    marketer: {
      id: "MKT-001",
      name: "TOTALENERGIES",
      initials: "TE",
      tier: "Premium",
    },
    cargo: "Bouteilles 50kg",
    cargoType: "bouteille",
    volume: "245 Bouteilles",
    truckPlate: "LT 1941 IG",
    driver: "Chauffeur 20",
    eta: "11:30",
    etaMeta: "Aujourd'hui",
    handling: {
      label: "RAS",
      note: "Trajet régulier",
      tags: [],
    },
    checkpoints: [
      { id: "ckpt-2067-1", name: "Chargement SCDP", address: "Dépôt SCDP Douala", status: "completed", scheduledTime: "08:00", actualTime: "08:15", coordinates: [9.7, 4.05] },
      { id: "ckpt-2067-2", name: "Livraison Station", address: "Limbe", status: "in_progress", scheduledTime: "14:00", coordinates: [11.5, 3.8] }
    ],
    createdAt: "2026-07-05T08:00:00Z",
    updatedAt: "2026-07-08T14:30:00Z"
  },

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
    cargoType: "vrac",
    checkpoints: [],
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-10T14:30:00Z",
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
    cargoType: "bouteille",
    checkpoints: [],
    createdAt: "2026-07-02T08:00:00Z",
    updatedAt: "2026-07-11T14:30:00Z",
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
    cargoType: "vrac",
    checkpoints: [],
    createdAt: "2026-07-03T08:00:00Z",
    updatedAt: "2026-07-12T14:30:00Z",
  },
]


export const tripStatusOptions = [
  { label: "Planifié", value: "Planifié" },
  { label: "En transit", value: "En transit" },
  { label: "En livraison", value: "En livraison" },
  { label: "Livré", value: "Livré" },
  { label: "Retardé", value: "Retardé" },
]

export const cargoTypeOptions = [
  { label: "Vrac", value: "vrac" },
  { label: "Bouteille 50kg", value: "bouteille" },
]
