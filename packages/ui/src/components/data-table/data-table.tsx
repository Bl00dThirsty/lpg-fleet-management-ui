import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type GroupingState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table'
import { Cross2Icon } from '@radix-ui/react-icons'
import { Download, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { DataTableFacetedFilter } from './faceted-filter'
import { DataTablePagination } from './pagination'
import { DataTableViewOptions } from './view-options'
import { DateRangeFilter, type DateRangeValue } from './date-range-filter'
import {
  exportToCsv,
  exportToExcel,
  exportToJson,
} from '../../lib/export-utils'
import { type NavigateFn, useTableUrlState } from '../../hooks/use-table-url-state'

export type FacetedFilterConfig = {
  columnId: string
  title: string
  options: ReadonlyArray<{ label: string; value: string; icon?: React.ComponentType<{ className?: string }> }>
}

export type DataTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  search?: {
    placeholder?: string
    /** column id to filter (string filter); if omitted uses global filter */
    columnId?: string
    searchKey?: string
  }
  facetedFilters?: FacetedFilterConfig[]
  /** columns that can be used for grouping */
  groupableColumns?: { columnId: string; title: string }[]
  /** date range filter bound to a column */
  dateFilter?: {
    columnId: string
    searchKeyFrom: string
    searchKeyTo: string
    placeholder?: string
    /** accessor returning a Date/string for the row */
    getRowDate: (row: TData) => Date | string | undefined
  }
  exportable?: boolean
  filename?: string
  searchState?: Record<string, string | number | boolean | undefined | null>
  navigate?: NavigateFn
  onRowClick?: (row: TData) => void
  renderBulkActions?: (props: { table: ReturnType<typeof useReactTable<TData>> }) => React.ReactNode
}

export function DataTable<TData>({
  data,
  columns,
  search,
  facetedFilters = [],
  groupableColumns = [],
  dateFilter,
  exportable = true,
  filename = 'export',
  searchState,
  navigate,
  onRowClick,
  renderBulkActions,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: undefined,
    to: undefined,
  })

  const columnFiltersCfg = useMemo(() => {
    const cfg = []
    if (search?.columnId && search.searchKey) {
      cfg.push({
        columnId: search.columnId,
        searchKey: search.searchKey,
        type: 'string' as const,
      })
    }
    return cfg
  }, [search])

  const filteredData = useMemo<TData[]>(() => {
    if (!dateFilter || (!dateRange.from && !dateRange.to)) return data
    return data.filter((row) => {
      const raw = dateFilter.getRowDate(row)
      if (!raw) return true
      const d = raw instanceof Date ? raw : new Date(raw)
      if (Number.isNaN(d.getTime())) return true
      const from = dateRange.from
      const to = dateRange.to
      if (from && d < from) return false
      if (to) {
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })
  }, [data, dateFilter, dateRange])

  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    globalFilter,
    onGlobalFilterChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: searchState,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: search?.columnId ? { enabled: false } : { enabled: true, key: search?.searchKey ?? 'q' },
    columnFilters: columnFiltersCfg,
  })

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
      grouping,
      globalFilter,
    },
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getGroupedRowModel: getGroupedRowModel(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    !!table.getState().globalFilter ||
    grouping.length > 0

  return (
    <div className='max-sm:has-[div[role="toolbar"]]:mb-16 flex flex-1 flex-col gap-4'>
      <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-1 flex-col-reverse items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center'>
          <Input
            placeholder={search?.placeholder ?? 'Rechercher...'}
            value={
              search?.columnId
                ? ((table.getColumn(search.columnId)?.getFilterValue() as string) ?? '')
                : (globalFilter ?? '')
            }
            onChange={(e) => {
              if (search?.columnId) {
                table.getColumn(search.columnId)?.setFilterValue(e.target.value)
              } else {
                onGlobalFilterChange?.(e.target.value)
              }
            }}
            className='h-8 w-37.5 lg:w-62.5'
          />
          <div className='flex flex-wrap gap-2'>
            {facetedFilters.map((filter) => {
              const column = table.getColumn(filter.columnId)
              if (!column) return null
              return (
                <DataTableFacetedFilter
                  key={filter.columnId}
                  column={column}
                  title={filter.title}
                  options={filter.options}
                />
              )
            })}
            {dateFilter && (
              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
                placeholder={dateFilter.placeholder}
              />
            )}
            {groupableColumns.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='h-8 border-dashed'>
                    Grouper
                    <ChevronDown className='size-3.5' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start'>
                  <DropdownMenuLabel>Grouper par</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {groupableColumns.map((g) => (
                    <DropdownMenuItem
                      key={g.columnId}
                      onClick={() =>
                        setGrouping((prev) =>
                          prev.includes(g.columnId)
                            ? prev.filter((c) => c !== g.columnId)
                            : [...prev, g.columnId]
                        )
                      }
                      className={cn(
                        grouping.includes(g.columnId) && 'bg-secondary font-medium'
                      )}
                    >
                      {g.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {isFiltered && (
            <Button
              variant='ghost'
              onClick={() => {
                table.resetColumnFilters()
                onGlobalFilterChange?.('')
                setGrouping([])
                setDateRange({ from: undefined, to: undefined })
                navigate?.({
                  search: (prev) => {
                    const p = { ...((prev ?? {}) as Record<string, unknown>) }
                    columnFiltersCfg.forEach((c) => delete p[c.searchKey])
                    return p
                  },
                })
              }}
              className='h-8 px-2 lg:px-3'
            >
              Reinitialiser
              <Cross2Icon className='ms-2 h-4 w-4' />
            </Button>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {exportable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='h-8'>
                  <Download className='size-3.5' />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Format d’export</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportToCsv(table, { filename })}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel(table, { filename })}>
                  Excel (.xls)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToJson(table, { filename })}>
                  JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DataTableViewOptions table={table} />
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
                      'bg-background group-hover/row:bg-muted',
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                  className='group/row'
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {renderBulkActions?.({ table })}
    </div>
  )
}
