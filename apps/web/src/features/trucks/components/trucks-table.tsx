import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { truckTenantOptions, type Truck } from '../data/trucks'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { EmptyState } from '@/components/layout/page'
import { resolveListState, type ListState } from '@/components/entity-crud'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getTrucksColumns } from './trucks-columns'

type TrucksTableProps = {
  data: Truck[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (truck: Truck) => void
  onEdit?: (truck: Truck) => void
  onDelete?: (truck: Truck) => void
  listState: ListState
  onRetry: () => void
  deletingId?: string
}

export function TrucksTable({
  data,
  search,
  navigate,
  onViewDetails,
  onEdit,
  onDelete,
  listState,
  onRetry,
  deletingId,
}: TrucksTableProps) {
  const { t } = useTranslation('common')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const columns = useMemo(
    () => getTrucksColumns({ onViewDetails, onEdit, onDelete, deletingId, t }),
    [onViewDetails, onEdit, onDelete, deletingId, t]
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
      { columnId: 'tournee_status', searchKey: 'status', type: 'array' },
      { columnId: 'tenant_name', searchKey: 'company', type: 'array' },
      { columnId: 'region', searchKey: 'region', type: 'array' },
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

  if (listState === 'loading') return <RouteSkeleton />
  if (listState === 'error') {
    return (
      <Alert variant='destructive' role='alert'>
        <AlertTitle>{t('trucks.errorTitle')}</AlertTitle>
        <AlertDescription>
          <p>{t('trucks.errorDescription')}</p>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('trucks.retry')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const hasActiveFilters = Object.values(table.getState().columnFilters).some(
    (value) => {
      if (Array.isArray(value)) return value.length > 0
      return Boolean(value)
    }
  )
  const tableState = resolveListState(
    false,
    false,
    table.getRowModel().rows.length,
    hasActiveFilters
  )
  if (tableState === 'empty' || tableState === 'filtered-empty') {
    return (
      <EmptyState
        title={t(
          tableState === 'empty' ? 'trucks.empty' : 'trucks.filteredEmpty'
        )}
        description={t('trucks.emptyDescription')}
      />
    )
  }

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('trucks.search')}
        searchLabel={t('trucks.searchLabel')}
        resetFilterLabel={t('trucks.resetFilters')}
        searchKey='id'
        filters={[
          {
            columnId: 'tenant_name',
            title: t('trucks.company'),
            options: [...truckTenantOptions],
          },
        ]}
      />

      <div className='overflow-x-auto rounded-md border'>
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
                  className='group/row'
                  onDoubleClick={() => onViewDetails(row.original)}
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
                  {t('trucks.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
      <DataTableBulkActions table={table} />
    </div>
  )
}
