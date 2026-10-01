import {
  delivery_tours,
  drivers,
  organizations,
  risk_scores,
  vehicles,
} from '@lpg/mock-data'
import type {
  DeliveryTour,
  Driver,
  OrgType,
  Region,
  RiskLevel,
  TourneeStatus,
  Vehicle as CuratedVehicle,
  VehicleType,
} from '@lpg/types'

export type VehicleStatus = TourneeStatus | 'AVAILABLE'

export interface VehicleView {
  id: string
  license_plate: string
  type: VehicleType
  org_id: string
  created_by?: string | null
  tenant_name: string
  tenant_type: OrgType
  region: Region
  max_volume?: number | null
  max_bottle_count?: number | null
  tare_weight?: number | null
  certificate_number?: string
  certificate_expiry_at?: string | null
  certificate_status: CertificateStatus
  is_active: boolean
  assigned_driver?: string
  status: VehicleStatus
  requested_quantity: number
  loaded_quantity?: number | null
  delivered_quantity?: number | null
  risk_level: RiskLevel
  lat: number
  lng: number
}

export type CertificateStatus =
  | 'valid'
  | 'expiring-soon'
  | 'expired'
  | 'missing'
  | 'not-required'

export const certificateStatusLabels: Record<CertificateStatus, string> = {
  valid: 'Certificat valide',
  'expiring-soon': 'Certificat expire bientot',
  expired: 'Certificat expire',
  missing: 'Certificat manquant',
  'not-required': 'Certificat non requis',
}

export const certificateStatusClasses: Record<CertificateStatus, string> = {
  valid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'expiring-soon': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  expired: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  missing: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'not-required': 'bg-muted text-muted-foreground',
}

export function certificateStatus(
  vehicleType: VehicleType,
  certificateNumber: string | undefined,
  certificateExpiryAt: string | null | undefined,
  now: Date = new Date(),
): CertificateStatus {
  if (vehicleType !== 'VRAC') return 'not-required'
  if (!certificateNumber || !certificateExpiryAt) return 'missing'
  const expiry = new Date(certificateExpiryAt)
  if (Number.isNaN(expiry.getTime())) return 'missing'
  const daysUntilExpiry = (expiry.getTime() - now.getTime()) / 86_400_000
  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry < 30) return 'expiring-soon'
  return 'valid'
}

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  DRAFT: 'Brouillon',
  PLANNED: 'Planifiee',
  PENDINGTRANSPORTERACK: 'Attente transporteur',
  ACKNOWLEDGED: 'Confirmee',
  INPROGRESS: 'En cours',
  CHECKPOINTACTIVE: 'Etape atteinte',
  CLOSED: 'Cloturee',
  CANCELLED: 'Annulee',
  AVAILABLE: 'Disponible',
}

export const vehicleStatusClasses: Record<VehicleStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PLANNED: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  AVAILABLE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PENDINGTRANSPORTERACK: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ACKNOWLEDGED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  INPROGRESS: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  CHECKPOINTACTIVE: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  CLOSED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

export const vehicleTypeLabels: Record<VehicleType, string> = {
  VRAC: 'Vrac (TM)',
  BOUTEILLES50KG: 'Bouteilles 50 kg',
}

export const vehicleRiskLabels: Record<RiskLevel, string> = {
  FAIBLE: 'Faible',
  MODERE: 'Modere',
  ELEVE: 'Eleve',
  CRITIQUE: 'Critique',
  CRITIQUEEXTREME: 'Critique extreme',
}

export const vehicleRiskClasses: Record<RiskLevel, string> = {
  FAIBLE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  MODERE: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ELEVE: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  CRITIQUE: 'bg-red-500/10 text-red-700 dark:text-red-300',
  CRITIQUEEXTREME: 'bg-red-600/10 text-red-700 dark:text-red-400',
}

const PLATE_REGION: Record<string, Region> = {
  AD: 'ADAMAOUA',
  CE: 'CENTRE',
  ES: 'EST',
  EN: 'EXTREMENORD',
  LT: 'LITTORAL',
  NO: 'NORD',
  NW: 'NORDOUEST',
  OU: 'OUEST',
  SU: 'SUD',
  SW: 'SUDOUEST',
}

const orgById = new Map(organizations.map((org) => [org.id, org]))
const driverById = new Map(drivers.map((driver) => [driver.id, driver]))

function regionFromPlate(plate: string): Region {
  return PLATE_REGION[plate.slice(0, 2).toUpperCase()] ?? 'CENTRE'
}

function driverName(driver: Driver | undefined): string | undefined {
  return driver
    ? `${driver.first_name} ${driver.last_name}`.trim()
    : undefined
}

function latestTourFor(vehicleId: string): DeliveryTour | undefined {
  const matches = delivery_tours.filter(
    (tour) => tour.vehicle_id === vehicleId && !tour.deleted_at,
  )
  if (matches.length === 0) return undefined
  const sorted = [...matches].sort((a, b) =>
    (b.updated_at ?? b.created_at ?? '').localeCompare(
      a.updated_at ?? a.created_at ?? '',
    ),
  )
  return sorted[0]
}

function assignedDriverFor(
  vehicle: CuratedVehicle,
  tour: DeliveryTour | undefined,
): string {
  const tourDriverId = tour?.driver_id
  if (tourDriverId) {
    const driver = driverById.get(tourDriverId)
    const name = driverName(driver)
    if (name) return name
  }
  const orgDriver = drivers.find(
    (driver) => driver.org_id === vehicle.org_id && driver.is_active,
  )
  return driverName(orgDriver) ?? '—'
}

function riskLevelFor(vehicleId: string, fallback: RiskLevel): RiskLevel {
  const row = risk_scores.find(
    (entry) => entry.entity_type === 'VEHICLE' && entry.entity_id === vehicleId,
  )
  return row?.level ?? fallback
}

function seededIndex(key: string, modulus: number): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return hash % modulus
}

function buildView(vehicle: CuratedVehicle): VehicleView {
  const tour = latestTourFor(vehicle.id)
  const org = orgById.get(vehicle.org_id)
  const region = regionFromPlate(vehicle.license_plate)
  const status: VehicleStatus = tour?.status ?? 'AVAILABLE'

  return {
    id: vehicle.id,
    license_plate: vehicle.license_plate,
    type: vehicle.type,
    org_id: vehicle.org_id,
    created_by: vehicle.created_by ?? null,
    tenant_name: org?.name ?? '—',
    tenant_type: org?.type ?? 'TRANSPORTEUR',
    region,
    certificate_number: vehicle.certificate_number,
    certificate_expiry_at: vehicle.certificate_expiry_at,
    certificate_status: certificateStatus(
      vehicle.type,
      vehicle.certificate_number,
      vehicle.certificate_expiry_at,
    ),
    max_volume: vehicle.max_volume,
    max_bottle_count: vehicle.max_bottle_count,
    tare_weight: vehicle.tare_weight,
    is_active: vehicle.is_active,
    assigned_driver: assignedDriverFor(vehicle, tour),
    status,
    requested_quantity: tour?.requested_quantity ?? 0,
    loaded_quantity: tour?.loaded_quantity ?? null,
    delivered_quantity: tour?.delivered_quantity ?? null,
    risk_level: riskLevelFor(vehicle.id, 'FAIBLE'),
    lat: 3.4 + ((seededIndex(vehicle.id, 100) * 0.31) % 1.0),
    lng: 10.7 + ((seededIndex(vehicle.id, 100) * 0.47) % 1.5),
  }
}

export function getVehiclesView(source: CuratedVehicle[] = vehicles as CuratedVehicle[]): VehicleView[] {
  return source.map(buildView)
}

export const fleetVehicles: readonly VehicleView[] = getVehiclesView()

export function getVehicleById(id: string): VehicleView | undefined {
  return fleetVehicles.find((vehicle) => vehicle.id === id)
}

export function getTenantOptions(): { label: string; value: string }[] {
  const set = new Set<string>()
  for (const vehicle of fleetVehicles) {
    if (vehicle.tenant_name) set.add(vehicle.tenant_name)
  }
  return Array.from(set, (tenant_name) => ({ label: tenant_name, value: tenant_name }))
}

export function getRegionOptions(): { label: string; value: Region }[] {
  const seen = new Set<string>()
  const options: { label: string; value: Region }[] = []
  for (const vehicle of fleetVehicles) {
    if (!seen.has(vehicle.region)) {
      seen.add(vehicle.region)
      options.push({ label: vehicle.region, value: vehicle.region })
    }
  }
  return options
}

export function getTypeOptions(): { label: string; value: VehicleType }[] {
  return (Object.keys(vehicleTypeLabels) as VehicleType[]).map((type) => ({
    label: vehicleTypeLabels[type],
    value: type,
  }))
}

export function tenantLabel(type: OrgType): string {
  const labels: Record<OrgType, string> = {
    REGULATEUR: 'Regulateur',
    DEPOT: 'Depot',
    MARKETEUR: 'Marketeur',
    TRANSPORTEUR: 'Transporteur',
    CLIENT: 'Client',
  }
  return labels[type]
}