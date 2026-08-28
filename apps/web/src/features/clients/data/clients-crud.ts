/**
 * CRUD configuration for the `clients` entity.
 *
 * Drives `<EntityForm>` (field list) and the create/edit mapping between the
 * raw schema `Client` and the form value shape. Reads of reference data
 * (organizations for the org select) stay read-only against `curated`.
 */

import { curated } from '@lpg/mock-data'
import type { Client } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'

const orgOptions = (curated.organizations as Array<{ id: string; name: string }>).map((o) => ({
  label: o.name,
  value: o.id,
}))

export const clientFields: FieldConfig[] = [
  field.select('org_id', 'Organisation', orgOptions, { required: true }),
  field.text('primary_contact_name', 'Contact principal', { required: true }),
  field.email('primary_contact_email', 'E-mail du contact'),
  field.text('primary_contact_phone', 'Téléphone du contact'),
  field.textarea('billing_address', 'Adresse de facturation'),
  field.number('credit_limit', 'Limite de crédit', { min: 0 }),
  field.text('tax_id', 'N° fiscal'),
  field.text('industry_sector', 'Secteur d’activité'),
  field.switchField('is_active', 'Client actif'),
]

export function clientToForm(c: Client): FormValues {
  return {
    id: c.id,
    org_id: c.org_id,
    primary_contact_name: c.primary_contact_name ?? '',
    primary_contact_email: c.primary_contact_email ?? '',
    primary_contact_phone: c.primary_contact_phone ?? '',
    billing_address: c.billing_address ?? '',
    credit_limit: c.credit_limit ?? '',
    tax_id: c.tax_id ?? '',
    industry_sector: c.industry_sector ?? '',
    is_active: c.is_active,
  }
}

export function clientFromForm(v: FormValues): Partial<Client> {
  return {
    org_id: String(v.org_id),
    primary_contact_name: v.primary_contact_name ? String(v.primary_contact_name) : undefined,
    primary_contact_email: v.primary_contact_email ? String(v.primary_contact_email) : undefined,
    primary_contact_phone: v.primary_contact_phone ? String(v.primary_contact_phone) : undefined,
    billing_address: v.billing_address ? String(v.billing_address) : undefined,
    credit_limit: v.credit_limit == null ? null : Number(v.credit_limit),
    tax_id: v.tax_id ? String(v.tax_id) : undefined,
    industry_sector: v.industry_sector ? String(v.industry_sector) : undefined,
    is_active: Boolean(v.is_active),
  }
}
