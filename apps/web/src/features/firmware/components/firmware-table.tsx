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
import { Badge, Button } from '@lpg/ui'
import type { FirmwareView } from '../data/firmware'
import { firmwareStatusLabel } from '../data/firmware'

type FirmwareTableProps = {
  data: FirmwareView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (firmware: FirmwareView) => void
}

export function FirmwareTable({
  data,
  search,
  navigate,
  onViewDetails,
}: FirmwareTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<FirmwareView>[]>(
    () => [
      {
        accessorKey: 'version',
        header: 'Version',
        cell: ({ row }: { row: { original: FirmwareView } }) => (
          <Button
            variant='link'
            className='h-auto p-0 font-mono text-xs font-normal'
            onClick={() => onViewDetails(row.original)}
          >
            {row.original.version}
          </Button>
        ),
        meta: { label: 'Version' },
        enableHiding: false,
      },
      {
        accessorKey: 'trim',
        header: 'Affichage',
        cell: ({ row }: { row: { original: FirmwareView } }) => (
          <span className='font-mono text-xs'>{row.original.trim}</span>
        ),
        meta: { label: 'Affichage' },
      },
      {
        accessorKey: 'deviceCount',
        header: 'Appareils',
        cell: ({ row }: { row: { original: FirmwareView } }) => row.original.deviceCount,
        meta: { label: 'Appareils' },
      },
      {
        accessorKey: 'status',
        header: 'État',
        cell: ({ row }: { row: { original: FirmwareView } }) => (
          <Badge variant='outline'>{firmwareStatusLabel(row.original.status)}</Badge>
        ),
        meta: { label: 'État' },
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
        searchPlaceholder='Rechercher une version...'
        searchKey='version'
        filters={[
          {
            columnId: 'status',
            title: 'État',
            options: [
              { label: 'À jour', value: 'CURRENT' },
              { label: 'Mixte', value: 'MIXED' },
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
                  Aucune version de micrologiciel.
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