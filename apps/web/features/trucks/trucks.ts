export type TruckStatus =
  | 'available'
  | 'in_transit'
  | 'maintenance'
  | 'inactive'

export type ContractTier = 'Starter' | 'Growth' | 'Enterprise'

export type TruckRiskLevel = 'low' | 'medium' | 'high'

// The operational Truck contract is the shared backend contract in @lpg/types.
export type Truck = import('@lpg/types').Truck

export type TruckTelemetry = {
  speedKmh: number
  lpgLevelPercent: number
  etaText: string
  distanceKm: number
  routeProgress: number
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
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  in_transit:
    'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  maintenance:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  inactive: 'bg-muted text-muted-foreground',
}

export const riskLabels: Record<TruckRiskLevel, string> = {
  low: 'Normal',
  medium: 'A surveiller',
  high: 'Critique',
}

export const riskClasses: Record<TruckRiskLevel, string> = {
  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  medium:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  high: 'bg-red-500/10 text-red-700 dark:text-red-300',
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
    homeDepot: 'Dépôt Bonaberi',
    currentLocation: 'Dépôt Bonaberi, Douala',
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
    homeDepot: 'Dépôt Mvan',
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
    homeDepot: 'Dépôt Bafoussam',
    currentLocation: 'Dépôt Bafoussam',
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
    homeDepot: 'Dépôt Kribi',
    currentLocation: 'Axe Kribi - Edea',
    latitude: 3.6312,
    longitude: 10.0454,
    destination: 'Dépôt Bonaberi',
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
    homeDepot: 'Dépôt Bassa',
    currentLocation: 'Dépôt Bassa, Douala',
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

export const truckTenantOptions = (list: Truck[] = trucks) =>
  Array.from(new Set(list.map((truck) => truck.tenantName))).map(
    (tenantName) => ({ label: tenantName, value: tenantName })
  )

export const truckMarketerOptions = (list: Truck[] = trucks) =>
  Array.from(new Set(list.map((truck) => truck.marketer))).map(
    (marketer) => ({ label: marketer, value: marketer })
  )

/**
 * Telemetry is derived deterministically from the truck id so it works for both
 * the live API dataset and any static fallback without a brittle static map.
 */
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0
  }
  return h
}

export function getTruckTelemetry(truckId: string): TruckTelemetry {
  const h = hashId(truckId)
  const inTransit = h % 5 !== 0
  return {
    speedKmh: inTransit ? 60 + (h % 60) : 0,
    lpgLevelPercent: 20 + (h % 70),
    etaText: inTransit ? `${h % 3}h ${10 + (h % 50)}m` : '--',
    distanceKm: inTransit ? 20 + (h % 160) : 0,
    routeProgress: inTransit ? 10 + (h % 85) : 0,
    temperatureCelsius: 25 + (h % 8),
  }
}
