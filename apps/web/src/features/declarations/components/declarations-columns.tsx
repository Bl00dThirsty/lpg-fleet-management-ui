import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@lpg/ui'
import { DataTableColumnHeader } from '@/components/data-table'
import {
  type DeclarationView,
  type DeclarationStatus,
  declarationStatusLabels,
} from '../data/declarations'
import { DeclarationRowActions } from './declaration-row-actions'

const STATUS_CLASS: Record<DeclarationStatus, string> = {
  DRAFT: 'bg-slate-200 text-slate-800',
  SUBMITTED: 'bg-sky-100 text-sky-800',
  RECONCILED: 'bg-emerald-600 text-white',
  DISPUTED: 'bg-rose-100 text-rose-900',
}

export function getDeclarationColumns(): ColumnDef<DeclarationView>[] {
  return [
    {
      accessorKey: 'reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Référence' />,
      cell: ({ row }) => <span className='font-medium text-primary'>{row.original.reference}</span>,
      enableHiding: false,
      meta: { label: 'Référence' },
    },
    {
      accessorKey: 'marketeur_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Marketeur' />,
      cell: ({ row }) => row.original.marketeur_name,
      meta: { label: 'Marketeur' },
      enableGrouping: true,
    },
    {
      accessorKey: 'period',
      header: 'Période',
      cell: ({ row }) => row.original.period,
      meta: { label: 'Période' },
      enableGrouping: true,
    },
    {
      accessorKey: 'volume_label',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Volume déclaré' />,
      cell: ({ row }) => row.original.volume_label,
      meta: { label: 'Volume déclaré' },
      enableGrouping: true,
    },
    {
      accessorKey: 'submitted_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Soumise le' />,
      cell: ({ row }) => formatDate(row.original.submitted_at),
      meta: { label: 'Soumise le' },
    },
    {
      accessorKey: 'reconciled_at',
      header: 'Réconciliée le',
      cell: ({ row }) => formatDate(row.original.reconciled_at ?? ''),
      meta: { label: 'Réconciliée le' },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge className={STATUS_CLASS[row.original.status]}>
          {declarationStatusLabels[row.original.status]}
        </Badge>
      ),
      enableHiding: false,
      meta: { label: 'Statut' },
      enableGrouping: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => <DeclarationRowActions row={row.original} />,
      enableSorting: false,
      enableHiding: false,
      meta: { className: 'w-[1%]' },
    },
  ]
}

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR')
}