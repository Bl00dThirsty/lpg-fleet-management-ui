import { describe, expect, it } from 'vitest'
import { clientFromForm, clientFields } from './clients-crud'

describe('clients-crud config', () => {
  it('requires an org select field', () => {
    expect(clientFields.find((f) => f.name === 'org_id')?.required).toBe(true)
  })
  it('requires a primary contact name', () => {
    expect(clientFields.find((f) => f.name === 'primary_contact_name')?.required).toBe(true)
  })
  it('maps form values to a Client payload', () => {
    const out = clientFromForm({ org_id: 'org-1', primary_contact_name: 'Ali' })
    expect(out.org_id).toBe('org-1')
    expect(out.primary_contact_name).toBe('Ali')
  })
})
