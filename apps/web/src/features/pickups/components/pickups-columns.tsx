import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@lpg/ui'
import { StatusBadge } from '@/components/data-table'
import { type Pickup } from '../data/pickups'

export function getPickupsColumns({
  onOpenDetails,
}: {
  onOpenDetails: (row: Pickup) => void
}): ColumnDef<Pickup>[] {
  return [
    {
      accessorKey: 'reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Référence' />,
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onOpenDetails(row.original)}
          className='font-medium text-primary underline-offset-4 hover:underline'
        >
          {row.original.reference}
        </button>
      ),
      enableHiding: false,
      meta: { label: 'Référence' },
    },
    {
      accessorKey: 'marketeur_name',
      header: 'Marketeur',
      cell: ({ row }) => row.original.marketeur_name,
      meta: { label: 'Marketeur' },
      enableGrouping: true,
    },
    {
      accessorKey: 'source_name',
      header: 'Source',
      cell: ({ row }) => row.original.source_name,
      meta: { label: 'Source' },
      enableGrouping: true,
    },
    {
      accessorKey: 'destination_name',
      header: 'Destination',
      cell: ({ row }) => row.original.destination_name,
      meta: { label: 'Destination' },
      enableGrouping: true,
    },
    {
      accessorKey: 'requested_quantity',
      header: 'Quantité (kg)',
      cell: ({ row }) => new Intl.NumberFormat('fr-FR').format(row.original.requested_quantity),
      meta: { label: 'Quantité (kg)' },
      enableGrouping: true,
    },
    {
      accessorKey: 'pickup_status',
      header: 'Statut',
      cell: ({ row }) => (
        <StatusBadge
          activity='PICKUP'
          value={row.original.pickup_status}
          showCode
        />
      ),
      meta: { label: 'Statut' },
      enableHiding: false,
      enableGrouping: true,
    },
  ]
}