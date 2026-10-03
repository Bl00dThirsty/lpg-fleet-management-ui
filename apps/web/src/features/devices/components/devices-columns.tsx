import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader, StatusIndicator, STATUS_TONE_MAP } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  deviceStatusClasses,
  deviceStatusLabels,
  deviceTypeClasses,
  deviceTypeLabels,
  type DeviceView,
} from '../data/devices'
import { CrudRowActions } from '@/components/entity-crud'

type DevicesColumnsProps = {
  onViewDetails: (device: DeviceView) => void
  onEdit?: (device: DeviceView) => void
  onDelete?: (device: DeviceView) => void
}

export function getDevicesColumns({
  onViewDetails,
  onEdit,
  onDelete,
}: DevicesColumnsProps): ColumnDef<DeviceView>[] {
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
      accessorKey: 'serial',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Numéro de série' />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onViewDetails(row.original)}
          className='ps-3 text-left font-mono font-medium text-primary underline-offset-4 hover:underline'
        >
          {row.original.serial}
        </button>
      ),
      filterFn: (row, _id, value) => {
        const query = String(value ?? '').trim().toLowerCase()
        if (!query) return true
        return [
          row.original.serial,
          row.original.orgName,
          row.original.vehiclePlate,
          row.original.driverName,
          row.original.model,
          row.original.imei,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      },
      meta: {
        label: 'Numéro de série',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Type' />
      ),
      cell: ({ row }) => {
        const type = row.original.type
        return (
          <Badge variant='outline' className={cn('font-medium', deviceTypeClasses[type])}>
            {deviceTypeLabels[type]}
          </Badge>
        )
      },
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Type' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <StatusIndicator tone={STATUS_TONE_MAP[status] ?? 'muted'} ariaLabel={`Statut: ${deviceStatusLabels[status]}`}>
            <Badge className={cn('font-medium', deviceStatusClasses[status])}>
              {deviceStatusLabels[status]}
            </Badge>
          </StatusIndicator>
        )
      },
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Statut' },
      enableSorting: false,
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'orgName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Organisation' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.orgName}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Organisation' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      id: 'battery',
      accessorFn: (device) =>
        device.batteryLevel == null ? -1 : device.batteryLevel,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Batterie' />
      ),
      cell: ({ row }) => {
        const level = row.original.batteryLevel
        return (
          <div className='w-28 space-y-1'>
            <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  row.original.batteryCritical
                    ? 'bg-rose-500'
                    : (level ?? 0) < 30
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                )}
                style={{ width: `${Math.max(level ?? 0, 0)}%` }}
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              {level == null
                ? '—'
                : `${level}%${row.original.batteryCritical ? ' critique' : ''}`}
            </p>
          </div>
        )
      },
      meta: { label: 'Batterie', className: 'w-32' },
    },
    {
      accessorKey: 'firmware',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Firmware' />
      ),
      cell: ({ row }) => (
        <span className='font-mono text-xs'>{row.original.firmware ?? '—'}</span>
      ),
      meta: { label: 'Firmware', className: 'w-24' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'lastSync',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Dernière synchro' />
      ),
      cell: ({ row }) => (
        <span>
          {row.original.lastSync
            ? formatDateTime(row.original.lastSync)
            : '—'}
        </span>
      ),
      meta: { label: 'Dernière synchro', className: 'w-32' },
      enableGrouping: true,
    },
    {
      accessorKey: 'vehiclePlate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Affectation' />
      ),
      cell: ({ row }) => {
        const vehicle = row.original.vehiclePlate
        const driver = row.original.driverName
        if (!vehicle && !driver) {
          return <span className='text-muted-foreground'>—</span>
        }
        return (
          <div className='space-y-0.5'>
            {vehicle ? (
              <p className='font-mono text-xs'>{vehicle}</p>
            ) : null}
            {driver ? (
              <p className='max-w-40 text-xs text-muted-foreground'>{driver}</p>
            ) : null}
          </div>
        )
      },
      meta: { label: 'Affectation', className: 'min-w-36' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      id: 'actions',
      header: '',
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <CrudRowActions
            resource='devices'
            itemLabel='cet appareil'
            onEdit={onEdit ? () => onEdit?.(row.original) : undefined}
            onDelete={onDelete ? () => onDelete?.(row.original) : undefined}
          />
        </div>
      ),
      meta: { label: 'Actions' },
    },
  ]
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}