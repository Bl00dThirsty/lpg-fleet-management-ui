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
  type GroupingState,
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
import {
  getRegionOptions,
  getTenantOptions,
  getTypeOptions,
  type VehicleView,
} from '../data/vehicles'
import { getVehiclesColumns } from './vehicles-columns'
import { DataTableBulkActions as VehiclesBulkActions } from './data-table-bulk-actions'

type VehiclesTableProps = {
  data: VehicleView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (vehicle: VehicleView) => void
  onOpenActiveTour: (vehicleId: string) => void
  onEdit?: (vehicle: VehicleView) => void
  onDelete?: (vehicle: VehicleView) => void
}

export function VehiclesTable({
  data,
  search,
  navigate,
  onViewDetails,
  onOpenActiveTour,
  onEdit,
  onDelete,
}: VehiclesTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState({})
  const columns = useMemo(
    () => getVehiclesColumns({ onViewDetails, onOpenActiveTour, onEdit, onDelete }),
    [onViewDetails, onOpenActiveTour, onEdit, onDelete]
  )

  const tenantOptions = useMemo(() => getTenantOptions(), [])
  const regionOptions = useMemo(() => getRegionOptions(), [])
  const typeOptions = useMemo(() => getTypeOptions(), [])

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
      { columnId: 'license_plate', searchKey: 'q', type: 'string' },
      { columnId: 'tenant_name', searchKey: 'company', type: 'array' },
      { columnId: 'region', searchKey: 'region', type: 'array' },
      { columnId: 'type', searchKey: 'type', type: 'array' },
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
      grouping,
      expanded,
    },
    enableRowSelection: true,
    enableGrouping: true,
    onPaginationChange,
    onColumnFiltersChange,
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
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

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
          searchPlaceholder='Rechercher plaque, entreprise, chauffeur...'
          searchKey='license_plate'
          filters={[
            {
              columnId: 'tenant_name',
              title: 'Entreprise',
              options: [...tenantOptions],
            },
            {
              columnId: 'region',
              title: 'Region',
              options: [...regionOptions],
            },
            {
              columnId: 'type',
              title: 'Type',
              options: [...typeOptions],
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
            <option value='status'>Statut</option>
            <option value='type'>Type</option>
            <option value='region'>Region</option>
            <option value='tenant_name'>Entreprise</option>
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
                  Aucun vehicule ne correspond aux filtres.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
      <VehiclesBulkActions table={table} />
    </div>
  )
}