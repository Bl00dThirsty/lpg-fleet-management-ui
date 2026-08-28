/**
 * Declarative field configuration that drives `<EntityForm>`.
 *
 * Adding CRUD to an entity = declaring its `fields` array (no bespoke sheet
 * per entity). Keep field `name` aligned to the schema column (`@lpg/types`)
 * so submit payloads match the API contract.
 */

export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'switch'
  | 'date'
  | 'file'
  | 'url'
  | 'checklist'

export interface FieldOption {
  label: string
  value: string
}

export interface FieldConfig {
  /** Schema column name (snake_case), also the form key. */
  name: string
  label: string
  type: FieldType
  required?: boolean
  min?: number
  max?: number
  positive?: boolean
  pattern?: string
  patternMessage?: string
  minDate?: string
  maxDate?: string
  accept?: string
  maxFileSizeMb?: number
  autoOrg?: boolean
  hidden?: boolean
  placeholder?: string
  help?: string
  /** Select options (value must be string for the原生 Select). */
  options?: FieldOption[]
  /** Optional group title; fields without one fall back to "Informations". */
  section?: string
  /** Initial value when creating. */
  defaultValue?: unknown
  /** Coerce/transform the raw form value before submit (e.g. number). */
  transform?: (raw: unknown) => unknown
}

export const field = {
  text: (name: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
    name,
    label,
    type: 'text',
    ...extra,
  }),
  email: (name: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
    name,
    label,
    type: 'email',
    ...extra,
  }),
  url: (name: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
    name,
    label,
    type: 'url',
    ...extra,
  }),
  number: (name: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
    name,
    label,
    type: 'number',
    transform: (raw) => (raw === '' || raw == null ? null : Number(raw)),
    ...extra,
  }),
  textarea: (name: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
    name,
    label,
    type: 'textarea',
    ...extra,
  }),
  select: (
    name: string,
    label: string,
    options: FieldOption[],
    extra: Partial<FieldConfig> = {},
  ): FieldConfig => ({ name, label, type: 'select', options, ...extra }),
  switchField: (name: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
    name,
    label,
    type: 'switch',
    defaultValue: true,
    ...extra,
  }),
  date: (name: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
    name,
    label,
    type: 'date',
    ...extra,
  }),
  file: (name: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
    name,
    label,
    type: 'file',
    accept: 'application/pdf',
    maxFileSizeMb: 5,
    ...extra,
  }),
  orgField: (
    name: string,
    options: FieldOption[],
    extra: Partial<FieldConfig> = {},
  ): FieldConfig => ({
    name,
    label: 'Organisation',
    type: 'select',
    options,
    required: true,
    autoOrg: true,
    ...extra,
  }),
  checklist: (
    name: string,
    label: string,
    options: FieldOption[],
    extra: Partial<FieldConfig> = {},
  ): FieldConfig => ({ name, label, type: 'checklist', options, defaultValue: [] as string[], ...extra }),
}
