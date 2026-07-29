import { type ColumnDef } from '@tanstack/react-table'
import { type ModuleField } from '@/config/modules/types'
import { Badge } from '@lpg/ui'
import { DataTableColumnHeader } from '@lpg/ui'

function formatValue(field: ModuleField, value: unknown): React.ReactNode {
  if (value == null) return '—'
  switch (field.type) {
    case 'currency':
      return new Intl.NumberFormat('fr-CM', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      }).format(Number(value))
    case 'date': {
      const d = value instanceof Date ? value : new Date(String(value))
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('fr-FR')
    }
    case 'badge':
    case 'status': {
      const opt = field.options?.find((o) => o.value === value)
      const label = opt?.label ?? String(value)
      const variant =
        field.type === 'status'
          ? statusVariant(String(value))
          : 'secondary'
      return <Badge variant={variant as never}>{label}</Badge>
    }
    default:
      return String(value)
  }
}

function statusVariant(value: string): string {
  const v = value.toLowerCase()
  if (/(active|ok|valid|completed|done|synced|enligne)/.test(v)) return 'success'
  if (/(pending|attente|en cours|waiting)/.test(v)) return 'warning'
  if (/(error|fail|anomaly|fraud|critique|offline|retard)/.test(v)) return 'destructive'
  return 'secondary'
}

export function buildColumns(
  fields: ModuleField[]
): ColumnDef<Record<string, unknown>, unknown>[] {
  return fields.map((field) => ({
    id: field.key,
    accessorFn: (row) => (field.accessor ? field.accessor(row) : row[field.key]),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={field.header} />
    ),
    cell: ({ getValue }) => formatValue(field, getValue()),
    filterFn: field.type === 'badge' || field.type === 'status' ? 'arrIncludesSome' : undefined,
    meta: { className: field.className },
  }))
}
