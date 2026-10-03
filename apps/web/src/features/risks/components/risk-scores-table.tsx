import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type GroupingState,
  type ExpandedState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { DataTablePagination, DataTableToolbar } from '@lpg/ui'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getRiskScoreColumns } from './risk-scores-columns'
import { riskLevelOptions, type RiskScoreView } from '../data/risk-scores'

type GroupMode = 'level' | 'entity_type' | ''

const GROUP_OPTIONS: { value: GroupMode; label: string }[] = [
  { value: '', label: 'Aucun groupement' },
  { value: 'level', label: 'Niveau de risque' },
  { value: 'entity_type', label: 'Type d’entité' },
]

export function RiskScoresTable({
  rows,
  onViewDetails,
}: {
  rows: RiskScoreView[]
  onViewDetails: (row: RiskScoreView) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [grouping, setGrouping] = useState<GroupingState>(['level'])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const columns = useMemo(() => getRiskScoreColumns(), [])

  const groupMode: GroupMode =
    grouping[0] === 'level' ? 'level' : grouping[0] === 'entity_type' ? 'entity_type' : ''

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination, grouping, expanded },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const changeGrouping = (mode: GroupMode) => {
    setGrouping(mode ? [mode] : [])
    setExpanded({})
  }

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Rechercher une entité...'
        searchKey='entity_name'
        filters={[{ columnId: 'level', title: 'Niveau', options: riskLevelOptions }]}
      />
      <div className='flex flex-wrap items-center gap-1'>
        <span className='text-sm text-muted-foreground'>Grouper par :</span>
        {GROUP_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type='button'
            variant={groupMode === option.value ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => changeGrouping(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className={cn(header.column.columnDef.meta?.className)}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                if (row.getIsGrouped()) {
                  return (
                    <TableRow key={row.id} className='bg-muted/40'>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} colSpan={row.getVisibleCells().length}>
                          <button
                            type='button'
                            className='inline-flex items-center gap-2 text-left text-sm font-semibold'
                            onClick={row.getToggleExpandedHandler()}
                          >
                            <span className='text-muted-foreground'>
                              {row.getIsExpanded() ? '▾' : '▸'}
                            </span>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            <span className='text-xs font-normal text-muted-foreground'>
                              ({row.subRows.length})
                            </span>
                          </button>
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                }
                return (
                  <TableRow
                    key={row.id}
                    className='cursor-pointer'
                    onClick={() => onViewDetails(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Aucun score.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}