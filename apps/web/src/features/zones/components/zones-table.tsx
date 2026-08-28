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
import { CrudRowActions } from '@/components/entity-crud'
import type { ZoneView } from '../data/zones'
import { getZoneOptions } from '../data/zones'

type ZonesTableProps = {
  data: ZoneView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (zone: ZoneView) => void
  onViewMap: (zone: ZoneView) => void
  onEdit?: (zone: ZoneView) => void
  onDelete?: (zone: ZoneView) => void | Promise<void>
  canDelete?: boolean
}

export function ZonesTable({
  data,
  search,
  navigate,
  onViewDetails,
  onViewMap,
  onEdit,
  onDelete,
  canDelete = false,
}: ZonesTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<ZoneView>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }: { row: { original: ZoneView } }) => (
          <Badge variant='outline' className='font-mono'>
            {row.original.code}
          </Badge>
        ),
        meta: { label: 'Code' },
      },
      {
        accessorKey: 'name',
        header: ({ column }: { column: { toggleSorting: (asc?: boolean) => void; getIsSorted: () => boolean | 'asc' | 'desc' } }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 px-2'
          >
            Nom
          </Button>
        ),
        cell: ({ row }: { row: { original: ZoneView } }) => (
          <Button
            variant='link'
            className='h-auto p-0 font-normal'
            onClick={() => onViewDetails(row.original)}
          >
            {row.original.name}
          </Button>
        ),
      },
      {
        accessorKey: 'siteCount',
        header: 'Sites',
        cell: ({ row }: { row: { original: ZoneView } }) => row.original.siteCount,
        meta: { label: 'Sites' },
      },
      {
        accessorKey: 'clientSiteCount',
        header: 'Sites clients',
        cell: ({ row }: { row: { original: ZoneView } }) => row.original.clientSiteCount,
        meta: { label: 'Sites clients' },
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }: { row: { original: ZoneView } }) => (
          <div className='flex justify-end'>
            <CrudRowActions
              resource='zones'
              itemLabel='cette zone'
              onEdit={onEdit ? () => onEdit(row.original) : undefined}
              onDelete={canDelete && onDelete ? () => onDelete(row.original) : undefined}
              extra={[{ label: 'Voir sur la carte', onSelect: () => onViewMap(row.original) }]}
            />
          </div>
        ),
        meta: { label: 'Actions' },
      },
    ],
    [canDelete, onDelete, onEdit, onViewDetails, onViewMap],
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
      { columnId: 'name', searchKey: 'name', type: 'string' },
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
        searchPlaceholder='Rechercher une zone...'
        searchKey='name'
        filters={[
          {
            columnId: 'code',
            title: 'Région',
            options: getZoneOptions(),
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
                  Aucune zone.
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
