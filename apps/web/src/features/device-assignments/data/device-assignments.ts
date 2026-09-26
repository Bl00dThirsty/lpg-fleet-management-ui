import { curated } from '@lpg/mock-data'
import type {
  AppUser,
  Device as CuratedDevice,
  DeviceStatus,
  DeviceType,
  Organization,
  Vehicle,
} from '@lpg/types'
import { makeStatusDisplay } from '@/lib/ui/status-display'

export type { DeviceType, DeviceStatus } from '@lpg/types'

export type AssignedType = 'USER' | 'VEHICLE'

export interface DeviceAssignmentView {
  id: string
  serialNumber: string
  deviceType: DeviceType
  status: DeviceStatus
  assignedType: AssignedType
  assigneeName: string
  assigneeId: string
  orgId: string
  orgName: string
  batteryLevel: number | null
  batteryCritical: boolean
  lastSync: string | null
  firmwareVersion: string
}

export function getDeviceAssignments(): DeviceAssignmentView[] {
  const devices = curated.devices as CuratedDevice[]
  const users = curated.users as AppUser[]
  const vehicles = curated.vehicles as Vehicle[]
  const orgs = curated.organizations as Organization[]

  const userById = new Map(users.map((u) => [u.id, u]))
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]))
  const orgById = new Map(orgs.map((o) => [o.id, o]))

  const assignments: DeviceAssignmentView[] = []

  for (const device of devices) {
    const hasUser = Boolean(device.assigned_to_user_id)
    const hasVehicle = Boolean(device.assigned_to_vehicle_id)
    if (!hasUser && !hasVehicle) continue

    const assignedType: AssignedType = hasUser ? 'USER' : 'VEHICLE'
    const assigneeId = hasUser
      ? (device.assigned_to_user_id ?? '')
      : (device.assigned_to_vehicle_id ?? '')

    const assigneeName =
      assignedType === 'USER'
        ? (() => {
            const user = userById.get(assigneeId)
            return user ? `${user.first_name} ${user.last_name}`.trim() : '—'
          })()
        : (vehicleById.get(assigneeId)?.license_plate ?? '—')

    const orgId = device.org_id ?? ''
    const org = orgById.get(orgId)

    assignments.push({
      id: device.id,
      serialNumber: device.serial_number,
      deviceType: device.device_type,
      status: device.status,
      assignedType,
      assigneeName,
      assigneeId,
      orgId,
      orgName: org?.name ?? '—',
      batteryLevel: device.battery_level,
      batteryCritical: device.battery_critical,
      lastSync: device.last_sync ?? null,
      firmwareVersion: device.firmware_version ?? '—',
    })
  }

  return assignments
}

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  GPS: 'GPS',
  PDA: 'PDA',
  RFIDREADER: 'Lecteur RFID',
}

const DEVICE_TYPE_CLASSES: Record<DeviceType, string> = {
  GPS: 'bg-sky-100 text-sky-800',
  PDA: 'bg-indigo-100 text-indigo-800',
  RFIDREADER: 'bg-violet-100 text-violet-800',
}

/** Single source of truth for the device type UI (AGENTS.md §3). */
export const deviceTypeDisplay = makeStatusDisplay<DeviceType>({
  labels: DEVICE_TYPE_LABELS,
  classes: DEVICE_TYPE_CLASSES,
})

export function deviceTypeLabel(type: DeviceType): string {
  return deviceTypeDisplay.label(type)
}

const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  UNASSIGNED: 'Non assigné',
  ASSIGNED: 'Assigné',
  INMISSION: 'En mission',
  OFFLINE: 'Hors ligne',
  PENDINGSYNC: 'Sync en attente',
  SYNCING: 'Sync en cours',
  SYNCED: 'Synchronisé',
  SYNCFAILED: 'Échec de sync',
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

/** Single source of truth for the device status UI (AGENTS.md §3). */
export const deviceStatusDisplay = makeStatusDisplay<DeviceStatus>({
  labels: DEVICE_STATUS_LABELS,
  classes: DEVICE_STATUS_CLASSES,
})

export function deviceStatusLabel(status: DeviceStatus): string {
  return deviceStatusDisplay.label(status)
}