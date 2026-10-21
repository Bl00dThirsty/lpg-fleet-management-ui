import { api } from '@lpg/api-client'
import type { Device } from '@lpg/types'
import type { DeviceStats } from '@lpg/mock-data'
import {
  buildAttentionRows,
  buildStatusSlices,
  buildTypeSlices,
  computeIntegrateurKpis,
} from '../lib/dashboard-metrics'

export interface IntegrateurKpis {
  total: number
  inMission: number
  offline: number
}

export interface StatusSlice {
  status: string
  count: number
  color: string
}

export interface TypeSlice {
  type: string
  count: number
}

export interface IntegrateurDashboardData {
  devices: Device[]
  kpis: IntegrateurKpis
  statusSlices: StatusSlice[]
  typeSlices: TypeSlice[]
  attention: ReturnType<typeof buildAttentionRows>
}

/** Load all pages so indicators and tables describe the same collection. */
export async function loadDashboardDevices(): Promise<Device[]> {
  const devices: Device[] = []
  let page = 1
  let pages: number
  do {
    const result = await api.devices.list({ page, limit: 100 })
    devices.push(...result.data)
    pages = result.pagination.pages
    page += 1
  } while (page <= pages)
  return devices
}

export function toIntegrateurDashboardData(
  source: readonly Device[]
): IntegrateurDashboardData {
  const devices = source.filter((device) => !device.deleted_at)
  const stats: DeviceStats = {
    total: devices.length,
    byType: {},
    byStatus: {},
    attention: [],
  }
  for (const device of devices) {
    stats.byType[device.device_type] =
      (stats.byType[device.device_type] ?? 0) + 1
    stats.byStatus[device.status] = (stats.byStatus[device.status] ?? 0) + 1
    if (device.status === 'OFFLINE') {
      stats.attention.push({
        id: device.id,
        serial: device.serial_number,
        type: device.device_type,
        issue: 'OFFLINE',
        battery: device.battery_level,
        lastSync: device.last_sync ?? null,
      })
    }
  }
  return {
    devices,
    kpis: computeIntegrateurKpis(stats),
    statusSlices: buildStatusSlices(stats),
    typeSlices: buildTypeSlices(stats),
    attention: buildAttentionRows(stats),
  }
}
