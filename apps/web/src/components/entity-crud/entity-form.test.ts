import { describe, expect, it } from 'vitest'
import { field } from './field-config'
import { applyTransforms } from './entity-form'

describe('applyTransforms', () => {
  it('applies per-field transforms to raw values', () => {
    const fields = [field.text('name', 'Nom'), field.number('count', 'Quantité'), field.switchField('active', 'Actif')]
    const out = applyTransforms(fields, { name: 'Acme', count: '3', active: true }, false)
    expect(out).toEqual({ name: 'Acme', count: 3, active: true })
  })

  it('maps an empty number to null via its transform', () => {
    const fields = [field.number('count', 'Quantité')]
    expect(applyTransforms(fields, { count: '' }, false)).toEqual({ count: null })
    expect(applyTransforms(fields, { count: undefined }, false)).toEqual({ count: null })
  })

  it('merges the entity id in edit mode', () => {
    const fields = [field.text('name', 'Nom')]
    const out = applyTransforms(fields, { name: 'Acme' }, true, { id: 'ent-1', name: 'Old' })
    expect(out).toEqual({ name: 'Acme', id: 'ent-1' })
  })

  it('does not add an id in create mode', () => {
    const fields = [field.text('name', 'Nom')]
    expect(applyTransforms(fields, { name: 'Acme' }, false)).toEqual({ name: 'Acme' })
  })

  it('passes through raw values without a transform', () => {
    const fields = [field.textarea('notes', 'Notes')]
    expect(applyTransforms(fields, { notes: 'bonjour' }, false)).toEqual({ notes: 'bonjour' })
  })
})
