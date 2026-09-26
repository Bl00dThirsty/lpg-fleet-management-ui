import { curated } from '@lpg/mock-data'
import type {
  DeviceStatus,
  Device as CuratedDevice,
  Vehicle as CuratedVehicle,
  Organization as CuratedOrganization,
} from '@lpg/types'
import { makeStatusDisplay } from '@/lib/ui/status-display'

export interface GpsConfigView {
  id: string
  serialNumber: string
  status: DeviceStatus
  firmwareVersion: string
  updateIntervalSec: number | null
  alertSpeedKmh: number | null
  geofenceRadiusM: number | null
  imei: string | null
  operator: string | null
  model: string | null
  vehiclePlate: string
  orgId: string
  orgName: string
  lastSync: string
}

const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  UNASSIGNED: 'Non assigné',
  ASSIGNED: 'Assigné',
  INMISSION: 'En mission',
  OFFLINE: 'Hors ligne',
  PENDINGSYNC: 'Sync en attente',
  SYNCING: 'Synchro en cours',
  SYNCED: 'Synchronisé',
  SYNCFAILED: 'Échec synchro',
  MAINTENANCE: 'Maintenance',
  DEPLOYED: 'Déployé',
  REMOVED: 'Retiré',
  LOST: 'Perdu',
}

const DEVICE_STATUS_CLASSES: Record<DeviceStatus, string> = {
  UNASSIGNED: 'bg-slate-100 text-slate-700',
  ASSIGNED: 'bg-sky-100 text-sky-800',
  INMISSION: 'bg-indigo-100 text-indigo-800',
  OFFLINE: 'bg-rose-100 text-rose-800',
  PENDINGSYNC: 'bg-amber-100 text-amber-800',
  SYNCING: 'bg-amber-100 text-amber-800',
  SYNCED: 'bg-emerald-100 text-emerald-800',
  SYNCFAILED: 'bg-rose-100 text-rose-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  DEPLOYED: 'bg-emerald-100 text-emerald-800',
  REMOVED: 'bg-slate-200 text-slate-700',
  LOST: 'bg-rose-200 text-rose-900',
}

/** Single source of truth for the device status UI in this feature (AGENTS.md §3). */
export const gpsDeviceStatusDisplay = makeStatusDisplay<DeviceStatus>({
  labels: DEVICE_STATUS_LABELS,
  classes: DEVICE_STATUS_CLASSES,
})

export function deviceStatusLabel(status: DeviceStatus): string {
  return gpsDeviceStatusDisplay.label(status)
}

type GpsConfigJson = {
  update_interval_sec?: number
  alert_speed_kmh?: number
  geofence_radius_m?: number
}

type GpsMetadata = {
  imei?: string
  operator?: string
  model?: string
}

function num(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function getGpsConfigs(): GpsConfigView[] {
  const devices = curated.devices as CuratedDevice[]
  const vehicles = curated.vehicles as CuratedVehicle[]
  const orgs = curated.organizations as CuratedOrganization[]

  return devices
    .filter((d) => d.device_type === 'GPS')
    .map((device) => {
      const config = (device.config_json ?? {}) as GpsConfigJson
      const metadata = (device.metadata_json ?? {}) as GpsMetadata
      const vehicle = vehicles.find((v) => v.id === device.assigned_to_vehicle_id)
      const org = orgs.find((o) => o.id === device.org_id)

      return {
        id: device.id,
        serialNumber: device.serial_number,
        status: device.status,
        firmwareVersion: str(device.firmware_version) ?? '—',
        updateIntervalSec: num(config.update_interval_sec) ?? null,
        alertSpeedKmh: num(config.alert_speed_kmh) ?? null,
        geofenceRadiusM: num(config.geofence_radius_m) ?? null,
        imei: str(metadata.imei),
        operator: str(metadata.operator),
        model: str(metadata.model),
        vehiclePlate: vehicle?.license_plate ?? '—',
        orgId: device.org_id ?? '—',
        orgName: org?.name ?? '—',
        lastSync: device.last_sync ?? '—',
      }
    })
}

export function displayNumber(value: number | null): string {
  return value === null ? '—' : `${value}`
}