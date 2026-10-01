import { describe, expect, it } from 'vitest'
import { getGpsConfigs, deviceStatusLabel } from './gps-config'

describe('gps-config view-model', () => {
  it('only includes GPS devices', () => {
    const configs = getGpsConfigs()
    expect(configs.length).toBe(7)
    for (const config of configs) {
      expect(config.serialNumber).toMatch(/^GPS-/)
    }
  })

  it('resolves the assigned vehicle plate when present', () => {
    const configs = getGpsConfigs()
    const withVehicle = configs.filter((c) => c.vehiclePlate)
    expect(withVehicle.length).toBeGreaterThan(0)
  })

  it('labels statuses in French', () => {
    expect(deviceStatusLabel('DEPLOYED')).toBe('Déployé')
  })
})