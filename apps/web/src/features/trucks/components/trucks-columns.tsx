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
import { quantityInfo } from '../lib/quantity'
import { DataTableRowActions } from './data-table-row-actions'
import { CrudRowActions } from '@/components/entity-crud'

type TrucksColumnsProps = {
  onViewDetails: (truck: Truck) => void
  onEdit?: (truck: Truck) => void
  onDelete?: (truck: Truck) => void
}

export function getTrucksColumns({
  onViewDetails,
  onEdit,
  onDelete,
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
          row.original.license_plate,
          row.original.tenant_name,
          row.original.assigned_driver,
          row.original.region,
          row.original.current_location,
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
      enableGrouping: true,
    },
    {
      accessorKey: 'license_plate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Plaque' />
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>{row.original.license_plate}</div>
      ),
      meta: { label: 'Plaque', className: 'w-32' },
      enableGrouping: true,
    },
    {
      accessorKey: 'tenant_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Entreprise' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.tenant_name}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Entreprise' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'region',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Region' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.region}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Region' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'assigned_driver',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Chauffeur' />
      ),
      cell: ({ row }) => (
        <div className='space-y-0.5'>
          <LongText className='max-w-40 font-medium'>
            {row.original.assigned_driver}
          </LongText>
        </div>
      ),
      meta: { label: 'Chauffeur', className: 'min-w-42' },
      enableGrouping: true,
    },
    {
      accessorKey: 'tournee_status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => {
        const status = row.original.tournee_status
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
      enableGrouping: true,
    },
    {
      id: 'lpgLevel',
      accessorFn: (truck) => quantityInfo(truck).percent,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='LPG' />
      ),
      cell: ({ row }) => {
        const info = quantityInfo(row.original)
        const telemetry = getTruckTelemetry(row.original.id)
        return (
          <div className='w-32 space-y-1'>
            <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-emerald-500 transition-all duration-700'
                style={{ width: `${info.percent}%` }}
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              {info.percent}% • {info.amount}
            </p>
            {telemetry.expected_arrival ? (
              <p className='text-[10px] text-muted-foreground'>
                ETA{' '}
                {new Date(telemetry.expected_arrival).toLocaleTimeString(
                  'fr-FR',
                  { hour: '2-digit', minute: '2-digit' }
                )}
              </p>
            ) : null}
          </div>
        )
      },
      meta: { label: 'LPG', className: 'w-36' },
    },
    {
      accessorKey: 'risk_level',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Risque' />
      ),
      cell: ({ row }) => {
        const risk = row.original.risk_level
        return (
          <Badge variant='outline' className={cn(riskClasses[risk])}>
            {riskLabels[risk]}
          </Badge>
        )
      },
      meta: { label: 'Risque' },
      enableSorting: false,
      enableGrouping: true,
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
    {
      id: 'crud-actions',
      header: '',
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <CrudRowActions
            resource='trucks'
            itemLabel='ce camion'
            onEdit={onEdit ? () => onEdit?.(row.original) : undefined}
            onDelete={onDelete ? () => onDelete?.(row.original) : undefined}
          />
        </div>
      ),
      meta: { label: 'Actions' },
    },
  ]
}
