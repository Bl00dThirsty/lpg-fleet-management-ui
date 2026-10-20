/**
 * Pure logic for the Intégrateur dashboard.
 *
 * The Intégrateur manages the IoT device parc (GPS / PDA / RFID readers):
 * registration, vehicle assignment, installation/closure, position & state,
 * lost/stolen reporting, return to service. Commercial data (tours,
 * quantities, declarations) is out of scope — these builders only consume
 * `deviceStats()` (seeded from `05_devices.json` via `deviceStats`).
 *
 * Battery health is intentionally NOT surfaced: the Intégrateur role does
 * not act on battery levels, so no KPI or attention row derives from it.
 */
import type { DeviceAttention, DeviceStats } from '@lpg/mock-data'

export interface IntegrateurKpis {
  total: number
  operational: number
  offline: number
}

export function computeIntegrateurKpis(stats: DeviceStats): IntegrateurKpis {
  const offline = stats.byStatus.OFFLINE ?? 0
  return {
    total: stats.total,
    offline,
    operational: stats.total - offline,
  }
}

export interface StatusSlice {
  status: string
  count: number
  color: string
}

export const DEVICE_STATUS_COLORS: Record<string, string> = {
  DEPLOYED: '#16a34a',
  INMISSION: '#2563eb',
  SYNCED: '#0ea5e9',
  SYNCING: '#60a5fa',
  PENDINGSYNC: '#94a3b8',
  SYNCFAILED: '#f97316',
  MAINTENANCE: '#d97706',
  OFFLINE: '#dc2626',
  UNASSIGNED: '#cbd5e1',
  ASSIGNED: '#38bdf8',
  REMOVED: '#64748b',
  LOST: '#b91c1c',
}

export function buildStatusSlices(stats: DeviceStats): StatusSlice[] {
  return Object.entries(stats.byStatus)
    .map(([status, count]) => ({
      status,
      count,
      color: DEVICE_STATUS_COLORS[status] ?? '#94a3b8',
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Devices needing attention — OFFLINE only. Battery-critical devices are
 * excluded by design (see module docblock).
 */
export function buildAttentionRows(stats: DeviceStats): DeviceAttention[] {
  return stats.attention.filter((d) => d.issue === 'OFFLINE')
}

export interface TypeSlice {
  type: string
  count: number
}

export function buildTypeSlices(stats: DeviceStats): TypeSlice[] {
  return Object.entries(stats.byType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}
