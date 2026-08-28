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
import type { DepotView } from '../data/depots'
import { depotStatusLabel } from '../data/depots'
import { CrudRowActions } from '@/components/entity-crud'

type DepotsTableProps = {
  data: DepotView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (depot: DepotView) => void
  onEdit?: (depot: DepotView) => void
  onDelete?: (depot: DepotView) => void
}

export function DepotsTable({
  data,
  search,
  navigate,
  onViewDetails,
  onEdit,
  onDelete,
}: DepotsTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<DepotView>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: { original: DepotView } }) => (
          <span className='font-mono text-xs'>{row.original.id}</span>
        ),
        meta: { label: 'ID' },
        enableHiding: false,
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
        cell: ({ row }: { row: { original: DepotView } }) => (
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
        accessorKey: 'region',
        header: 'Région',
        cell: ({ row }: { row: { original: DepotView } }) => <Badge variant='outline'>{row.original.region}</Badge>,
        meta: { label: 'Région' },
      },
      {
        accessorKey: 'city',
        header: 'Ville',
        cell: ({ row }: { row: { original: DepotView } }) => row.original.city,
        meta: { label: 'Ville' },
      },
      {
        accessorKey: 'sites',
        header: 'Sites',
        cell: ({ row }: { row: { original: DepotView } }) => row.original.sites,
        meta: { label: 'Sites' },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }: { row: { original: DepotView } }) => <Badge variant='outline'>{depotStatusLabel(row.original.status)}</Badge>,
        meta: { label: 'Statut' },
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }: { row: { original: DepotView } }) => (
          <div className='flex justify-end'>
            <CrudRowActions
              resource='orgs'
              itemLabel='ce dépôt'
              onEdit={onEdit ? () => onEdit?.(row.original) : undefined}
              onDelete={onDelete ? () => onDelete?.(row.original) : undefined}
            />
          </div>
        ),
        meta: { label: 'Actions' },
      },
    ],
    [onViewDetails, onEdit, onDelete],
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
        searchPlaceholder='Rechercher un dépôt...'
        searchKey='name'
        filters={[
          {
            columnId: 'status',
            title: 'Statut',
            options: [
              { label: 'Actif', value: 'ACTIVE' },
              { label: 'Suspendu', value: 'SUSPENDED' },
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
                  Aucun dépôt.
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