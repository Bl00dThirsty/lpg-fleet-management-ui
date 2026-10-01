import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Organization } from '@lpg/types'
import { CrudRowActions } from '@/components/entity-crud'

type MarketersColumnsProps = {
  onViewDetails: (marketer: Organization) => void
  onEdit?: (marketer: Organization) => void
  onDelete?: (marketer: Organization) => void
}

export function getMarketersColumns({
  onViewDetails,
  onEdit,
  onDelete,
}: MarketersColumnsProps): ColumnDef<Organization>[] {
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
        <DataTableColumnHeader column={column} title='Name Marketer' />
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
        label: 'Name Marketer',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
      enableGrouping: true,
    },
    /*{
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Nom' />
      ),
      cell: ({ row }) => (
        <div className='font-medium'>{row.original.name}</div>
      ),
      meta: { label: 'Nom', className: 'w-48' },
      enableGrouping: true,
    },*/
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
      accessorKey: 'user_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Personnels' />
      ),
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.user_count ?? 0}</span>
      ),
      meta: { label: 'Personnels' },
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
      accessorKey: 'operational_site_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Sites' />
      ),
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.operational_site_count ?? 0}</span>
      ),
      meta: { label: 'Sites' },
      enableGrouping: true,
    },
    {
      id: 'actions',
      header: () => <span className='sr-only'>Actions</span>,
      cell: ({ row }) => (
        <div className='text-right'>
          <CrudRowActions
            resource='markets'
            itemLabel='ce marketeur'
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