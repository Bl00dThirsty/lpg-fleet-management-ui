import { curated } from '@lpg/mock-data'

export type MaintenanceItemType = 'DEVICE' | 'VEHICLE'

export type MaintenanceStatus = 'CRITIQUE' | 'AOA' | 'RESOLU'

export interface MaintenanceView {
  id: string
  itemType: MaintenanceItemType
  itemName: string
  status: MaintenanceStatus
  reason: string
  balLevel?: number
  lastSync?: string
  orgName: string
  updatedAt: string
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  CRITIQUE: 'Critique',
  AOA: 'À traiter',
  RESOLU: 'Résolu',
}

export function maintenanceStatusLabel(status: MaintenanceStatus): string {
  return MAINTENANCE_STATUS_LABELS[status]
}

export const ITEM_TYPE_LABELS: Record<MaintenanceItemType, string> = {
  DEVICE: 'Appareil',
  VEHICLE: 'Véhicule',
}

export function itemTypeLabel(type: MaintenanceItemType): string {
  return ITEM_TYPE_LABELS[type]
}

const orgNameById: Record<string, string> = Object.fromEntries(
  curated.organizations.map((org) => [org.id, org.name]),
)

export function getMaintenanceItems(): MaintenanceView[] {
  const now = Date.now()

  const devices: MaintenanceView[] = curated.devices
    .filter(
      (device) =>
        device.status === 'MAINTENANCE' ||
        device.battery_critical ||
        (device.battery_level !== null && device.battery_level <= 25) ||
        device.status === 'OFFLINE',
    )
    .map((device) => {
      const critical =
        device.battery_critical ||
        (device.battery_level !== null && device.battery_level <= 25)
      const reason = critical
        ? 'Batterie critique'
        : device.status === 'OFFLINE'
          ? 'Hors ligne'
          : 'En maintenance'
      return {
        id: device.id,
        itemType: 'DEVICE' as const,
        itemName: device.serial_number,
        status: (critical ? 'CRITIQUE' : 'AOA') as MaintenanceStatus,
        reason,
        balLevel: device.battery_level ?? undefined,
        lastSync: device.last_sync ?? undefined,
        orgName: device.org_id ? orgNameById[device.org_id] ?? '—' : '—',
        updatedAt: device.last_sync ?? '2026-01-01',
      }
    })

  const vehicles: MaintenanceView[] = curated.vehicles
    .filter(
      (vehicle) =>
        !!vehicle.certificate_expiry_at &&
        new Date(vehicle.certificate_expiry_at).getTime() < now,
    )
    .map((vehicle) => ({
      id: vehicle.id,
      itemType: 'VEHICLE' as const,
      itemName: vehicle.license_plate,
      status: 'AOA' as MaintenanceStatus,
      reason: 'Certificat expiré',
      orgName: orgNameById[vehicle.org_id] ?? '—',
      updatedAt: vehicle.certificate_expiry_at ?? vehicle.updated_at ?? '2026-01-01',
    }))

  return [...devices, ...vehicles].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )
}