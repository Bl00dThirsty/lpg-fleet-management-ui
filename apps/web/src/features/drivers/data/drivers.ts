import { delivery_tours, drivers, organizations } from '@lpg/mock-data'
import type {
  Driver,
  Organization,
  TourneeStatus,
} from '@lpg/types'

export type DriverStatus = 'ACTIVE' | 'INACTIVE'

export type DriverView = {
  id: string
  first_name: string
  last_name: string
  full_name: string
  license_number: string
  org_id: string
  org_name: string
  is_active: boolean
  assigned_vehicle_count: number
  active_tour_count: number
  total_tour_count: number
  last_activity: string
}

export const driverStatusLabels: Record<DriverStatus, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
}

export const driverStatusClasses: Record<DriverStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  INACTIVE: 'bg-muted text-muted-foreground',
}

export const driverStatusOptions = [
  { label: 'Actif', value: 'ACTIVE' },
  { label: 'Inactif', value: 'INACTIVE' },
] as const satisfies ReadonlyArray<{
  label: string
  value: DriverStatus
}>

const activeTourStatuses: readonly TourneeStatus[] = [
  'INPROGRESS',
  'CHECKPOINTACTIVE',
]

const orgById = new Map(organizations.map((org) => [org.id, org]))

function orgName(orgId: string): string {
  const org = orgById.get(orgId)
  return org?.name ?? '—'
}

function buildTourAggregates(): ReadonlyMap<
  string,
  { vehicles: Set<string>; active: number; total: number; lastUpdatedAt: string }
> {
  const aggregates = new Map<
    string,
    { vehicles: Set<string>; active: number; total: number; lastUpdatedAt: string }
  >()

  for (const tour of delivery_tours) {
    if (!tour.driver_id) continue

    let entry = aggregates.get(tour.driver_id)
    if (!entry) {
      entry = {
        vehicles: new Set<string>(),
        active: 0,
        total: 0,
        lastUpdatedAt: '',
      }
      aggregates.set(tour.driver_id, entry)
    }

    entry.total += 1
    if (tour.vehicle_id) entry.vehicles.add(tour.vehicle_id)
    if (activeTourStatuses.includes(tour.status)) entry.active += 1

    const updated = tour.updated_at ?? ''
    if (updated && (!entry.lastUpdatedAt || updated > entry.lastUpdatedAt)) {
      entry.lastUpdatedAt = updated
    }
  }

  return aggregates
}

const tourAggregates = buildTourAggregates()

function buildView(driver: Driver): DriverView {
  const aggregates = tourAggregates.get(driver.id)

  return {
    id: driver.id,
    first_name: driver.first_name,
    last_name: driver.last_name,
    full_name: `${driver.first_name} ${driver.last_name}`.trim(),
    license_number: driver.license_number ?? '—',
    org_id: driver.org_id,
    org_name: orgName(driver.org_id),
    is_active: driver.is_active,
    assigned_vehicle_count: aggregates?.vehicles.size ?? 0,
    active_tour_count: aggregates?.active ?? 0,
    total_tour_count: aggregates?.total ?? 0,
    last_activity:
      aggregates?.lastUpdatedAt ??
      driver.updated_at ??
      driver.created_at ??
      '',
  }
}

export function getDriversView(source: Driver[] = drivers as Driver[]): DriverView[] {
  return source.map(buildView)
}

export function getDriverById(id: string): DriverView | undefined {
  return (drivers as Driver[]).map(buildView).find((driver) => driver.id === id)
}

export { drivers, organizations }

export type { Driver, Organization }