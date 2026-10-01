import { describe, expect, it } from 'vitest'
import { depotFields, depotFromForm } from './depots-crud'

describe('depots-crud config', () => {
  it('requires a name', () => {
    expect(depotFields.find((f) => f.name === 'name')?.required).toBe(true)
  })
  it('locks org type to DEPOT regardless of input', () => {
    const out = depotFromForm({ name: 'X', type: 'MARKETEUR', is_active: true })
    expect(out.type).toBe('DEPOT')
  })
  it('has no type select field', () => {
    expect(depotFields.find((f) => f.name === 'type')).toBeUndefined()
  })
})
