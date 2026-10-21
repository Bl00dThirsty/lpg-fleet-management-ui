/** Pure dashboard metrics derived from the device inventory. */
import type { DeviceAttention, DeviceStats } from '@lpg/mock-data'
import type {
  IntegrateurKpis,
  StatusSlice,
  TypeSlice,
} from '../data/integrateur-dashboard'

export function computeIntegrateurKpis(stats: DeviceStats): IntegrateurKpis {
  const offline = stats.byStatus.OFFLINE ?? 0
  return {
    total: stats.total,
    offline,
    inMission: stats.byStatus.INMISSION ?? 0,
  }
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
 * excluded unless the device is also offline.
 */
export function buildAttentionRows(stats: DeviceStats): DeviceAttention[] {
  return stats.attention.filter((d) => d.issue === 'OFFLINE')
}

export function buildTypeSlices(stats: DeviceStats): TypeSlice[] {
  return Object.entries(stats.byType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * The `limit` devices with the most recent `last_sync`, descending. Devices
 * with no sync timestamp sort last (stable). Used by the "Parc des appareils"
 * table so it stays a focused recent-activity view.
 */
export function pickRecentlySynced<T extends { last_sync?: string | null }>(
  devices: readonly T[],
  limit: number
): T[] {
  return [...devices]
    .sort((a, b) => (b.last_sync ?? '').localeCompare(a.last_sync ?? ''))
    .slice(0, limit)
}
