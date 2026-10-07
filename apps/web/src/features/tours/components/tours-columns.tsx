import { type ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { MoreHorizontal, Eye, Pencil } from 'lucide-react'
import {
  Badge,
  Button,
  DataTableColumnHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { StatusBadge } from '@/components/data-table'
import { useRoleStore } from '@/store/role-store'
import { canEditTour } from '../data/tour-machine'
import {
  type TourActivity,
  type ExecutionMode,
  executionModeLabels,
  getTourCargo,
  getTourVolume,
} from '../data/tour-activity'

const MODE_CLASS: Record<ExecutionMode, string> = {
  INTERNAL: 'bg-slate-100 text-slate-700',
  EXTERNAL: 'bg-indigo-100 text-indigo-800',
}

const DASH = '\u2014'

export function getToursColumns({
  onOpenDetails,
  selectedTripId,
  missionKind,
}: {
  onOpenDetails: (row: TourActivity) => void
  selectedTripId?: string | null
  missionKind?: TourActivity['mission_kind']
}): ColumnDef<TourActivity>[] {
  const columns: ColumnDef<TourActivity>[] = [
    {
      accessorKey: 'reference',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Reference' />
      ),
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
        <StatusBadge
          activity={missionKind === 'PICKUP' ? 'PICKUP' : 'TOUR'}
          value={row.original.tourneeStatus}
          showCode
        />
      ),
      enableHiding: false,
      meta: { label: 'Statut' },
      enableGrouping: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <TourRowActions tour={row.original} onOpenDetails={onOpenDetails} />
      ),
      enableHiding: false,
    },
  ]
  if (missionKind === 'PICKUP') {
    const specific: ColumnDef<TourActivity>[] = [
      {
        id: 'origin',
        accessorFn: (row) => row.originSite.name,
        header: 'Dépôt d’enlèvement',
        meta: { label: 'Dépôt' },
      },
      {
        id: 'destination',
        accessorFn: (row) => row.destinationSite.name,
        header: 'Destination',
        meta: { label: 'Destination' },
      },
      {
        accessorKey: 'scheduled_at',
        header: 'Date prévue',
        cell: ({ row }) =>
          row.original.scheduled_at
            ? new Date(row.original.scheduled_at).toLocaleString('fr-FR')
            : DASH,
        meta: { label: 'Date prévue' },
      },
      {
        accessorKey: 'has_loading_proof',
        header: 'Bon',
        cell: ({ row }) => (
          <Badge variant='outline'>
            {row.original.has_loading_proof ? 'Disponible' : 'À scanner'}
          </Badge>
        ),
        meta: { label: 'Bon' },
      },
    ]
    return [
      ...columns.filter(
        (c) =>
          !('accessorKey' in c) ||
          !['transporter_name', 'execution_mode'].includes(
            String(c.accessorKey)
          )
      ),
      ...specific,
    ]
  }
  return columns
}

function TourRowActions({
  tour,
  onOpenDetails,
}: {
  tour: TourActivity
  onOpenDetails: (row: TourActivity) => void
}) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const canEdit =
    hasPermission(activeRole, 'tours.write') &&
    canEditTour({ status: tour.tourneeStatus })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='size-8 p-0'
          aria-label={`Actions pour ${tour.reference}`}
        >
          <MoreHorizontal className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onOpenDetails(tour)}>
          <Eye className='size-4 mr-2' />
          Détails
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem asChild>
            <Link to='/tours/$tourId/edit' params={{ tourId: tour.id }}>
              <Pencil className='size-4 mr-2' />
              Modifier
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

