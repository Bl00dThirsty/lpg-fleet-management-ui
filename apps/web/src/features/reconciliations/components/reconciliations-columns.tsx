import { type ColumnDef } from '@tanstack/react-table'
import { Badge, DataTableColumnHeader } from '@lpg/ui'
import { formatTm } from '@/features/map/utils/format'
import { currentLang, formatNumber } from '@/lib/i18n/formatters'
import {
  type ReconciliationView,
  type ReconciliationStatus,
  reconciliationStatusLabels,
  gapToleranceThreshold,
} from '../data/reconciliations'
import { ReconciliationRowActions } from './reconciliation-row-actions'

const STATUS_CLASS: Record<ReconciliationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  VERIFIED: 'bg-emerald-600 text-white',
  REDRESSEMENTAPPLIED: 'bg-violet-100 text-violet-900',
}

export function getReconciliationColumns(): ColumnDef<ReconciliationView>[] {
  return [
    {
      accessorKey: 'reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Reference' />,
      cell: ({ row }) => <span className='font-medium text-primary'>{row.original.reference}</span>,
      enableHiding: false,
      meta: { label: 'Reference' },
    },
    {
      accessorKey: 'declaration_reference',
      header: 'Declaration',
      cell: ({ row }) => row.original.declaration_reference,
      meta: { label: 'Declaration' },
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
      accessorKey: 'declared_volume',
      header: 'Déclaré (TM)',
      cell: ({ row }) => formatTm(row.original.declared_volume),
      meta: { label: 'Declare (TM)' },
      enableGrouping: true,
    },
    {
      accessorKey: 'tracked_volume',
      header: 'Suivi (TM)',
      cell: ({ row }) => formatTm(row.original.tracked_volume),
      meta: { label: 'Suivi (TM)' },
      enableGrouping: true,
    },
    {
      accessorKey: 'gap_percentage',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Ecart %' />,
      cell: ({ row }) => {
        const gap = row.original.gap_percentage
        const flagged = gap > gapToleranceThreshold()
        return (
          <Badge className={flagged ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'}>
            {new Intl.NumberFormat(currentLang(), { maximumFractionDigits: 2 }).format(gap)}%
          </Badge>
        )
      },
      meta: { label: 'Ecart %' },
      enableGrouping: true,
    },
    {
      accessorKey: 'subsidy_impact',
      header: 'Impact subvention (XAF)',
      cell: ({ row }) => formatNumber(row.original.subsidy_impact, currentLang()),
      meta: { label: 'Impact subvention (XAF)' },
      enableGrouping: true,
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge className={STATUS_CLASS[row.original.status]}>
          {reconciliationStatusLabels[row.original.status]}
        </Badge>
      ),
      enableHiding: false,
      meta: { label: 'Statut' },
      enableGrouping: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => <ReconciliationRowActions row={row.original} />,
      enableSorting: false,
      enableHiding: false,
    },
  ]
}