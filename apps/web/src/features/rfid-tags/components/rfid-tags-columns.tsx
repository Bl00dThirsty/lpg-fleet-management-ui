import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader, StatusIndicator, STATUS_TONE_MAP } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  rfidTagStatusClasses,
  rfidTagStatusLabels,
  type RfidTagView,
} from '../data/rfid-tags'
import { CrudRowActions } from '@/components/entity-crud'

type RfidTagsColumnsProps = {
  onOpenDetails: (tag: RfidTagView) => void
  onEdit?: (tag: RfidTagView) => void
  onDelete?: (tag: RfidTagView) => void
}

export function getRfidTagsColumns({
  onOpenDetails,
  onEdit,
  onDelete,
}: RfidTagsColumnsProps): ColumnDef<RfidTagView>[] {
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
      accessorKey: 'tag_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Tag RFID' />
      ),
      cell: ({ row }) => (
        <button
          type='button'
          onClick={() => onOpenDetails(row.original)}
          className='ps-3 font-mono text-left font-medium text-primary underline-offset-4 hover:underline'
        >
          {row.original.tag_id}
        </button>
      ),
      filterFn: (row, _id, value) => {
        const query = String(value ?? '').trim().toLowerCase()
        if (!query) return true

        return [
          row.original.tag_id,
          row.original.bottle_serial,
          row.original.location,
          row.original.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      },
      meta: {
        label: 'Tag RFID',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'bottle_serial',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Bouteille' />
      ),
      cell: ({ row }) => (
        <span className='font-mono text-xs'>{row.original.bottle_serial}</span>
      ),
      meta: { label: 'Bouteille', className: 'w-32' },
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
          <StatusIndicator tone={STATUS_TONE_MAP[status] ?? 'muted'} ariaLabel={`Statut: ${rfidTagStatusLabels[status]}`}>
            <Badge className={cn('font-medium', rfidTagStatusClasses[status])}>
              {rfidTagStatusLabels[status]}
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
      accessorKey: 'location',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Localisation' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.location}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Localisation' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Date creation' />
      ),
      cell: ({ row }) => (
        <span>{formatDateTime(row.original.created_at)}</span>
      ),
      meta: { label: 'Date creation', className: 'w-32' },
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
            resource='rfid'
            itemLabel='ce tag RFID'
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
