import { type ColumnDef } from '@tanstack/react-table'
import { Badge, DataTableColumnHeader } from '@lpg/ui'
import {
  type RedressementView,
  type RedressementStatus,
  redressementStatusLabels,
} from '../data/redressements'
import { RedressementRowActions } from './redressement-row-actions'

const STATUS_CLASS: Record<RedressementStatus, string> = {
  ISSUED: 'bg-amber-100 text-amber-900',
  PAID: 'bg-emerald-600 text-white',
  WAIVED: 'bg-slate-200 text-slate-800',
}

export function getRedressementColumns(): ColumnDef<RedressementView>[] {
  return [
    {
      accessorKey: 'reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Reference' />,
      cell: ({ row }) => <span className='font-medium text-primary'>{row.original.reference}</span>,
      enableHiding: false,
      meta: { label: 'Reference' },
    },
    {
      accessorKey: 'reconciliation_reference',
      header: 'Reconciliation',
      cell: ({ row }) => row.original.reconciliation_reference,
      meta: { label: 'Reconciliation' },
      enableGrouping: true,
    },
    {
      accessorKey: 'marketeur_name',
      header: 'Marketeur',
      cell: ({ row }) => row.original.marketeur_name,
      meta: { label: 'Marketeur' },
      enableGrouping: true,
    },
    {
      accessorKey: 'amount_label',
      header: 'Montant',
      cell: ({ row }) => <span className='font-medium'>{row.original.amount_label}</span>,
      meta: { label: 'Montant' },
      enableGrouping: true,
    },
    {
      accessorKey: 'due_date',
      header: 'Echeance',
      cell: ({ row }) => row.original.due_date ?? '—',
      meta: { label: 'Echeance' },
      enableGrouping: true,
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge className={STATUS_CLASS[row.original.status]}>
          {redressementStatusLabels[row.original.status]}
        </Badge>
      ),
      enableHiding: false,
      meta: { label: 'Statut' },
      enableGrouping: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => <RedressementRowActions row={row.original} />,
      enableSorting: false,
      enableHiding: false,
    },
  ]
}