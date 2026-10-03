import type { Region, RegionEntity } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'

const REGION_OPTIONS: { label: string; value: string }[] = (
  ['ADAMAOUA', 'CENTRE', 'EST', 'EXTREMENORD', 'LITTORAL', 'NORD', 'NORDOUEST', 'OUEST', 'SUD', 'SUDOUEST'] as Region[]
).map((region) => ({ label: region, value: region }))

export const zoneFields: FieldConfig[] = [
  field.text('name', 'Nom', { required: true }),
  field.select('code', 'Code', REGION_OPTIONS, { required: true }),
]

export function zoneToForm(zone: RegionEntity): FormValues {
  return {
    id: zone.id,
    name: zone.name,
    code: zone.code,
  }
}

export function zoneFromForm(values: FormValues): Partial<RegionEntity> {
  return {
    name: String(values.name ?? ''),
    code: String(values.code ?? '') as RegionEntity['code'],
  }
}
