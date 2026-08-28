import { curated } from '@lpg/mock-data'
import type { Driver } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'

const orgOptions = (curated.organizations as Array<{ id: string; name: string }>).map((o) => ({
  label: o.name,
  value: o.id,
}))

export const driverFields: FieldConfig[] = [
  field.text('first_name', 'Prénom', { required: true }),
  field.text('last_name', 'Nom', { required: true }),
  field.select('org_id', 'Organisation', orgOptions, { required: true }),
  field.text('license_number', 'N° de permis'),
  field.switchField('is_active', 'Chauffeur actif'),
]

export function driverToForm(d: Driver): FormValues {
  return {
    id: d.id,
    first_name: d.first_name ?? '',
    last_name: d.last_name ?? '',
    org_id: d.org_id ?? '',
    license_number: d.license_number ?? '',
    is_active: d.is_active,
  }
}

export function driverFromForm(v: FormValues): Partial<Driver> {
  return {
    first_name: String(v.first_name).trim(),
    last_name: String(v.last_name).trim(),
    org_id: String(v.org_id),
    license_number: v.license_number ? String(v.license_number) : undefined,
    is_active: Boolean(v.is_active),
  }
}