import { describe, expect, it } from 'vitest'
import { getMaintenanceItems, maintenanceStatusLabel, itemTypeLabel } from './maintenance'

describe('maintenance view-model', () => {
  it('derives device and vehicle maintenance entries', () => {
    const items = getMaintenanceItems()
    expect(items.length).toBeGreaterThan(3)
    const types = new Set(items.map((i) => i.itemType))
    expect(types).toContain('DEVICE')
    expect(types).toContain('VEHICLE')
  })

  it('surfaces a reason and org for every entry', () => {
    for (const item of getMaintenanceItems()) {
      expect(item.reason).toBeTruthy()
      expect(item.orgName).toBeTruthy()
    }
  })

  it('labels statuses and types in French', () => {
    expect(maintenanceStatusLabel('CRITIQUE')).toBe('Critique')
    expect(itemTypeLabel('DEVICE')).toBe('Appareil')
  })
})