import { describe, expect, it } from 'vitest'
import { vehicleFields, vehicleFromForm } from './vehicles-crud'

describe('vehicles-crud config', () => {
  it('requires license plate and type', () => {
    expect(vehicleFields.find((f) => f.name === 'license_plate')?.required).toBe(true)
    expect(vehicleFields.find((f) => f.name === 'type')?.required).toBe(true)
  })
  it('maps capacity by type (VRAC max_volume TM / BOUTEILLES50KG max_bottle_count)', () => {
    const vrac = vehicleFromForm({ license_plate: 'LT-123', type: 'VRAC', max_volume: '20', is_active: true })
    expect(vrac.max_volume).toBe(20)
    expect(vrac.max_bottle_count).toBeNull()
  })
  it('maps VRAC capacity in TM (never liters)', () => {
    const out = vehicleFromForm({ license_plate: 'LT-123', type: 'VRAC', max_volume: '20', is_active: true })
    expect(out.max_volume).toBe(20)
  })
})