export type TruckStatus =
  | 'available'
  | 'in_transit'
  | 'maintenance'
  | 'inactive'

export type ContractTier = 'Starter' | 'Growth' | 'Enterprise'

export type TruckRiskLevel = 'low' | 'medium' | 'high'

export type Truck = {
  id: string
  plateNumber: string
  tenantName: string
  marketer: string
  status: TruckStatus
  tankCapacityLiters: number
  compartments: number
  fuelType: 'GPL'
  makeModel: string
  year: number
  gpsImei: string
  assignedDriver: string
  driverPhone: string
  fleetManager: string
  operatingRegion: string
  homeDepot: string
  currentLocation: string
  latitude: number
  longitude: number
  destination: string
  destinationLatitude: number
  destinationLongitude: number
  assignedRoute: string
  odometerKm: number
  nextServiceKm: number
  lastServiceDate: string
  insuranceExpiry: string
  technicalVisitExpiry: string
  permitExpiry: string
  lastPing: string
  contractTier: ContractTier
  riskLevel: TruckRiskLevel
}

export type TruckTelemetry = {
  speedKmh: number
  lpgLevelPercent: number
  etaText: string
  distanceKm: number
  routeProgress: number
  pressureBar: number
  temperatureCelsius: number
}

export const statusLabels: Record<TruckStatus, string> = {
  available: 'Disponible',
  in_transit: 'En livraison',
  maintenance: 'Maintenance',
  inactive: 'Inactif',
}

export const statusClasses: Record<TruckStatus, string> = {
  available:
    'border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  in_transit:
    'border border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  maintenance:
    'border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  inactive: 'border border-muted bg-muted text-muted-foreground',
}

export const riskLabels: Record<TruckRiskLevel, string> = {
  low: 'Normal',
  medium: 'A surveiller',
  high: 'Critique',
}

export const riskClasses: Record<TruckRiskLevel, string> = {
  low: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  medium:
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  high: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
}

export const truckStatusOptions = [
  { label: 'Disponible', value: 'available' },
  { label: 'En livraison', value: 'in_transit' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Inactif', value: 'inactive' },
]

export const contractTierOptions = [
  { label: 'Starter', value: 'Starter' },
  { label: 'Growth', value: 'Growth' },
  { label: 'Enterprise', value: 'Enterprise' },
]

export const trucks: Truck[] = [
  {
    id: 'TRX-CM-001',
    plateNumber: 'CE 2145 AB',
    tenantName: 'Tradex',
    marketer: 'Tradex Douala',
    status: 'available',
    tankCapacityLiters: 22000,
    compartments: 3,
    fuelType: 'GPL',
    makeModel: 'HOWO Sinotruk 6x4',
    year: 2022,
    gpsImei: '356938035643809',
    assignedDriver: 'Nji Gilbert',
    driverPhone: '+237 6 72 14 09 31',
    fleetManager: 'Diane Fotso',
    operatingRegion: 'Littoral',
    homeDepot: 'Depot Bonaberi',
    currentLocation: 'Depot Bonaberi, Douala',
    latitude: 4.0751,
    longitude: 9.6814,
    destination: 'Station Tradex Akwa',
    destinationLatitude: 4.0498,
    destinationLongitude: 9.7679,
    assignedRoute: 'Bonaberi - Akwa',
    odometerKm: 58240,
    nextServiceKm: 61750,
    lastServiceDate: '2026-03-18',
    insuranceExpiry: '2026-11-08',
    technicalVisitExpiry: '2026-09-22',
    permitExpiry: '2026-10-14',
    lastPing: '2026-04-23T10:42:00+01:00',
    contractTier: 'Enterprise',
    riskLevel: 'low',
  },
  {
    id: 'TTC-CM-002',
    plateNumber: 'LT 8870 AD',
    tenantName: 'Total Cameroun',
    marketer: 'Total Yaounde',
    status: 'in_transit',
    tankCapacityLiters: 18000,
    compartments: 2,
    fuelType: 'GPL',
    makeModel: 'Mercedes Actros 1845',
    year: 2021,
    gpsImei: '356938035643810',
    assignedDriver: 'Mbah Armel',
    driverPhone: '+237 6 90 44 18 26',
    fleetManager: 'Patrick Ngono',
    operatingRegion: 'Centre',
    homeDepot: 'Depot Mvan',
    currentLocation: 'Axe Yaounde - Mbalmayo',
    latitude: 3.6828,
    longitude: 11.5156,
    destination: 'Station Total Ebolowa',
    destinationLatitude: 2.9167,
    destinationLongitude: 11.15,
    assignedRoute: 'Yaounde - Ebolowa',
    odometerKm: 74315,
    nextServiceKm: 78000,
    lastServiceDate: '2026-02-25',
    insuranceExpiry: '2026-08-19',
    technicalVisitExpiry: '2026-06-30',
    permitExpiry: '2026-07-01',
    lastPing: '2026-04-23T10:39:00+01:00',
    contractTier: 'Growth',
    riskLevel: 'medium',
  },
  {
    id: 'CEX-CM-003',
    plateNumber: 'CE 5312 BA',
    tenantName: 'Centre Emplisseur Bonaberi',
    marketer: 'Hub Littoral',
    status: 'maintenance',
    tankCapacityLiters: 16000,
    compartments: 2,
    fuelType: 'GPL',
    makeModel: 'Iveco Trakker 410',
    year: 2019,
    gpsImei: '356938035643811',
    assignedDriver: 'Tchana Boris',
    driverPhone: '+237 6 77 01 85 42',
    fleetManager: 'Helene Kamga',
    operatingRegion: 'Littoral',
    homeDepot: 'Atelier Bonaberi',
    currentLocation: 'Atelier Bonaberi',
    latitude: 4.079,
    longitude: 9.6827,
    destination: 'Controle technique',
    destinationLatitude: 4.079,
    destinationLongitude: 9.6827,
    assignedRoute: 'Maintenance atelier',
    odometerKm: 121904,
    nextServiceKm: 122000,
    lastServiceDate: '2026-04-21',
    insuranceExpiry: '2026-05-28',
    technicalVisitExpiry: '2026-05-02',
    permitExpiry: '2026-05-18',
    lastPing: '2026-04-23T09:58:00+01:00',
    contractTier: 'Starter',
    riskLevel: 'high',
  },
  {
    id: 'MKT-CM-004',
    plateNumber: 'NW 4042 AC',
    tenantName: 'Marketer Y',
    marketer: 'Marketer Y Bafoussam',
    status: 'inactive',
    tankCapacityLiters: 12000,
    compartments: 1,
    fuelType: 'GPL',
    makeModel: 'MAN TGS 18.440',
    year: 2018,
    gpsImei: '356938035643812',
    assignedDriver: 'Fongang Junior',
    driverPhone: '+237 6 99 64 74 11',
    fleetManager: 'Nadine Talla',
    operatingRegion: 'Ouest',
    homeDepot: 'Depot Bafoussam',
    currentLocation: 'Depot Bafoussam',
    latitude: 5.4781,
    longitude: 10.4178,
    destination: 'Non affecte',
    destinationLatitude: 5.4781,
    destinationLongitude: 10.4178,
    assignedRoute: 'Standby',
    odometerKm: 134680,
    nextServiceKm: 138500,
    lastServiceDate: '2026-01-17',
    insuranceExpiry: '2026-12-03',
    technicalVisitExpiry: '2026-10-16',
    permitExpiry: '2026-12-03',
    lastPing: '2026-04-22T17:15:00+01:00',
    contractTier: 'Starter',
    riskLevel: 'medium',
  },
  {
    id: 'TRX-CM-005',
    plateNumber: 'CE 7753 AE',
    tenantName: 'Tradex',
    marketer: 'Tradex Kribi',
    status: 'in_transit',
    tankCapacityLiters: 20000,
    compartments: 3,
    fuelType: 'GPL',
    makeModel: 'Renault Trucks C460',
    year: 2023,
    gpsImei: '356938035643813',
    assignedDriver: 'Ekane Samuel',
    driverPhone: '+237 6 96 28 45 33',
    fleetManager: 'Diane Fotso',
    operatingRegion: 'Sud',
    homeDepot: 'Depot Kribi',
    currentLocation: 'Axe Kribi - Edea',
    latitude: 3.6312,
    longitude: 10.0454,
    destination: 'Depot Bonaberi',
    destinationLatitude: 4.0751,
    destinationLongitude: 9.6814,
    assignedRoute: 'Kribi - Douala',
    odometerKm: 31420,
    nextServiceKm: 36000,
    lastServiceDate: '2026-03-29',
    insuranceExpiry: '2027-02-14',
    technicalVisitExpiry: '2026-12-18',
    permitExpiry: '2027-01-09',
    lastPing: '2026-04-23T10:41:00+01:00',
    contractTier: 'Enterprise',
    riskLevel: 'low',
  },
  {
    id: 'TTC-CM-006',
    plateNumber: 'CE 1207 AF',
    tenantName: 'Total Cameroun',
    marketer: 'Total Douala',
    status: 'available',
    tankCapacityLiters: 24000,
    compartments: 4,
    fuelType: 'GPL',
    makeModel: 'Volvo FMX 420',
    year: 2020,
    gpsImei: '356938035643814',
    assignedDriver: 'Ndombe Patrice',
    driverPhone: '+237 6 75 82 18 09',
    fleetManager: 'Patrick Ngono',
    operatingRegion: 'Littoral',
    homeDepot: 'Depot Bassa',
    currentLocation: 'Depot Bassa, Douala',
    latitude: 4.0589,
    longitude: 9.7592,
    destination: 'Station Total Bonamoussadi',
    destinationLatitude: 4.0912,
    destinationLongitude: 9.7411,
    assignedRoute: 'Bassa - Bonamoussadi',
    odometerKm: 90135,
    nextServiceKm: 93500,
    lastServiceDate: '2026-02-11',
    insuranceExpiry: '2026-09-09',
    technicalVisitExpiry: '2026-08-10',
    permitExpiry: '2026-08-21',
    lastPing: '2026-04-23T10:32:00+01:00',
    contractTier: 'Growth',
    riskLevel: 'low',
  },
]

export const trucksTelemetryById: Record<string, TruckTelemetry> = {
  'TRX-CM-001': {
    speedKmh: 100,
    lpgLevelPercent: 72,
    etaText: '1h 08m',
    distanceKm: 72.9,
    routeProgress: 74,
    pressureBar: 11.7,
    temperatureCelsius: 29,
  },
  'TTC-CM-002': {
    speedKmh: 82,
    lpgLevelPercent: 66,
    etaText: '54m',
    distanceKm: 49.4,
    routeProgress: 79,
    pressureBar: 10.8,
    temperatureCelsius: 31,
  },
  'CEX-CM-003': {
    speedKmh: 0,
    lpgLevelPercent: 34,
    etaText: '--',
    distanceKm: 0,
    routeProgress: 0,
    pressureBar: 6.4,
    temperatureCelsius: 26,
  },
  'MKT-CM-004': {
    speedKmh: 0,
    lpgLevelPercent: 19,
    etaText: '--',
    distanceKm: 0,
    routeProgress: 0,
    pressureBar: 5.1,
    temperatureCelsius: 25,
  },
  'TRX-CM-005': {
    speedKmh: 94,
    lpgLevelPercent: 78,
    etaText: '1h 46m',
    distanceKm: 131.2,
    routeProgress: 53,
    pressureBar: 12.1,
    temperatureCelsius: 30,
  },
  'TTC-CM-006': {
    speedKmh: 67,
    lpgLevelPercent: 62,
    etaText: '2h 03m',
    distanceKm: 170.9,
    routeProgress: 35,
    pressureBar: 9.9,
    temperatureCelsius: 28,
  },
}

export const truckTenantOptions = Array.from(
  new Set(trucks.map((truck) => truck.tenantName))
).map((tenantName) => ({ label: tenantName, value: tenantName }))

export const truckMarketerOptions = Array.from(
  new Set(trucks.map((truck) => truck.marketer))
).map((marketer) => ({ label: marketer, value: marketer }))

export function getTruckTelemetry(truckId: string) {
  return (
    trucksTelemetryById[truckId] ?? {
      speedKmh: 0,
      lpgLevelPercent: 0,
      etaText: '--',
      distanceKm: 0,
      routeProgress: 0,
      pressureBar: 0,
      temperatureCelsius: 0,
    }
  )
}
