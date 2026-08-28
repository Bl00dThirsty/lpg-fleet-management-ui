import { type ColumnDef } from '@tanstack/react-table'
import { Badge, DataTableColumnHeader } from '@lpg/ui'
import { type Pickup, type PickupStatus, pickupStatusLabels } from '../data/pickups'

const STATUS_CLASS: Record<PickupStatus, string> = {
  DRAFT: 'bg-slate-200 text-slate-800',
  VALIDATED: 'bg-sky-100 text-sky-800',
  INPROGRESS: 'bg-amber-100 text-amber-900',
  COMPLETED: 'bg-emerald-600 text-white',
  CANCELLED: 'bg-rose-100 text-rose-900',
}

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
        <Badge className={STATUS_CLASS[row.original.pickup_status]}>
          {pickupStatusLabels[row.original.pickup_status]}
        </Badge>
      ),
      meta: { label: 'Statut' },
      enableHiding: false,
      enableGrouping: true,
    },
  ]
}