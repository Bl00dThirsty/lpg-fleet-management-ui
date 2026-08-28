import { type ColumnDef } from '@tanstack/react-table'
import { Badge, DataTableColumnHeader } from '@lpg/ui'
import {
  type TourActivity,
  type TourneeStatus,
  type ExecutionMode,
  tourStatusLabels,
  executionModeLabels,
  getTourCargo,
  getTourVolume,
} from '../data/tour-activity'

const STATUS_CLASS: Record<TourneeStatus, string> = {
  DRAFT: 'bg-slate-200 text-slate-800',
  PLANNED: 'bg-sky-100 text-sky-800',
  PENDINGTRANSPORTERACK: 'bg-amber-100 text-amber-900',
  ACKNOWLEDGED: 'bg-violet-100 text-violet-900',
  INPROGRESS: 'bg-blue-500 text-white',
  CHECKPOINTACTIVE: 'bg-orange-500 text-white',
  CLOSED: 'bg-emerald-600 text-white',
  CANCELLED: 'bg-rose-100 text-rose-900',
}

const MODE_CLASS: Record<ExecutionMode, string> = {
  INTERNAL: 'bg-slate-100 text-slate-700',
  EXTERNAL: 'bg-indigo-100 text-indigo-800',
}

const DASH = '\u2014'

export function getToursColumns({
  onOpenDetails,
  selectedTripId,
}: {
  onOpenDetails: (row: TourActivity) => void
  selectedTripId?: string | null
}): ColumnDef<TourActivity>[] {
  return [
    {
      accessorKey: 'reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Reference' />,
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onOpenDetails(row.original)}
          aria-current={row.original.id === selectedTripId ? 'true' : undefined}
          className={
            row.original.id === selectedTripId
              ? 'font-semibold text-primary underline-offset-4 hover:underline'
              : 'font-medium text-primary underline-offset-4 hover:underline'
          }
        >
          {row.original.reference}
        </button>
      ),
      enableHiding: false,
      enableGrouping: true,
      meta: { label: 'Reference' },
    },
    {
      accessorKey: 'marketeur_name',
      header: 'Marketeur',
      cell: ({ row }) => row.original.marketeur_name,
      meta: { label: 'Marketeur' },
      enableGrouping: true,
    },
    {
      accessorKey: 'execution_mode',
      header: 'Mode',
      cell: ({ row }) => (
        <Badge className={MODE_CLASS[row.original.execution_mode]}>
          {executionModeLabels[row.original.execution_mode]}
        </Badge>
      ),
      meta: { label: 'Mode' },
      enableGrouping: true,
    },
    {
      accessorKey: 'tourneeType',
      header: 'Type',
      cell: ({ row }) => getTourCargo(row.original),
      meta: { label: 'Type' },
      enableGrouping: true,
    },
    {
      accessorKey: 'transporter_name',
      header: 'Transporteur',
      cell: ({ row }) => row.original.transporter_name ?? DASH,
      meta: { label: 'Transporteur' },
      enableGrouping: true,
    },
    {
      accessorKey: 'vehicle_plate',
      header: 'Vehicule',
      cell: ({ row }) => row.original.vehicle_plate ?? DASH,
      meta: { label: 'Vehicule' },
      enableGrouping: true,
    },
    {
      accessorKey: 'requested_quantity',
      header: 'Quantite',
      cell: ({ row }) => getTourVolume(row.original),
      meta: { label: 'Quantite' },
      enableGrouping: true,
    },
    {
      accessorKey: 'delivered_quantity',
      header: 'Livre',
      cell: ({ row }) =>
        row.original.delivered_quantity != null
          ? `${row.original.delivered_quantity} ${row.original.tourneeType === 'VRAC' ? 'TM' : 'btl'}`
          : DASH,
      meta: { label: 'Livre' },
      enableGrouping: true,
    },
    {
      accessorKey: 'tourneeStatus',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge className={STATUS_CLASS[row.original.tourneeStatus]}>
          {tourStatusLabels[row.original.tourneeStatus]}
        </Badge>
      ),
      enableHiding: false,
      meta: { label: 'Statut' },
      enableGrouping: true,
    },
  ]
}
