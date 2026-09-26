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
import { type Organization } from '@lpg/types'
import { getTransportersColumns } from './transporters-columns'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { EmptyState } from '@/components/layout/page'
import { resolveListState, type ListState } from '@/components/entity-crud'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type TransportersTableProps = {
  data: Organization[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (transporter: Organization) => void
  onEdit?: (transporter: Organization) => void
  onDelete?: (transporter: Organization) => void
  listState: ListState
  onRetry: () => void
  deletingId?: string
}

export function TransportersTable({
  data,
  search,
  navigate,
  onViewDetails,
  onEdit,
  onDelete,
  listState,
  onRetry,
  deletingId,
}: TransportersTableProps) {
  const { t } = useTranslation('common')
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const columns = useMemo(
    () =>
      getTransportersColumns({
        onViewDetails,
        onEdit,
        onDelete,
        deletingId,
        t,
      }),
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
      { columnId: 'name', searchKey: 'q', type: 'string' },
      { columnId: 'is_active', searchKey: 'is_active', type: 'array' },
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
        <AlertTitle>{t('transporters.errorTitle')}</AlertTitle>
        <AlertDescription>
          <p>{t('transporters.errorDescription')}</p>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('transporters.retry')}
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
          tableState === 'empty'
            ? 'transporters.empty'
            : 'transporters.filteredEmpty'
        )}
        description={t('transporters.emptyDescription')}
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
        searchPlaceholder={t('transporters.search')}
        searchLabel={t('transporters.searchLabel')}
        resetFilterLabel={t('transporters.resetFilters')}
        searchKey='name'
        filters={[
          {
            columnId: 'is_active',
            title: t('transporters.status'),

            options: [
              { label: t('transporters.active'), value: 'true' },
              { label: t('transporters.inactive'), value: 'false' },
            ] as { label: string; value: string }[],
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
                  {t('transporters.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
