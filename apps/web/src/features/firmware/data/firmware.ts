import { curated } from '@lpg/mock-data'
import type { Device } from '@lpg/types'

export type FirmwareStatus = 'CURRENT' | 'MIXED'

export interface FirmwareView {
  version: string
  trim: string
  deviceCount: number
  status: FirmwareStatus
}

function mostCommonVersion(devices: Device[]): string | null {
  const counts = new Map<string, number>()
  for (const device of devices) {
    const version = device.firmware_version
    if (!version) continue
    counts.set(version, (counts.get(version) ?? 0) + 1)
  }
  if (counts.size === 0) return null
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]
  return top ? top[0] : null
}

function firmwareTrim(version: string): string {
  const parts = version.split('.')
  if (parts.length !== 3) return version
  return `v${parts[0]}.${parts[1]}.${parts[2]}`
}

export function getFirmwareVersions(): FirmwareView[] {
  const devices = curated.devices as Device[]
  const common = mostCommonVersion(devices)
  const versions = new Set(devices.map((d) => d.firmware_version).filter(Boolean) as string[])
  return Array.from(versions)
    .map((version) => {
      const deviceCount = devices.filter((d) => d.firmware_version === version).length
      const status: FirmwareStatus = version === common ? 'CURRENT' : 'MIXED'
      return {
        version,
        trim: firmwareTrim(version),
        deviceCount,
        status,
      }
    })
    .sort((a, b) => {
      const byCount = b.deviceCount - a.deviceCount
      if (byCount !== 0) return byCount
      return b.version.localeCompare(a.version)
    })
}

export function getFirmwareDevices(version: string): string[] {
  const devices = curated.devices as Device[]
  return devices
    .filter((d) => d.firmware_version === version)
    .map((d) => d.serial_number)
    .sort()
}

export const FIRMWARE_STATUS_LABELS: Record<FirmwareStatus, string> = {
  CURRENT: 'À jour',
  MIXED: 'Mixte',
}

export function firmwareStatusLabel(status: FirmwareStatus): string {
  return FIRMWARE_STATUS_LABELS[status]
}