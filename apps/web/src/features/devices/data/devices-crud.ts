import { curated } from '@lpg/mock-data'
import type { Device, DeviceStatus, DeviceType } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'

const orgOptions = (curated.organizations as Array<{ id: string; name: string }>).map((o) => ({
  label: o.name,
  value: o.id,
}))

export const deviceTypeOptions: { label: string; value: string }[] = [
  { label: 'GPS', value: 'GPS' },
  { label: 'PDA', value: 'PDA' },
  { label: 'Lecteur RFID', value: 'RFIDREADER' },
]

export const deviceStatusOptions: { label: string; value: string }[] = (
  [
    'UNASSIGNED',
    'ASSIGNED',
    'INMISSION',
    'OFFLINE',
    'PENDINGSYNC',
    'SYNCING',
    'SYNCED',
    'SYNCFAILED',
    'MAINTENANCE',
    'DEPLOYED',
    'REMOVED',
    'LOST',
  ] as DeviceStatus[]
).map((value) => ({ label: value, value }))

export const deviceFields: FieldConfig[] = [
  field.text('serial_number', 'N° de série', { required: true }),
  field.select('device_type', 'Type', deviceTypeOptions, { required: true }),
  field.select('status', 'Statut', deviceStatusOptions, { required: true, defaultValue: 'UNASSIGNED' }),
  field.select('org_id', 'Organisation', orgOptions),
  field.number('battery_level', 'Niveau batterie (%)', { min: 0, max: 100 }),
  field.switchField('battery_critical', 'Batterie critique'),
]

export function deviceToForm(d: Device): FormValues {
  return {
    id: d.id,
    serial_number: d.serial_number ?? '',
    device_type: d.device_type,
    status: d.status,
    org_id: d.org_id ?? '',
    battery_level: d.battery_level ?? '',
    battery_critical: d.battery_critical,
  }
}

export function deviceFromForm(v: FormValues): Partial<Device> {
  return {
    serial_number: String(v.serial_number).trim(),
    device_type: v.device_type as DeviceType,
    status: (v.status as DeviceStatus) ?? 'UNASSIGNED',
    org_id: v.org_id ? String(v.org_id) : undefined,
    battery_level: v.battery_level == null ? null : Number(v.battery_level),
    battery_critical: Boolean(v.battery_critical),
  }
}
