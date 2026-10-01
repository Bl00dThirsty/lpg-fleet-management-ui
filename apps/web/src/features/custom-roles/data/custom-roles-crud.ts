import { curated } from '@lpg/mock-data'
import { PERMISSION_CATALOG } from '@lpg/permissions'
import type { CustomRole } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'

const ORG_OPTIONS = (curated.organizations as Array<{ id: string; name: string }>).map((o) => ({
  label: o.name,
  value: o.id,
}))

const PERMISSION_OPTIONS: { label: string; value: string }[] = PERMISSION_CATALOG.map((p) => ({
  label: p.code,
  value: p.code,
}))

export const customRoleFields: FieldConfig[] = [
  field.text('name', 'Nom du rôle', { required: true }),
  field.select('org_id', 'Organisation', ORG_OPTIONS, { required: true }),
  field.textarea('description', 'Description'),
  field.checklist('permission_codes', 'Permissions', PERMISSION_OPTIONS),
  field.switchField('is_active', 'Rôle actif'),
]

export function customRoleToForm(r: CustomRole): FormValues {
  const codes = Object.entries(r.permissions_json)
    .filter(([, v]) => v === true)
    .map(([code]) => code)
  return {
    id: r.id,
    name: r.name,
    org_id: r.org_id,
    description: r.description ?? '',
    permission_codes: codes,
    is_active: r.is_active,
  }
}

export function customRoleFromForm(v: FormValues): Partial<CustomRole> {
  const codes = Array.isArray(v.permission_codes) ? (v.permission_codes as string[]) : []
  return {
    name: String(v.name).trim(),
    org_id: String(v.org_id),
    description: v.description ? String(v.description) : undefined,
    permissions_json: Object.fromEntries(codes.map((c) => [c, true])),
    is_active: Boolean(v.is_active),
  }
}
