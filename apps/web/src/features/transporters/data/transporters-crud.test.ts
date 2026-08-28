import { describe, expect, it } from 'vitest'
import { transporterFields, transporterFromForm } from './transporters-crud'

describe('transporters-crud config', () => {
  it('requires a name', () => {
    expect(transporterFields.find((f) => f.name === 'name')?.required).toBe(true)
  })
  it('locks org type to TRANSPORTEUR regardless of input', () => {
    const out = transporterFromForm({ name: 'X', type: 'MARKETEUR', is_active: true })
    expect(out.type).toBe('TRANSPORTEUR')
  })
  it('has no type select field', () => {
    expect(transporterFields.find((f) => f.name === 'type')).toBeUndefined()
  })
})
