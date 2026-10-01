import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import {
  entityTypeLabels,
  riskLevelClasses,
  riskLevelLabels,
  type RiskScoreView,
} from '../data/recompute'

export function getRecomputeColumns(): ColumnDef<RiskScoreView>[] {
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
        <DataTableColumnHeader column={column} title='Score ID' />
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
          row.original.entityId,
          entityTypeLabels[row.original.entityType],
          riskLevelLabels[row.original.level],
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      },
      meta: {
        label: 'Score ID',
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'entityType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Type entité' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-32'>
          {entityTypeLabels[row.original.entityType]}
        </LongText>
      ),
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Type entité' },
      enableSorting: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'entityId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Entité ID' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-44'>{row.original.entityId}</LongText>
      ),
      meta: { label: 'Entité ID' },
      enableGrouping: true,
    },
    {
      accessorKey: 'score',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Score' />
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>{row.original.score}</div>
      ),
      meta: { label: 'Score' },
      enableGrouping: true,
    },
    {
      accessorKey: 'level',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Niveau' />
      ),
      cell: ({ row }) => {
        const level = row.original.level
        return (
          <Badge variant='outline' className={cn(riskLevelClasses[level])}>
            {riskLevelLabels[level]}
          </Badge>
        )
      },
      filterFn: (row, id, value) =>
        (value as string[]).includes(String(row.getValue(id))),
      meta: { label: 'Niveau' },
      enableSorting: false,
      enableHiding: false,
      enableGrouping: true,
    },
    {
      accessorKey: 'modelVersion',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Modèle' />
      ),
      cell: ({ row }) => (
        <div className='font-mono text-xs'>{row.original.modelVersion}</div>
      ),
      meta: { label: 'Modèle', className: 'w-28' },
      enableGrouping: true,
    },
    {
      id: 'period',
      accessorFn: (row) => `${row.periodStart} - ${row.periodEnd}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Période' />
      ),
      cell: ({ row }) => (
        <div className='text-xs text-muted-foreground'>
          {row.original.periodStart} → {row.original.periodEnd}
        </div>
      ),
      meta: { label: 'Période' },
      enableSorting: false,
    },
  ]
}
