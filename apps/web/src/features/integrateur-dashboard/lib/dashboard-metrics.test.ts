import { describe, expect, it, vi } from 'vitest'
import { api } from '@lpg/api-client'
import {
  loadDashboardDevices,
  toIntegrateurDashboardData,
} from '../data/integrateur-dashboard'

vi.mock('@lpg/api-client', () => ({ api: { devices: { list: vi.fn() } } }))
import type { DeviceStats } from '@lpg/mock-data'
import type { Device } from '@lpg/types'
import {
  buildAttentionRows,
  buildStatusSlices,
  buildTypeSlices,
  computeIntegrateurKpis,
  pickRecentlySynced,
} from './dashboard-metrics'

function device(id: string, last_sync?: string): Device {
  return { id, last_sync: last_sync ?? null } as Device
}

const stats: DeviceStats = {
  total: 20,
  byType: { GPS: 7, PDA: 7, RFIDREADER: 6 },
  byStatus: {
    DEPLOYED: 11,
    INMISSION: 5,
    SYNCED: 1,
    PENDINGSYNC: 1,
    OFFLINE: 2,
  },
  attention: [
    {
      id: 'd1',
      serial: 'PDA-TOTAL-002',
      type: 'PDA',
      issue: 'Batterie critique',
      battery: 23,
      lastSync: '2024-11-28T14:00:00Z',
    },
    {
      id: 'd2',
      serial: 'PDA-TOTAL-003',
      type: 'PDA',
      issue: 'Batterie critique',
      battery: 8,
      lastSync: '2024-11-20T10:00:00Z',
    },
    {
      id: 'd3',
      serial: 'RFID-AZA-001',
      type: 'RFIDREADER',
      issue: 'OFFLINE',
      battery: null,
      lastSync: '2024-11-27T14:00:00Z',
    },
  ],
}

describe('computeIntegrateurKpis', () => {
  it('counts devices in mission only', () => {
    expect(computeIntegrateurKpis(stats)).toEqual({
      total: 20,
      offline: 2,
      inMission: 5,
    })
  })

  it('treats a missing OFFLINE status as zero', () => {
    const noOffline: DeviceStats = { ...stats, byStatus: { DEPLOYED: 20 } }
    expect(computeIntegrateurKpis(noOffline)).toEqual({
      total: 20,
      offline: 0,
      inMission: 0,
    })
  })
})

describe('buildStatusSlices', () => {
  it('sorts statuses by descending count', () => {
    expect(buildStatusSlices(stats).map((s) => s.status)).toEqual([
      'DEPLOYED',
      'INMISSION',
      'OFFLINE',
      'SYNCED',
      'PENDINGSYNC',
    ])
  })
})

describe('buildTypeSlices', () => {
  it('sorts types by descending count', () => {
    expect(buildTypeSlices(stats)).toEqual([
      { type: 'GPS', count: 7 },
      { type: 'PDA', count: 7 },
      { type: 'RFIDREADER', count: 6 },
    ])
  })
})

describe('buildAttentionRows', () => {
  it('keeps OFFLINE devices only — battery issues are out of scope', () => {
    const rows = buildAttentionRows(stats)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.serial).toBe('RFID-AZA-001')
  })
})

describe('pickRecentlySynced', () => {
  const devices = [
    device('a', '2024-11-30T08:00:00Z'),
    device('b', '2024-11-28T14:00:00Z'),
    device('c', '2024-11-29T20:00:00Z'),
    device('d'), // never synced -> last
    device('e', '2024-11-30T07:30:00Z'),
    device('f', '2024-11-30T08:00:00Z'),
  ]

  it('returns the N most recently synced devices, descending', () => {
    expect(pickRecentlySynced(devices, 3).map((d) => d.id)).toEqual([
      'a',
      'f',
      'e',
    ])
  })

  it('puts devices without a sync timestamp last', () => {
    const ids = pickRecentlySynced(devices, 6).map((d) => d.id)
    expect(ids).toContain('d')
    expect(ids[ids.length - 1]).toBe('d')
  })

  it('returns everything when limit exceeds the list', () => {
    expect(pickRecentlySynced(devices, 10)).toHaveLength(devices.length)
  })
})

describe('dashboard data consistency', () => {
  it('keeps offline devices with a critical battery and excludes deleted devices everywhere', () => {
    const offline = {
      ...device('offline'),
      device_type: 'GPS',
      status: 'OFFLINE',
      battery_critical: true,
      battery_level: 1,
    } as Device
    const inMission = {
      ...device('mission'),
      device_type: 'PDA',
      status: 'INMISSION',
    } as Device
    const deleted = {
      ...offline,
      id: 'deleted',
      deleted_at: '2026-10-21T00:00:00Z',
    }
    const data = toIntegrateurDashboardData([offline, inMission, deleted])
    expect(data.kpis).toEqual({ total: 2, offline: 1, inMission: 1 })
    expect(data.attention.map((row) => row.id)).toEqual(['offline'])
    expect(data.devices.map((row) => row.id)).toEqual(['offline', 'mission'])
    expect(data.statusSlices.reduce((sum, slice) => sum + slice.count, 0)).toBe(
      2
    )
  })

  it('loads every page instead of reporting only the first page as the total', async () => {
    const list = vi.mocked(api.devices.list)
    list.mockResolvedValueOnce({
      data: [device('first')],
      pagination: { page: 1, limit: 100, total: 2, pages: 2 },
    })
    list.mockResolvedValueOnce({
      data: [device('second')],
      pagination: { page: 2, limit: 100, total: 2, pages: 2 },
    })
    expect((await loadDashboardDevices()).map((row) => row.id)).toEqual([
      'first',
      'second',
    ])
    expect(list).toHaveBeenNthCalledWith(2, { page: 2, limit: 100 })
  })
})
