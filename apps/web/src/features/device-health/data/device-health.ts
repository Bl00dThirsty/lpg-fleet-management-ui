import { deviceStats, getSettingNumber } from '@lpg/mock-data'
import { type DeviceType, type DeviceStatus } from '@lpg/types'

export type { DeviceType, DeviceStatus }

export interface DeviceHealthView {
  id: string
  serial: string
  type: DeviceType
  typeLabel: string
  status: DeviceStatus
  issue: string
  battery: number | null
  lastSync: string | null
}

export const deviceHealthTypeLabels: Record<DeviceType, string> = {
  GPS: 'GPS',
  PDA: 'PDA',
  RFIDREADER: 'Lecteur RFID',
}

export function getDeviceHealth(): DeviceHealthView[] {
  const stats = deviceStats()
  return stats.attention.map((device) => ({
    id: device.id,
    serial: device.serial,
    type: device.type as DeviceType,
    typeLabel: deviceHealthTypeLabels[device.type as DeviceType] ?? device.type,
    status: 'OFFLINE',
    issue: device.issue,
    battery: device.battery,
    lastSync: device.lastSync,
  }))
}

export function getDeviceHealthSummary() {
  const stats = deviceStats()
  const attention = getDeviceHealth()
  const batteryCriticalThreshold =
    getSettingNumber('device.battery_critical_threshold') ?? 15
  const batteryCritical = attention.filter(
    (d) => (d.battery ?? 0) <= batteryCriticalThreshold
  ).length
  return {
    total: stats.total,
    attention: attention.length,
    offline: attention.filter((d) => d.issue === 'OFFLINE').length,
    batteryCritical,
    operational: stats.total - attention.length,
  }
}