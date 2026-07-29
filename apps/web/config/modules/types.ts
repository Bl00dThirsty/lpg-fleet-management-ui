export type ModuleFieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'badge'
  | 'status'

export type ModuleField = {
  key: string
  header: string
  type: ModuleFieldType
  /** options for badge/status/faceted filters */
  options?: { label: string; value: string }[]
  /** include in faceted filter toolbar */
  filterable?: boolean
  /** allow grouping by this column */
  groupable?: boolean
  /** column width class */
  className?: string
  /** value accessor override (defaults to row[key]) */
  accessor?: (row: Record<string, unknown>) => unknown
}

export type ModuleDefinition = {
  title: string
  description?: string
  fields: ModuleField[]
  /** how many mock rows to generate */
  mockCount?: number
  /** optional detail route prefix, e.g. '/marketers' -> row click navigates to /marketers/:id */
  rowLink?: (row: Record<string, unknown>) => string
}

export type ModuleRegistry = Record<string, ModuleDefinition>

export function moduleKey(role: string, module: string): string {
  return `${role}:${module}`
}
