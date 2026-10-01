import { curated } from '@lpg/mock-data'
import type {
  AppUser,
  Device as CuratedDevice,
  DeviceStatus,
  DeviceType,
  Organization,
  Vehicle,
} from '@lpg/types'

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

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  GPS: 'GPS',
  PDA: 'PDA',
  RFIDREADER: 'Lecteur RFID',
}

export function deviceTypeLabel(type: DeviceType): string {
  return DEVICE_TYPE_LABELS[type]
}

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
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

export function deviceStatusLabel(status: DeviceStatus): string {
  return DEVICE_STATUS_LABELS[status]
}