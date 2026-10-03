import { describe, expect, it } from 'vitest'
import { marketerFields, marketerFromForm } from './marketers-crud'

describe('marketers-crud config', () => {
  it('requires a name', () => {
    expect(marketerFields.find((f) => f.name === 'name')?.required).toBe(true)
  })
  it('locks org type to MARKETEUR regardless of input', () => {
    const out = marketerFromForm({ name: 'X', type: 'TRANSPORTEUR', is_active: true })
    expect(out.type).toBe('MARKETEUR')
  })
  it('has no type select field', () => {
    expect(marketerFields.find((f) => f.name === 'type')).toBeUndefined()
  })
})
