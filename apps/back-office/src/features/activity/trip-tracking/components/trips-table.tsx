import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import {
  cargoTypeOptions,
  tripStatusOptions,
  type Trip,
} from '../data/trip-data'
import { getTripsColumns } from './trips-columns'

type TripsTableProps = {
  data: Trip[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (trip: Trip) => void
}

export function TripsTable({
  data,
  search,
  navigate,
  onViewDetails,
}: TripsTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const columns = useMemo(
    () => getTripsColumns({ onViewDetails }),
    [onViewDetails]
  )

  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: false },
    columnFilters: [
      { columnId: 'id', searchKey: 'q', type: 'string' },
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'cargoType', searchKey: 'type', type: 'array' },
      { columnId: 'createdAt', searchKey: 'created', type: 'array' },
      { columnId: 'updatedAt', searchKey: 'updated', type: 'array' },
    ],
  })

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
    },
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Rechercher par ID Tournée...'
        searchKey='id'
        filters={[
          {
            columnId: 'status',
            title: 'Statut',
            options: tripStatusOptions,
          },
          {
            columnId: 'cargoType',
            title: 'Type de chargement',
            options: cargoTypeOptions,
          },
        ]}
      >
        <div className='flex items-center gap-2'>
          <div className='flex flex-col gap-1.5'>
            <span className='text-xs font-medium text-muted-foreground'>Créé</span>
            <DatePickerWithRange
              placeholder='Toutes les dates'
              value={(() => {
                const val = table.getColumn('createdAt')?.getFilterValue() as string[]
                if (!val || val.length !== 2) return undefined
                return { from: new Date(val[0]), to: new Date(val[1]) }
              })()}
              onChange={(date) => {
                if (date?.from && date?.to) {
                  table.getColumn('createdAt')?.setFilterValue([
                    date.from.toISOString(),
                    date.to.toISOString(),
                  ])
                } else {
                  table.getColumn('createdAt')?.setFilterValue(undefined)
                }
              }}
              className='w-auto lg:w-[240px]'
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <span className='text-xs font-medium text-muted-foreground'>Modifié</span>
            <DatePickerWithRange
              placeholder='Toutes les dates'
              value={(() => {
                const val = table.getColumn('updatedAt')?.getFilterValue() as string[]
                if (!val || val.length !== 2) return undefined
                return { from: new Date(val[0]), to: new Date(val[1]) }
              })()}
              onChange={(date) => {
                if (date?.from && date?.to) {
                  table.getColumn('updatedAt')?.setFilterValue([
                    date.from.toISOString(),
                    date.to.toISOString(),
                  ])
                } else {
                  table.getColumn('updatedAt')?.setFilterValue(undefined)
                }
              }}
              className='w-auto lg:w-[240px]'
            />
          </div>
        </div>
      </DataTableToolbar>

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
                      (header.column.columnDef.meta as any)?.thClassName
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
                  className='group/row cursor-pointer'
                  onClick={() => onViewDetails(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        (cell.column.columnDef.meta as any)?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
                  Aucune tournée ne correspond aux filtres.
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
