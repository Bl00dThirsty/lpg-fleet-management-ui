import { describe, expect, it } from 'vitest'
import { field, type FieldConfig } from './field-config'
import { zodSchemaFromFields } from './field-schema'

const contactFields: FieldConfig[] = [
  field.text('name', 'Nom', { required: true }),
  field.email('email', 'Email'),
  field.url('website', 'Site web'),
  field.number('count', 'Quantité'),
  field.select(
    'status',
    'Statut',
    [
      { label: 'Actif', value: 'ACTIVE' },
      { label: 'Inactif', value: 'INACTIVE' },
    ],
    { required: true },
  ),
  field.switchField('enabled', 'Activé'),
  field.checklist(
    'tags',
    'Étiquettes',
    [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ],
    { required: true },
  ),
]

describe('zodSchemaFromFields', () => {
  it('builds a schema that validates a valid payload and coerces numbers', () => {
    const schema = zodSchemaFromFields(contactFields)
    const result = schema.safeParse({
      name: 'Acme',
      email: 'a@b.co',
      website: 'https://acme.example',
      count: '3',
      status: 'ACTIVE',
      enabled: true,
      tags: ['a'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.count).toBe(3)
      expect(result.data.tags).toEqual(['a'])
    }
  })

  it('rejects an invalid payload', () => {
    const schema = zodSchemaFromFields(contactFields)
    const result = schema.safeParse({
      name: '',
      email: 'nope',
      website: 'not-a-url',
      count: 'abc',
      status: '',
      enabled: true,
      tags: [],
    })
    expect(result.success).toBe(false)
  })

  it('requires a non-empty string for required text', () => {
    const schema = zodSchemaFromFields([field.text('name', 'Nom', { required: true })])
    expect(schema.safeParse({ name: '' }).success).toBe(false)
    expect(schema.safeParse({ name: 'A' }).success).toBe(true)
  })

  it('requires a selection for required select', () => {
    const schema = zodSchemaFromFields([
      field.select('status', 'Statut', [{ label: 'Actif', value: 'ACTIVE' }], { required: true }),
    ])
    expect(schema.safeParse({ status: '' }).success).toBe(false)
    expect(schema.safeParse({ status: 'ACTIVE' }).success).toBe(true)
  })

  it('validates checklist as an array of strings', () => {
    const schema = zodSchemaFromFields([
      field.checklist('tags', 'Tags', [{ label: 'A', value: 'a' }], { required: true }),
    ])
    expect(schema.safeParse({ tags: [] }).success).toBe(false)
    expect(schema.safeParse({ tags: ['a'] }).success).toBe(true)
  })

  it('validates switch as a boolean', () => {
    const schema = zodSchemaFromFields([field.switchField('enabled', 'Activé', { required: true })])
    expect(schema.safeParse({ enabled: true }).success).toBe(true)
    expect(schema.safeParse({ enabled: 'yes' }).success).toBe(false)
  })

  it('coerces numbers from strings but rejects non-numeric values', () => {
    const schema = zodSchemaFromFields([field.number('count', 'Quantité', { required: true })])
    expect(schema.safeParse({ count: '3' }).success).toBe(true)
    expect(schema.safeParse({ count: 'abc' }).success).toBe(false)
  })

  it('rejects empty required numbers and accepts empty optional numbers', () => {
    const required = zodSchemaFromFields([field.number('qty', 'Quantité', { required: true })])
    const optional = zodSchemaFromFields([field.number('qty', 'Quantité')])
    expect(required.safeParse({ qty: '' }).success).toBe(false)
    expect(optional.safeParse({ qty: '' }).success).toBe(true)
  })

  it('accepts an empty string for an optional email but rejects malformed addresses', () => {
    const schema = zodSchemaFromFields([field.email('email', 'Email')])
    expect(schema.safeParse({ email: '' }).success).toBe(true)
    expect(schema.safeParse({ email: 'nope' }).success).toBe(false)
    expect(schema.safeParse({ email: 'a@b.co' }).success).toBe(true)
  })

  it('accepts an empty string for an optional url but rejects malformed urls', () => {
    const schema = zodSchemaFromFields([field.url('website', 'Site web')])
    expect(schema.safeParse({ website: '' }).success).toBe(true)
    expect(schema.safeParse({ website: 'nope' }).success).toBe(false)
    expect(schema.safeParse({ website: 'https://acme.example' }).success).toBe(true)
  })
})

describe('schema constraint options', () => {
  it('enforces number min/max/positive', () => {
    const schema = zodSchemaFromFields([
      field.number('battery', 'Batterie', { min: 0, max: 100 }),
      field.number('qty', 'Quantité', { positive: true, required: true }),
    ])
    expect(schema.safeParse({ battery: 101, qty: 5 }).success).toBe(false)
    expect(schema.safeParse({ battery: 50, qty: 0 }).success).toBe(false)
    expect(schema.safeParse({ battery: 50, qty: 1 }).success).toBe(true)
    expect(schema.safeParse({ battery: -1, qty: 2 }).success).toBe(false)
  })

  it('enforces text pattern with a custom message', () => {
    const schema = zodSchemaFromFields([
      field.text('plate', 'Plaque', { pattern: '^[A-Z0-9-]+$', patternMessage: 'Format de plaque invalide' }),
    ])
    expect(schema.safeParse({ plate: 'abc' }).success).toBe(false)
    expect(schema.safeParse({ plate: 'LT-1234-UB' }).success).toBe(true)
  })

  it('enforces minDate/maxDate on date fields', () => {
    const schema = zodSchemaFromFields([
      field.date('start', 'Début', { minDate: '2026-01-01' }),
      field.date('end', 'Fin', { maxDate: '2026-12-31' }),
    ])
    expect(schema.safeParse({ start: '2025-12-31', end: '2026-01-01' }).success).toBe(false)
    expect(schema.safeParse({ start: '2026-02-01', end: '2027-01-01' }).success).toBe(false)
    expect(schema.safeParse({ start: '2026-02-01', end: '2026-06-01' }).success).toBe(true)
  })

  it('rejects a select value outside its options', () => {
    const schema = zodSchemaFromFields([
      field.select('status', 'Statut', [{ label: 'A', value: 'ACTIVE' }]),
    ])
    expect(schema.safeParse({ status: 'BOGUS' }).success).toBe(false)
    expect(schema.safeParse({ status: 'ACTIVE' }).success).toBe(true)
  })

  it('accepts an empty string for an optional file and requires it when required', () => {
    const optional = zodSchemaFromFields([field.file('proof', 'Preuve')])
    expect(optional.safeParse({ proof: '' }).success).toBe(true)
    const required = zodSchemaFromFields([field.file('proof', 'Preuve', { required: true })])
    expect(required.safeParse({ proof: '' }).success).toBe(false)
    expect(required.safeParse({ proof: 'data:application/pdf;base64,AAAA' }).success).toBe(true)
  })
})
