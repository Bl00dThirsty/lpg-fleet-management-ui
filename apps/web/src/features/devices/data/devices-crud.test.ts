import { describe, expect, it } from 'vitest'
import { deviceFields, deviceFromForm } from './devices-crud'

describe('devices-crud config', () => {
  it('requires serial_number and device_type', () => {
    expect(deviceFields.find((f) => f.name === 'serial_number')?.required).toBe(true)
    expect(deviceFields.find((f) => f.name === 'device_type')?.required).toBe(true)
  })
  it('maps device_type, org_id and is_active', () => {
    const out = deviceFromForm({
      serial_number: 'GPS-001',
      device_type: 'GPS',
      status: 'UNASSIGNED',
      org_id: 'org-1',
      battery_level: '80',
      battery_critical: false,
    })
    expect(out.device_type).toBe('GPS')
    expect(out.org_id).toBe('org-1')
    expect(out.battery_level).toBe(80)
    expect(out.battery_critical).toBe(false)
  })
})