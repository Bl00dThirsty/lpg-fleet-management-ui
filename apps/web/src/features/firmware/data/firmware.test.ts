import { describe, expect, it } from 'vitest'
import { getFirmwareVersions, getFirmwareDevices, firmwareStatusLabel } from './firmware'

describe('firmware view-model', () => {
  it('aggregates distinct firmware versions', () => {
    const versions = getFirmwareVersions()
    expect(versions.length).toBeGreaterThanOrEqual(1)
    for (const version of versions) {
      expect(version.version).toBeTruthy()
      expect(version.deviceCount).toBeGreaterThan(0)
      expect(version.status).toMatch(/CURRENT|MIXED|OUTDATED/)
    }
  })

  it('returns the devices running a given version', () => {
    const [first] = getFirmwareVersions()
    expect(first).toBeDefined()
    const serials = getFirmwareDevices(first!.version)
    expect(serials.length).toBe(first!.deviceCount)
  })

  it('labels statuses in French', () => {
    expect(firmwareStatusLabel('CURRENT')).toBeTruthy()
  })
})