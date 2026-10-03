import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge, Checkbox } from '@lpg/ui'
import { DataTableColumnHeader } from '@lpg/ui'
import { type Organization } from '@lpg/types'
import { CrudRowActions } from '@/components/entity-crud'

type TransportersColumnsProps = {
  onViewDetails: (transporter: Organization) => void
  onEdit?: (transporter: Organization) => void
  onDelete?: (transporter: Organization) => void
}

export function getTransportersColumns({
  onViewDetails,
  onEdit,
  onDelete,
}: TransportersColumnsProps): ColumnDef<Organization>[] {
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
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Nom' />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onViewDetails(row.original)}
          className='ps-3 text-left font-medium text-primary underline-offset-4 hover:underline'
        >
          {row.original.name}
        </button>
      ),
      meta: {
        label: 'Name',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Statut' },
      enableSorting: false,
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'vehicle_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Véhicules' />
      ),
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.vehicle_count ?? 0}</span>
      ),
      meta: { label: 'Véhicules' },
      enableGrouping: true,
    },
    {
      accessorKey: 'driver_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Chauffeurs' />
      ),
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.driver_count ?? 0}</span>
      ),
      meta: { label: 'Chauffeurs' },
      enableGrouping: true,
    },
    {
      id: 'actions',
      header: () => <span className='sr-only'>Actions</span>,
      cell: ({ row }) => (
        <div className='text-right'>
          <CrudRowActions
            resource='transporters'
            itemLabel='ce transporteur'
            onEdit={onEdit ? () => onEdit?.(row.original) : undefined}
            onDelete={onDelete ? () => onDelete?.(row.original) : undefined}
          />
        </div>
      ),
      meta: { label: 'Actions' },
      enableHiding: false,
      enableSorting: false,
    },
  ]
}