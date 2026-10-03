import { devices as mockDevices, drivers, organizations, vehicles } from '@lpg/mock-data'
import type {
  Device,
  DeviceStatus,
  DeviceType,
  Organization,
} from '@lpg/types'

export type { Device }

export const devices: readonly Device[] = mockDevices as Device[]

export type DeviceView = {
  id: string
  serial: string
  type: DeviceType
  status: DeviceStatus
  orgName: string
  vehiclePlate?: string
  driverName?: string
  firmware?: string
  batteryLevel: number | null
  batteryCritical: boolean
  batteryStatus: string
  lastSync?: string | null
  position?: [number, number] | null
  config: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  imei?: string
  operator?: string
  simNumber?: string
  model?: string
}

export const deviceTypeLabels: Record<DeviceType, string> = {
  GPS: 'GPS',
  PDA: 'PDA',
  RFIDREADER: 'Lecteur RFID',
}

export const deviceTypeClasses: Record<DeviceType, string> = {
  GPS: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  PDA: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  RFIDREADER: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}

export const deviceStatusLabels: Record<DeviceStatus, string> = {
  UNASSIGNED: 'Non assigné',
  ASSIGNED: 'Assigné',
  INMISSION: 'En mission',
  OFFLINE: 'Hors-ligne',
  PENDINGSYNC: 'Sync en attente',
  SYNCING: 'Synchronisation',
  SYNCED: 'Synchronisé',
  SYNCFAILED: 'Échec sync',
  MAINTENANCE: 'Maintenance',
  DEPLOYED: 'Déployé',
  REMOVED: 'Retiré',
  LOST: 'Perdu',
}

export const deviceStatusClasses: Record<DeviceStatus, string> = {
  UNASSIGNED: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  ASSIGNED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  INMISSION: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  OFFLINE: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  PENDINGSYNC: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  SYNCING: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  SYNCED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  SYNCFAILED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  MAINTENANCE: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  DEPLOYED: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  REMOVED: 'bg-muted text-muted-foreground',
  LOST: 'bg-red-600/10 text-red-700 dark:text-red-400',
}

export const deviceTypeOptions: { label: string; value: DeviceType }[] = [
  { label: 'GPS', value: 'GPS' },
  { label: 'PDA', value: 'PDA' },
  { label: 'Lecteur RFID', value: 'RFIDREADER' },
]

export const deviceStatusOptions: { label: string; value: DeviceStatus }[] = [
  { label: 'Assigné', value: 'ASSIGNED' },
  { label: 'En mission', value: 'INMISSION' },
  { label: 'Hors-ligne', value: 'OFFLINE' },
  { label: 'Synchronisé', value: 'SYNCED' },
  { label: 'Sync en attente', value: 'PENDINGSYNC' },
  { label: 'Échec sync', value: 'SYNCFAILED' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Déployé', value: 'DEPLOYED' },
  { label: 'Non assigné', value: 'UNASSIGNED' },
  { label: 'Retiré', value: 'REMOVED' },
  { label: 'Perdu', value: 'LOST' },
]

const organizationById = new Map(
  organizations.map((org) => [org.id, org] as [string, Organization]),
)
const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]))
const driverById = new Map(
  drivers
    .filter((driver) => driver.user_id)
    .map((driver) => [driver.user_id!, driver] as [string, typeof driver]),
)

function orgName(orgId: string | null | undefined): string {
  if (!orgId) return '—'
  const org = organizationById.get(orgId)
  return org?.name ?? '—'
}

function vehiclePlate(vehicleId: string | null | undefined): string | undefined {
  if (!vehicleId) return undefined
  const vehicle = vehicleById.get(vehicleId)
  return vehicle?.license_plate
}

function driverName(userId: string | null | undefined): string | undefined {
  if (!userId) return undefined
  const driver = driverById.get(userId)
  if (!driver) return undefined
  return `${driver.first_name} ${driver.last_name}`.trim()
}

function batteryStatus(level: number | null, critical: boolean): string {
  if (level == null) return critical ? 'Critique' : '—'
  if (critical) return `${level}% (critique)`
  return `${level}%`
}

function buildView(device: Device): DeviceView {
  const position = device.last_known_position
  const metadata = device.metadata_json ?? null
  const str = (key: string) =>
    metadata && typeof metadata[key] === 'string'
      ? (metadata[key] as string)
      : undefined
  return {
    id: device.id,
    serial: device.serial_number,
    type: device.device_type,
    status: device.status,
    orgName: orgName(device.org_id),
    vehiclePlate: vehiclePlate(device.assigned_to_vehicle_id),
    driverName: driverName(device.assigned_to_user_id),
    firmware: device.firmware_version,
    batteryLevel: device.battery_level,
    batteryCritical: device.battery_critical,
    batteryStatus: batteryStatus(device.battery_level, device.battery_critical),
    lastSync: device.last_sync,
    position,
    config: device.config_json ?? null,
    metadata,
    imei: str('imei'),
    operator: str('operator'),
    simNumber: str('sim_number'),
    model: str('model'),
  }
}

export function getDevicesView(source: Device[] = mockDevices as Device[]): DeviceView[] {
  return source.map(buildView)
}

export function getDeviceById(id: string): DeviceView | undefined {
  return (mockDevices as Device[]).map(buildView).find((view) => view.id === id)
}

export function getAssignmentsCount(): { total: number; assigned: number; unassigned: number } {
  const views = (mockDevices as Device[]).map(buildView)
  const assigned = views.filter(
    (view) => view.vehiclePlate || view.driverName,
  ).length
  return { total: views.length, assigned, unassigned: views.length - assigned }
}