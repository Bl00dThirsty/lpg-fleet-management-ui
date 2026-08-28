import { curated } from '@lpg/mock-data'
import type { Vehicle, VehicleType } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'

const orgOptions = (curated.organizations as Array<{ id: string; name: string }>).map((o) => ({
  label: o.name,
  value: o.id,
}))

export const vehicleTypeOptions: { label: string; value: string }[] = [
  { label: 'GPL vrac (TM)', value: 'VRAC' },
  { label: 'Bouteilles 50 kg', value: 'BOUTEILLES50KG' },
]

export const vehicleFields: FieldConfig[] = [
  field.text('license_plate', 'Immatriculation', { required: true }),
  field.select('org_id', 'Organisation', orgOptions, { required: true }),
  field.select('type', 'Type', vehicleTypeOptions, { required: true }),
  field.number('max_volume', 'Capacité (TM) — vrac', { positive: true, help: 'Uniquement si type = VRAC.' }),
  field.number('max_bottle_count', 'Capacité (bouteilles 50 kg)', { positive: true, help: 'Uniquement si type = BOUTEILLES50KG.' }),
  field.text('certificate_number', 'N° certificat de jaugeage'),
  field.date('certificate_expiry_at', 'Expiration certificat'),
  field.switchField('is_active', 'Véhicule actif'),
]

export function vehicleToForm(v: Vehicle): FormValues {
  return {
    id: v.id,
    license_plate: v.license_plate ?? '',
    org_id: v.org_id ?? '',
    type: v.type,
    max_volume: v.max_volume ?? '',
    max_bottle_count: v.max_bottle_count ?? '',
    certificate_number: v.certificate_number ?? '',
    certificate_expiry_at: v.certificate_expiry_at ?? '',
    is_active: v.is_active,
  }
}

export function vehicleFromForm(v: FormValues): Partial<Vehicle> {
  const type = v.type as VehicleType
  return {
    license_plate: String(v.license_plate).trim(),
    org_id: String(v.org_id),
    type,
    max_volume: type === 'VRAC' ? (v.max_volume == null ? null : Number(v.max_volume)) : null,
    max_bottle_count: type === 'BOUTEILLES50KG' ? (v.max_bottle_count == null ? null : Number(v.max_bottle_count)) : null,
    certificate_number: v.certificate_number ? String(v.certificate_number) : undefined,
    certificate_expiry_at: v.certificate_expiry_at ? String(v.certificate_expiry_at) : undefined,
    is_active: Boolean(v.is_active),
  }
}
