import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  getTruckTelemetry,
  riskClasses,
  riskLabels,
  statusClasses,
  statusLabels,
  type Truck,
} from '../data/trucks'
import { DataTableRowActions } from './data-table-row-actions'

type TrucksColumnsProps = {
  onViewDetails: (truck: Truck) => void
}

export function getTrucksColumns({
  onViewDetails,
}: TrucksColumnsProps): ColumnDef<Truck>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Tout selectionner'
          className='translate-y-0.5'
        />
      ),
      meta: {
        className: cn('inset-s-0 z-10 rounded-tl-[inherit] max-md:sticky'),
      },
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Selectionner la ligne'
          className='translate-y-0.5'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Truck ID' />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onViewDetails(row.original)}
          className='ps-3 text-left font-medium text-primary underline-offset-4 hover:underline'
        >
          {row.original.id}
        </button>
      ),
      filterFn: (row, _id, value) => {
        const query = String(value ?? '')
          .trim()
          .toLowerCase()
        if (!query) return true

        return [
          row.original.id,
          row.original.plateNumber,
          row.original.tenantName,
          row.original.marketer,
          row.original.assignedDriver,
          row.original.currentLocation,
          row.original.destination,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      },
      meta: {
        label: 'Truck ID',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
    },
    {
      accessorKey: 'plateNumber',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Plaque' />
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>{row.original.plateNumber}</div>
      ),
      meta: { label: 'Plaque', className: 'w-32' },
    },
    {
      accessorKey: 'tenantName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Entreprise' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.tenantName}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Entreprise' },
      enableSorting: false,
    },
    {
      accessorKey: 'marketer',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Site' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.marketer}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Site' },
      enableSorting: false,
    },
    {
      accessorKey: 'assignedDriver',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Chauffeur' />
      ),
      cell: ({ row }) => (
        <div className='space-y-0.5'>
          <LongText className='max-w-40 font-medium'>
            {row.original.assignedDriver}
          </LongText>
          <p className='text-xs text-muted-foreground'>
            {row.original.driverPhone}
          </p>
        </div>
      ),
      meta: { label: 'Chauffeur', className: 'min-w-42' },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge className={cn('font-medium', statusClasses[status])}>
            {statusLabels[status]}
          </Badge>
        )
      },
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Statut' },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'lpgLevel',
      accessorFn: (truck) => getTruckTelemetry(truck.id).lpgLevelPercent,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='LPG' />
      ),
      cell: ({ row }) => {
        const telemetry = getTruckTelemetry(row.original.id)
        return (
          <div className='w-28 space-y-1'>
            <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-emerald-500 transition-all duration-700'
                style={{ width: `${telemetry.lpgLevelPercent}%` }}
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              {telemetry.lpgLevelPercent}% -{' '}
              {Math.round(
                (row.original.tankCapacityLiters * telemetry.lpgLevelPercent) /
                  100
              ).toLocaleString()}{' '}
              L
            </p>
          </div>
        )
      },
      meta: { label: 'LPG', className: 'w-32' },
    },
    {
      accessorKey: 'contractTier',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Contrat' />
      ),
      cell: ({ row }) => (
        <Badge
          variant='outline'
          className='border-transparent bg-muted/35 text-foreground'
        >
          {row.original.contractTier}
        </Badge>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Contrat' },
      enableSorting: false,
    },
    {
      accessorKey: 'riskLevel',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Risque' />
      ),
      cell: ({ row }) => {
        const risk = row.original.riskLevel
        return (
          <Badge variant='outline' className={cn(riskClasses[risk])}>
            {riskLabels[risk]}
          </Badge>
        )
      },
      meta: { label: 'Risque' },
      enableSorting: false,
    },
    {
      accessorKey: 'tankCapacityLiters',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Capacite' />
      ),
      cell: ({ row }) => (
        <span>{row.original.tankCapacityLiters.toLocaleString()} L</span>
      ),
      meta: { label: 'Capacite' },
    },
    {
      accessorKey: 'compartments',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Compart.' />
      ),
      cell: ({ row }) => <span>{row.original.compartments}</span>,
      meta: { label: 'Compartiments' },
      enableSorting: false,
    },
    {
      accessorKey: 'gpsImei',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='GPS IMEI' />
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>{row.original.gpsImei}</div>
      ),
      meta: { label: 'GPS IMEI' },
      enableSorting: false,
    },
    {
      accessorKey: 'permitExpiry',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Permis' />
      ),
      cell: ({ row }) => <span>{formatDate(row.original.permitExpiry)}</span>,
      meta: { label: 'Expiration permis' },
    },
    {
      accessorKey: 'lastPing',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Dernier ping' />
      ),
      cell: ({ row }) => <span>{formatDateTime(row.original.lastPing)}</span>,
      meta: { label: 'Dernier ping' },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          truck={row.original}
          onViewDetails={onViewDetails}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
