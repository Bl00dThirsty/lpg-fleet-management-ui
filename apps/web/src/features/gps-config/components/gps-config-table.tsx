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
import type { GpsConfigView } from '../data/gps-config'
import { deviceStatusLabel } from '../data/gps-config'

type GpsConfigTableProps = {
  data: GpsConfigView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (config: GpsConfigView) => void
}

export function GpsConfigTable({
  data,
  search,
  navigate,
  onViewDetails,
}: GpsConfigTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<GpsConfigView>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: 'Appareil',
        cell: ({ row }: { row: { original: GpsConfigView } }) => (
          <Button
            variant='link'
            className='h-auto p-0 font-normal'
            onClick={() => onViewDetails(row.original)}
          >
            {row.original.serialNumber}
          </Button>
        ),
        meta: { label: 'Appareil' },
      },
      {
        accessorKey: 'id',
        header: 'N° série',
        cell: ({ row }: { row: { original: GpsConfigView } }) => (
          <span className='font-mono text-xs'>{row.original.serialNumber}</span>
        ),
        meta: { label: 'N° série' },
        enableHiding: false,
      },
      {
        accessorKey: 'vehiclePlate',
        header: 'Véhicule',
        cell: ({ row }: { row: { original: GpsConfigView } }) => (
          <span className='font-mono text-xs'>{row.original.vehiclePlate}</span>
        ),
        meta: { label: 'Véhicule' },
      },
      {
        accessorKey: 'updateIntervalSec',
        header: 'Intervalle (s)',
        cell: ({ row }: { row: { original: GpsConfigView } }) =>
          row.original.updateIntervalSec === null ? '—' : row.original.updateIntervalSec,
        meta: { label: 'Intervalle (s)' },
      },
      {
        accessorKey: 'alertSpeedKmh',
        header: 'Vitesse alerte',
        cell: ({ row }: { row: { original: GpsConfigView } }) =>
          row.original.alertSpeedKmh === null ? '—' : `${row.original.alertSpeedKmh} km/h`,
        meta: { label: 'Vitesse alerte' },
      },
      {
        accessorKey: 'geofenceRadiusM',
        header: 'Rayon geofence',
        cell: ({ row }: { row: { original: GpsConfigView } }) =>
          row.original.geofenceRadiusM === null ? '—' : `${row.original.geofenceRadiusM} m`,
        meta: { label: 'Rayon geofence' },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }: { row: { original: GpsConfigView } }) => (
          <Badge variant='outline'>{deviceStatusLabel(row.original.status)}</Badge>
        ),
        meta: { label: 'Statut' },
      },
      {
        accessorKey: 'lastSync',
        header: 'Dernière sync',
        cell: ({ row }: { row: { original: GpsConfigView } }) => (
          <span className='font-mono text-xs'>
            {row.original.lastSync === '—' ? '—' : new Date(row.original.lastSync).toLocaleString()}
          </span>
        ),
        meta: { label: 'Dernière sync' },
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
        searchPlaceholder='Rechercher un appareil...'
        searchKey='serialNumber'
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
                  Aucun appareil GPS.
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