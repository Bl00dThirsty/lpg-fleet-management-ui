import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  statusClasses,
  statusLabels,
  type SupplyRequest,
} from '../data/supply'

export function getSupplyColumns(): ColumnDef<SupplyRequest>[] {
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
        <DataTableColumnHeader column={column} title='Request ID' />
      ),
      cell: ({ row }) => (
        <div className='ps-3 font-medium text-primary'>{row.original.id}</div>
      ),
      filterFn: (row, _id, value) => {
        const query = String(value ?? '')
          .trim()
          .toLowerCase()
        if (!query) return true
        return [
          row.original.id,
          row.original.marketeurOrgId,
          row.original.sourceSiteName,
          row.original.destSiteName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      },
      meta: {
        label: 'Request ID',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'marketeurOrgId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Marchand' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.marketeurOrgId}</LongText>
      ),
      meta: { label: 'Marchand' },
      enableGrouping: true,
    },
    {
      accessorKey: 'sourceSiteName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Site source' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.sourceSiteName}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Site source' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'destSiteName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Site destination' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.destSiteName}</LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Site destination' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'requestedQuantity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Quantité demandée' />
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>{row.original.requestedQuantity} TM</div>
      ),
      meta: { label: 'Quantité demandée' },
      enableGrouping: true,
    },
    {
      accessorKey: 'approvedQuantity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Quantité approuvée' />
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>
          {row.original.approvedQuantity !== null ? `${row.original.approvedQuantity} TM` : '—'}
        </div>
      ),
      meta: { label: 'Quantité approuvée' },
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
  ]
}
