import { type ColumnDef } from '@tanstack/react-table'
import { Badge, DataTableColumnHeader } from '@lpg/ui'
import { CONTRACT_STATUS_CLASSES, CONTRACT_STATUS_LABELS } from '../lib/contract-status'
import { type TransporterContractView } from '../data/transporter-contracts'
import type { ReactNode } from 'react'

export function getTransporterContractColumns(actions?: (row: TransporterContractView) => ReactNode): ColumnDef<TransporterContractView>[] {
  return [
    {
      accessorKey: 'reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Contrat' />,
      cell: ({ row }) => <span className='font-medium text-primary'>{row.original.reference}</span>,
      enableHiding: false,
      meta: { label: 'Contrat' },
    },
    {
      accessorKey: 'marketeur_name',
      header: 'Marketeur',
      cell: ({ row }) => row.original.marketeur_name,
      meta: { label: 'Marketeur' },
      enableGrouping: true,
    },
    {
      accessorKey: 'transporter_name',
      header: 'Transporteur',
      cell: ({ row }) => row.original.transporter_name,
      meta: { label: 'Transporteur' },
      enableGrouping: true,
    },
    {
      accessorKey: 'start_date',
      header: 'Début',
      cell: ({ row }) => row.original.start_date,
      meta: { label: 'Début' },
      enableGrouping: true,
    },
    {
      accessorKey: 'end_date',
      header: 'Fin',
      cell: ({ row }) => row.original.end_date ?? '—',
      meta: { label: 'Fin' },
      enableGrouping: true,
    },
    {
      accessorKey: 'is_primary',
      header: 'Principal',
      cell: ({ row }) => (
        row.original.is_primary ? <Badge className='bg-indigo-100 text-indigo-800'>Principal</Badge> : '—'
      ),
      meta: { label: 'Principal' },
      enableGrouping: true,
    },
    {
      accessorKey: 'is_active',
      header: 'Statut',
      cell: ({ row }) => (
         <Badge className={CONTRACT_STATUS_CLASSES[row.original.status]}>
           {CONTRACT_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
      enableHiding: false,
      meta: { label: 'Statut' },
      enableGrouping: true,
    },
    {
      accessorKey: 'has_proof',
      header: 'Preuve',
      cell: ({ row }) => row.original.has_proof ? <Badge variant='outline'>PDF</Badge> : '—',
      meta: { label: 'Preuve' },
    },
    ...(actions ? [{ id: 'actions', header: 'Actions', cell: ({ row }) => actions(row.original), enableHiding: false, meta: { label: 'Actions' } } satisfies ColumnDef<TransporterContractView>] : []),
  ]
}
