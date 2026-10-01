import type {
  Vehicle as CuratedVehicle,
  Organization as CuratedOrganization,
  Driver as CuratedDriver,
  DeliveryTour,
  VehicleType,
  TourneeStatus,
  Region,
  RiskLevel,
} from '@lpg/types'
import { useToursStore } from '@/store/tours-store'
import { useUsersStore } from '@/store/users-store'

export type TruckStatus = TourneeStatus

export interface Truck {
  id: string
  license_plate: string
  type: VehicleType
  tournee_status: TourneeStatus
  max_volume?: number | null
  max_bottle_count?: number | null
  certificate_number?: string
  certificate_expiry_at?: string | null
  org_id: string
  tenant_name: string
  region: Region
  assigned_driver?: string
  requested_quantity: number
  loaded_quantity?: number | null
  delivered_quantity?: number | null
  risk_level: RiskLevel
  current_location?: string
  lat: number
  lng: number
}

export interface TruckTelemetry {
  loaded_quantity?: number
  expected_arrival?: string
  actual_arrival?: string
}

export const statusLabels: Record<TruckStatus, string> = {
  DRAFT: 'Brouillon',
  PLANNED: 'Planifiée',
  PENDINGTRANSPORTERACK: 'Attente transporteur',
  ACKNOWLEDGED: 'Confirmée',
  INPROGRESS: 'En cours',
  CHECKPOINTACTIVE: 'Étape atteinte',
  CLOSED: 'Clôturée',
  CANCELLED: 'Annulée',
}

export const statusClasses: Record<TruckStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PLANNED: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  PENDINGTRANSPORTERACK: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ACKNOWLEDGED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  INPROGRESS: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  CHECKPOINTACTIVE: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  CLOSED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

export const riskLabels: Record<RiskLevel, string> = {
  FAIBLE: 'Faible',
  MODERE: 'Modéré',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique',
  CRITIQUEEXTREME: 'Critique extrême',
}

export const riskClasses: Record<RiskLevel, string> = {
  FAIBLE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  MODERE: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ELEVE: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  CRITIQUE: 'bg-red-500/10 text-red-700 dark:text-red-300',
  CRITIQUEEXTREME: 'bg-red-600/10 text-red-700 dark:text-red-400',
}

const REGIONS: readonly Region[] = [
  'CENTRE', 'LITTORAL', 'NORD', 'EXTREMENORD', 'OUEST',
  'SUDOUEST', 'EST', 'ADAMAOUA',
]

function seededIndex(key: string, modulus: number): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h % modulus
}

function driverName(driver: CuratedDriver | undefined): string | undefined {
  return driver ? `${driver.first_name} ${driver.last_name}` : undefined
}

/**
 * Synchronous accessor — joins raw vehicles + organisations + live stores
 * (drivers via users-store, tours via tours-store) into Truck view rows.
 * Pages must trigger fetches on mount and pass raw rows. The previous
 * curated.* seed has been removed.
 */
export function getTrucks(
  vehicles: CuratedVehicle[] = [],
  orgs: CuratedOrganization[] = [],
): Truck[] {
  const activeOrgs = orgs.filter((o) => o.is_active)
  const drivers = useUsersStore
    .getState()
    .users
    .filter((u) => (u as any).system_role === 'DRIVER') as unknown as CuratedDriver[]
  const tours = useToursStore.getState().tours

  const toursByVehicle = new Map<string, DeliveryTour>()
  for (const tour of tours) {
    if (tour.vehicle_id && !toursByVehicle.has(tour.vehicle_id)) {
      toursByVehicle.set(tour.vehicle_id, tour)
    }
  }

  return vehicles.map((v, idx): Truck => {
    const org = activeOrgs[idx % Math.max(activeOrgs.length, 1)]
    const driver = drivers[Math.min(idx, Math.max(drivers.length - 1, 0))]
    const tour = toursByVehicle.get(v.id)
    const seedIdx = seededIndex(v.license_plate, REGIONS.length)
    const region: Region = REGIONS[seedIdx] ?? 'CENTRE'
    return {
      id: v.id,
      license_plate: v.license_plate,
      type: v.type,
      tournee_status: tour?.status ?? 'PLANNED',
      max_volume: v.max_volume,
      max_bottle_count: v.max_bottle_count,
      certificate_number: v.certificate_number,
      certificate_expiry_at: v.certificate_expiry_at,
      org_id: v.org_id,
      tenant_name: org?.name ?? '—',
      region,
      assigned_driver: driverName(driver),
      requested_quantity: tour?.requested_quantity ?? 0,
      loaded_quantity: tour?.loaded_quantity ?? null,
      delivered_quantity: tour?.delivered_quantity ?? null,
      risk_level: 'FAIBLE',
      current_location: '—',
      lat: 3.4 + ((seededIndex(v.id, 100) * 0.27) % 1.0),
      lng: 10.8 + ((seededIndex(v.id, 100) * 0.41) % 1.4),
    }
  })
}

/** Empty placeholder for sync consumers. Use `getTrucks(...)` instead. */
export const trucks: readonly Truck[] = []

export function getTruckById(id: string): Truck | undefined {
  return trucks.find((t) => t.id === id)
}

export function getTruckTelemetry(truckId: string): TruckTelemetry {
  const tour = useToursStore
    .getState()
    .tours.find((t) => t.id === truckId || (t.vehicle_id && t.vehicle_id.toString() === truckId))
  const checkpoint = useToursStore
    .getState()
    .checkpoints.find((c) => c.tournee_id === tour?.id)
  return {
    loaded_quantity: tour?.loaded_quantity ?? undefined,
    expected_arrival: checkpoint?.expected_arrival ?? undefined,
    actual_arrival: checkpoint?.actual_arrival ?? undefined,
  }
}

export interface SelectOption<T extends string = string> {
  label: string
  value: T
}

export const truckTenantOptions: readonly SelectOption[] = []