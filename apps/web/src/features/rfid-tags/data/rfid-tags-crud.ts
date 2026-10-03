import type { RfidTag, RfidTagStatus } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'

const STATUS_OPTIONS: { label: string; value: string }[] = (
  ['AVAILABLE', 'ASSIGNEDTOBOTTLE', 'INTRANSITOUT', 'INTRANSITIN', 'LOST', 'BLOCKED'] as RfidTagStatus[]
).map((value) => ({ label: value, value }))

export const rfidTagFields: FieldConfig[] = [
  field.text('tag_id', 'EPC / Tag ID', { required: true }),
  field.select('status', 'Statut', STATUS_OPTIONS, { required: true, defaultValue: 'AVAILABLE' }),
  field.text('current_site_id', 'Site actuel'),
]

export function rfidTagToForm(t: RfidTag): FormValues {
  return {
    id: t.id,
    tag_id: t.tag_id ?? '',
    status: t.status,
    current_site_id: t.current_site_id ?? '',
  }
}

export function rfidTagFromForm(v: FormValues): Partial<RfidTag> {
  return {
    tag_id: String(v.tag_id).trim(),
    status: (v.status as RfidTagStatus) ?? 'AVAILABLE',
    current_site_id: v.current_site_id ? String(v.current_site_id) : undefined,
  }
}