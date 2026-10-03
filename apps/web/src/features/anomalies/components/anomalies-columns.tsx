import { type ColumnDef } from '@tanstack/react-table'
import { Badge, DataTableColumnHeader } from '@lpg/ui'
import {
  type AnomalyView,
  type AnomalyCategory,
  type AnomalyStatus,
  type RiskLevel,
  anomalyStatusLabels,
  anomalyCategoryLabels,
  severityLabels,
} from '../data/anomalies'

const CATEGORY_CLASS: Record<AnomalyCategory, string> = {
  INVESTIGATION: 'bg-violet-100 text-violet-800',
  TECHNICAL: 'bg-sky-100 text-sky-800',
}

const STATUS_CLASS: Record<AnomalyStatus, string> = {
  NOUVEAU: 'bg-amber-100 text-amber-900',
  ENCOURS: 'bg-blue-500 text-white',
  RESOLU: 'bg-emerald-600 text-white',
  FERME: 'bg-slate-200 text-slate-800',
}

const SEVERITY_CLASS: Record<RiskLevel, string> = {
  FAIBLE: 'bg-slate-200 text-slate-800',
  MODERE: 'bg-amber-100 text-amber-900',
  ELEVE: 'bg-orange-500 text-white',
  CRITIQUE: 'bg-rose-600 text-white',
  CRITIQUEEXTREME: 'bg-rose-900 text-white',
}

export function getAnomalyColumns(): ColumnDef<AnomalyView>[] {
  return [
    {
      accessorKey: 'reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Référence' />,
      cell: ({ row }) => <span className='font-medium text-primary'>{row.original.reference}</span>,
      enableHiding: false,
      meta: { label: 'Référence' },
    },
    {
      accessorKey: 'type_label',
      header: 'Type',
      cell: ({ row }) => row.original.type_label,
      meta: { label: 'Type' },
      enableGrouping: true,
    },
    {
      accessorKey: 'category',
      header: 'Piste',
      cell: ({ row }) => (
        <Badge className={CATEGORY_CLASS[row.original.category]}>
          {anomalyCategoryLabels[row.original.category]}
        </Badge>
      ),
      meta: { label: 'Piste' },
      enableGrouping: true,
    },
    {
      accessorKey: 'severity',
      header: 'Gravité',
      cell: ({ row }) => (
        <Badge className={SEVERITY_CLASS[row.original.severity]}>
          {severityLabels[row.original.severity]}
        </Badge>
      ),
      meta: { label: 'Gravité' },
      enableGrouping: true,
    },
    {
      accessorKey: 'entity_name',
      header: 'Entité',
      cell: ({ row }) => row.original.entity_name,
      meta: { label: 'Entité' },
      enableGrouping: true,
    },
    {
      accessorKey: 'assigned_agent',
      header: 'Assignée à',
      cell: ({ row }) => row.original.assigned_agent ?? '—',
      meta: { label: 'Assignée à' },
      enableGrouping: true,
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge className={STATUS_CLASS[row.original.status]}>
          {anomalyStatusLabels[row.original.status]}
        </Badge>
      ),
      enableHiding: false,
      meta: { label: 'Statut' },
      enableGrouping: true,
    },
  ]
}