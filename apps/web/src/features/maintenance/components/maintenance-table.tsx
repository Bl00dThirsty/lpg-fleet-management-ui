import { useEffect, useMemo, useState } from 'react'
import {
  type ColumnDef,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MaintenanceView } from '../data/maintenance'
import {
  itemTypeLabel,
  maintenanceStatusLabel,
} from '../data/maintenance'

type MaintenanceTableProps = {
  data: MaintenanceView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (item: MaintenanceView) => void
}

export function MaintenanceTable({
  data,
  search,
  navigate,
  onViewDetails,
}: MaintenanceTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<MaintenanceView>[]>(
    () => [
      {
        accessorKey: 'itemName',
        header: 'Appareil',
        cell: ({ row }: { row: { original: MaintenanceView } }) => (
          <Button
            variant='link'
            className='h-auto p-0 font-normal'
            onClick={() => onViewDetails(row.original)}
          >
            {row.original.itemName}
          </Button>
        ),
        meta: { label: 'Appareil' },
      },
      {
        accessorKey: 'itemType',
        header: 'Type',
        cell: ({ row }: { row: { original: MaintenanceView } }) => (
          <Badge variant='outline'>{itemTypeLabel(row.original.itemType)}</Badge>
        ),
        meta: { label: 'Type' },
      },
      {
        accessorKey: 'reason',
        header: 'Motif',
        cell: ({ row }: { row: { original: MaintenanceView } }) => row.original.reason,
        meta: { label: 'Motif' },
      },
      {
        accessorKey: 'status',
        header: 'État',
        cell: ({ row }: { row: { original: MaintenanceView } }) => (
          <Badge variant='outline'>
            {maintenanceStatusLabel(row.original.status)}
          </Badge>
        ),
        meta: { label: 'État' },
      },
      {
        accessorKey: 'orgName',
        header: 'Organisation',
        cell: ({ row }: { row: { original: MaintenanceView } }) => row.original.orgName,
        meta: { label: 'Organisation' },
      },
      {
        accessorKey: 'lastSync',
        header: 'Dernière synchro',
        cell: ({ row }: { row: { original: MaintenanceView } }) => (
          <span className='font-mono text-xs'>{row.original.lastSync ?? '—'}</span>
        ),
        meta: { label: 'Dernière synchro' },
      },
    ],
    [onViewDetails],
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
      { columnId: 'itemType', searchKey: 'type', type: 'string' },
      { columnId: 'status', searchKey: 'status', type: 'string' },
    ],
  })

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
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Rechercher un équipement...'
        searchKey='itemName'
        filters={[
          {
            columnId: 'itemType',
            title: 'Type',
            options: [
              { label: 'Appareil', value: 'DEVICE' },
              { label: 'Véhicule', value: 'VEHICLE' },
            ],
          },
          {
            columnId: 'status',
            title: 'État',
            options: [
              { label: 'Critique', value: 'CRITIQUE' },
              { label: 'À traiter', value: 'AOA' },
            ],
          },
        ]}
      />

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
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
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
                        cell.column.columnDef.meta?.tdClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
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
                  Aucun élément de maintenance.
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