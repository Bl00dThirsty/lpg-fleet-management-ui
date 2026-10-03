import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader, StatusIndicator, STATUS_TONE_MAP } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  driverStatusClasses,
  driverStatusLabels,
  type DriverView,
} from '../data/drivers'
import { CrudRowActions } from '@/components/entity-crud'

type DriversColumnsProps = {
  onViewDetails: (driver: DriverView) => void
  onEdit?: (driver: DriverView) => void
  onDelete?: (driver: DriverView) => void
}

export function getDriversColumns({
  onViewDetails,
  onEdit,
  onDelete,
}: DriversColumnsProps): ColumnDef<DriverView>[] {
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
      accessorKey: 'full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Chauffeur' />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onViewDetails(row.original)}
          className='ps-3 text-left font-medium text-primary underline-offset-4 hover:underline'
        >
          <LongText className='max-w-52'>{row.original.full_name}</LongText>
        </button>
      ),
      filterFn: (row, _id, value) => {
        const query = String(value ?? '')
          .trim()
          .toLowerCase()
        if (!query) return true

        return [
          row.original.full_name,
          row.original.first_name,
          row.original.last_name,
          row.original.license_number,
          row.original.org_name,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      },
      meta: {
        label: 'Chauffeur',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'license_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Permis' />
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>{row.original.license_number}</div>
      ),
      meta: { label: 'Permis', className: 'w-32' },
      enableGrouping: true,
    },
    {
      accessorKey: 'org_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Entreprise' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.org_name}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Entreprise' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'assigned_vehicle_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Vehicules' />
      ),
      cell: ({ row }) => (
        <span className='font-medium tabular-nums'>
          {row.original.assigned_vehicle_count}
        </span>
      ),
      meta: { label: 'Vehicules', className: 'w-24 text-center' },
      enableGrouping: true,
    },
    {
      accessorKey: 'active_tour_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Tournees actives' />
      ),
      cell: ({ row }) => (
        <span className='font-medium tabular-nums'>
          {row.original.active_tour_count}
        </span>
      ),
      meta: { label: 'Tournees actives', className: 'w-24 text-center' },
      enableGrouping: true,
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => {
        const isActive = row.original.is_active
        const status = isActive ? 'ACTIVE' : 'INACTIVE'
        return (
          <StatusIndicator tone={STATUS_TONE_MAP[status]} ariaLabel={`Statut: ${driverStatusLabels[status]}`}>
            <Badge className={cn('font-medium', driverStatusClasses[status])}>
              {driverStatusLabels[status]}
            </Badge>
          </StatusIndicator>
        )
      },
      filterFn: (row, _id, value) => {
        const isActive = row.original.is_active
        const expected = (value as string[]).includes('ACTIVE')
        return isActive === expected
      },
      meta: { label: 'Statut' },
      enableSorting: false,
      enableHiding: false,
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
            resource='drivers'
            itemLabel='ce chauffeur'
            onEdit={onEdit ? () => onEdit?.(row.original) : undefined}
            onDelete={onDelete ? () => onDelete?.(row.original) : undefined}
          />
        </div>
      ),
      meta: { label: 'Actions' },
    },
  ]
}