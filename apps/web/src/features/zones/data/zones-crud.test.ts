import { describe, expect, it } from 'vitest'
import { zoneFields, zoneFromForm, zoneToForm } from './zones-crud'

describe('zones CRUD configuration', () => {
  it('submits only the editable name and code fields', () => {
    expect(zoneFromForm({ name: 'Nouvelle zone', code: 'NORD' })).toEqual({
      name: 'Nouvelle zone',
      code: 'NORD',
    })
  })

  it('round-trips region values into the form shape', () => {
    expect(zoneToForm({ id: 'region-1', name: 'Centre', code: 'CENTRE' })).toEqual({
      id: 'region-1',
      name: 'Centre',
      code: 'CENTRE',
    })
  })

  it('declares required name and code fields', () => {
    expect(zoneFields.map((field) => [field.name, field.required])).toEqual([
      ['name', true],
      ['code', true],
    ])
  })
})
