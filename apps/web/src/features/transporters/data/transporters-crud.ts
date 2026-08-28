import type { Organization } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'

export const transporterFields: FieldConfig[] = [
  field.text('name', 'Nom', { required: true }),
  field.text('registration_number', "N° d'enregistrement"),
  field.text('tax_id', 'N° fiscal'),
  field.switchField('is_active', 'Organisation active'),
]

export function transporterToForm(o: Organization): FormValues {
  return {
    id: o.id,
    name: o.name,
    registration_number: (o as { registration_number?: string }).registration_number ?? '',
    tax_id: (o as { tax_id?: string }).tax_id ?? '',
    is_active: o.is_active,
  }
}

export function transporterFromForm(v: FormValues): Partial<Organization> {
  return {
    name: String(v.name),
    type: 'TRANSPORTEUR',
    registration_number: v.registration_number ? String(v.registration_number) : undefined,
    tax_id: v.tax_id ? String(v.tax_id) : undefined,
    is_active: Boolean(v.is_active),
  }
}
