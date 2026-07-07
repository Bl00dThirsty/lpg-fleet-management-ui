import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { marketerStatusOptions, type Marketer } from '../data/marketers'

export function getMarketersColumns(): ColumnDef<Marketer>[] {
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
        <DataTableColumnHeader column={column} title='ID Marketer' />
      ),
      cell: ({ row }) => (
        <div className='ps-3 text-left font-medium'>
          {row.original.id}
        </div>
      ),
      meta: {
        label: 'ID Marketer',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Nom' />
      ),
      cell: ({ row }) => (
        <div className='font-medium'>{row.original.name}</div>
      ),
      meta: { label: 'Nom', className: 'w-48' },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Statut' />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        const label = marketerStatusOptions.find((o) => o.value === status)?.label
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {label}
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
      accessorKey: 'region',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Région' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.region}</LongText>
      ),
      meta: { label: 'Région' },
    },
    {
      accessorKey: 'contactEmail',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Email' />
      ),
      cell: ({ row }) => (
        <div className='text-muted-foreground'>{row.original.contactEmail}</div>
      ),
      meta: { label: 'Email' },
    },
    {
      accessorKey: 'contactPhone',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Téléphone' />
      ),
      cell: ({ row }) => (
        <div className='text-muted-foreground'>{row.original.contactPhone}</div>
      ),
      meta: { label: 'Téléphone' },
    },
  ]
}
