import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  routeSeverityClasses,
  routeSeverityLabels,
  routeStatusClasses,
  routeStatusLabels,
  type RouteTripView,
} from '../data/routes'

type RoutesColumnsProps = {
  onOpenDetails: (routeId: string) => void
}

export function getRoutesColumns({
  onOpenDetails,
}: RoutesColumnsProps): ColumnDef<RouteTripView>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label='Tout selectionner'
            className='translate-y-0.5'
          />
        </div>
      ),
      meta: {
        className: cn('inset-s-0 z-10 rounded-tl-[inherit] max-md:sticky'),
      },
      cell: ({ row }) => (
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label='Selectionner la ligne'
            className='translate-y-0.5'
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'reference',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='ID Tournée' />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={(event) => {
            event.stopPropagation()
            onOpenDetails(row.original.id)
          }}
          className='ps-3 text-left font-medium text-primary underline-offset-4 hover:underline'
        >
          {row.original.reference}
        </button>
      ),
      filterFn: (row, _id, value) => {
        const query = String(value ?? '')
          .trim()
          .toLowerCase()
        if (!query) return true

        return [
          row.original.reference,
          row.original.customerName,
          row.original.truck.id,
          row.original.truck.plateNumber,
          row.original.truck.assignedDriver,
          row.original.originSite.name,
          row.original.destinationSite.name,
          row.original.originSite.city,
          row.original.destinationSite.city,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      },
      meta: {
        label: 'ID Tournée',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
    },
    {
      accessorKey: 'customerName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Client' />
      ),
      cell: ({ row }) => (
        <div className='space-y-0.5'>
          <LongText className='max-w-44 font-medium'>
            {row.original.customerName}
          </LongText>
          <p className='text-xs text-muted-foreground'>
            {row.original.missionLead}
          </p>
        </div>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Client', className: 'min-w-44' },
      enableSorting: false,
    },
    {
      id: 'corridor',
      accessorFn: (trip) =>
        `${trip.originSite.city} ${trip.destinationSite.city}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Corridor' />
      ),
      cell: ({ row }) => (
        <div className='space-y-0.5'>
          <p className='font-medium'>
            {row.original.originSite.city} - {row.original.destinationSite.city}
          </p>
          <LongText className='max-w-52 text-xs text-muted-foreground'>
            {`${row.original.originSite.name} -> ${row.original.destinationSite.name}`}
          </LongText>
        </div>
      ),
      meta: { label: 'Corridor', className: 'min-w-52' },
      enableSorting: false,
    },
    {
      id: 'truck',
      accessorFn: (trip) => `${trip.truck.id} ${trip.truck.plateNumber}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Camion' />
      ),
      cell: ({ row }) => (
        <div className='space-y-0.5'>
          <p className='font-medium'>{row.original.truck.id}</p>
          <p className='font-mono text-xs text-muted-foreground'>
            {row.original.truck.plateNumber}
          </p>
        </div>
      ),
      meta: { label: 'Camion', className: 'min-w-36' },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => {
        const status = row.original.status

        return (
          <Badge className={cn('font-medium', routeStatusClasses[status])}>
            {routeStatusLabels[status]}
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
      accessorKey: 'progressPercent',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Progression' />
      ),
      cell: ({ row }) => (
        <div className='w-28 space-y-1'>
          <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                row.original.status === 'incident'
                  ? 'bg-rose-500'
                  : row.original.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-sky-500'
              )}
              style={{ width: `${row.original.progressPercent}%` }}
            />
          </div>
          <p className='text-xs text-muted-foreground'>
            {row.original.progressPercent}% - {row.original.routeDistanceKm} km
          </p>
        </div>
      ),
      meta: { label: 'Progression', className: 'w-32' },
    },
    {
      id: 'lpgLevel',
      accessorFn: (trip) => trip.latestTelemetry.lpgLevelPercent,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='GPL' />
      ),
      cell: ({ row }) => (
        <div className='w-28 space-y-1'>
          <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
            <div
              className='h-full rounded-full bg-emerald-500 transition-all duration-700'
              style={{
                width: `${row.original.latestTelemetry.lpgLevelPercent}%`,
              }}
            />
          </div>
          <p className='text-xs text-muted-foreground'>
            {row.original.latestTelemetry.lpgLevelPercent}% -{' '}
            {formatKg(row.original.remainingQuantityKg)}
          </p>
        </div>
      ),
      meta: { label: 'GPL', className: 'w-32' },
    },
    {
      accessorKey: 'attentionLevel',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Attention' />
      ),
      cell: ({ row }) => {
        const severity = row.original.attentionLevel

        return (
          <Badge
            variant='outline'
            className={cn(routeSeverityClasses[severity])}
          >
            {routeSeverityLabels[severity]}
          </Badge>
        )
      },
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Attention' },
      enableSorting: false,
    },
    {
      accessorKey: 'lastUpdatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Derniere maj' />
      ),
      cell: ({ row }) => (
        <span>{formatDateTime(row.original.lastUpdatedAt)}</span>
      ),
      meta: { label: 'Derniere maj', className: 'w-32' },
    },
  ]
}

function formatKg(value: number) {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)} kg`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
