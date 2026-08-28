import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type GroupingState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { DataTablePagination, DataTableToolbar } from '@lpg/ui'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useTranslation } from 'react-i18next'
import { getToursColumns } from './tours-columns'
import { getTourStatusOptions, getExecutionModeOptions, type TourActivity } from '../data/tour-activity'
import { usePreferencesStore } from '@/store/preferences-store'

export function ToursTable({
  rows,
  selectedTripId,
  onOpenDetails,
}: {
  rows: TourActivity[]
  selectedTripId?: string | null
  onOpenDetails: (row: TourActivity) => void
}) {
  const { t } = useTranslation('tours')
  const language = usePreferencesStore((s) => s.language)
  const [sorting, setSorting] = useState<SortingState>([])
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const statusOptions = useMemo(() => getTourStatusOptions(t as unknown as never), [t])
  const modeOptions = useMemo(() => getExecutionModeOptions(t as unknown as never), [t])

  const columns = useMemo(
    () => getToursColumns({ onOpenDetails, selectedTripId, t: t as unknown as never, lang: language }),
    [onOpenDetails, selectedTripId, t, language],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination, grouping },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGroupingChange: setGrouping,
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [grouping, sorting])

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <DataTableToolbar
          table={table}
          searchPlaceholder={t('filters.searchPlaceholder', { defaultValue: 'Rechercher une référence, marketeur...' })}
          searchKey='reference'
          filters={[
            { columnId: 'tourneeStatus', title: t('filters.status', { defaultValue: 'Statut' }), options: statusOptions },
            { columnId: 'execution_mode', title: t('filters.mode', { defaultValue: 'Mode' }), options: modeOptions },
          ]}
        />
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>{t('filters.groupBy', { defaultValue: 'Grouper par' })}</span>
          <select
            value={grouping[0] ?? ''}
            onChange={(e) => setGrouping(e.target.value ? [e.target.value] : [])}
            className='h-8 rounded-md border bg-background px-2 text-sm'
          >
            <option value=''>{t('filters.none', { defaultValue: '--' })}</option>
            <option value='execution_mode'>{t('columns.mode', { defaultValue: 'Mode' })}</option>
            <option value='tourneeStatus'>{t('columns.status', { defaultValue: 'Statut' })}</option>
          </select>
        </div>
      </div>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(header.column.columnDef.meta?.className)}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    row.original.id === selectedTripId ? 'selected' : undefined
                  }
                  className={cn(
                    row.original.id === selectedTripId && 'bg-primary/5 hover:bg-primary/10',
                    row.getIsGrouped() && 'bg-muted/40 font-medium',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.className)}
                    >
                      {cell.getIsGrouped() ? (
                        <button
                          type='button'
                          className='flex items-center gap-2 text-primary'
                          onClick={row.getToggleExpandedHandler()}
                        >
                          {row.getIsExpanded() ? '▼' : '▶'} {flexRender(cell.column.columnDef.cell, cell.getContext())} ({row.subRows.length})
                        </button>
                      ) : cell.getIsPlaceholder() ? null : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  {t('empty', { defaultValue: 'Aucune tournée ne correspond aux filtres.' })}
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
