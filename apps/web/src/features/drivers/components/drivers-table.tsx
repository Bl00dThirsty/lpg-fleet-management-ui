import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type GroupingState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { driverStatusOptions, type DriverView } from '../data/drivers'
import { getDriversColumns } from './drivers-columns'
import { DataTableBulkActions as DriversBulkActions } from './data-table-bulk-actions'

type DriversTableProps = {
  data: DriverView[]
  orgOptions: { label: string; value: string }[]
  onViewDetails: (driver: DriverView) => void
  onEdit?: (driver: DriverView) => void
  onDelete?: (driver: DriverView) => void
}

export function DriversTable({
  data,
  orgOptions,
  onViewDetails,
  onEdit,
  onDelete,
}: DriversTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState({})

  const columns = useMemo(
    () => getDriversColumns({ onViewDetails, onEdit, onDelete }),
    [onViewDetails, onEdit, onDelete]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
      grouping,
      expanded,
    },
    enableRowSelection: true,
    enableGrouping: true,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.min(prev.pageIndex, Math.max(table.getPageCount() - 1, 0)),
    }))
  }, [table.getPageCount()])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <div className='flex flex-wrap items-center gap-3'>
        <DataTableToolbar
          table={table}
          searchPlaceholder='Rechercher chauffeur, permis, entreprise...'
          searchKey='full_name'
          filters={[
            {
              columnId: 'org_name',
              title: 'Entreprise',
              options: orgOptions,
            },
            {
              columnId: 'is_active',
              title: 'Statut',
              options: [...driverStatusOptions],
            },
          ]}
        />
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>Grouper par</span>
          <select
            value={grouping[0] ?? ''}
            onChange={(e) =>
              setGrouping(e.target.value ? [e.target.value] : [])
            }
            className='h-8 rounded-md border bg-background px-2 text-sm'
          >
            <option value=''>—</option>
            <option value='org_name'>Entreprise</option>
            <option value='is_active'>Statut</option>
          </select>
        </div>
      </div>

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'group/row',
                    row.getIsGrouped() && 'bg-muted/40 font-medium'
                  )}
                  onDoubleClick={() => {
                    if (!row.getIsGrouped()) onViewDetails(row.original)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {cell.getIsGrouped() ? (
                        <button
                          type='button'
                          className='flex items-center gap-2 text-primary'
                          onClick={row.getToggleExpandedHandler()}
                        >
                          {row.getIsExpanded() ? '▼' : '▶'}{' '}
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}{' '}
                          ({row.subRows.length})
                        </button>
                      ) : cell.getIsPlaceholder() ? null : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Aucun chauffeur ne correspond aux filtres.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
      <DriversBulkActions table={table} />
    </div>
  )
}