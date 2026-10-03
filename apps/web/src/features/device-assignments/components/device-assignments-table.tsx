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
import type { DeviceAssignmentView } from '../data/device-assignments'
import { deviceStatusLabel, deviceTypeLabel } from '../data/device-assignments'

type DeviceAssignmentsTableProps = {
  data: DeviceAssignmentView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (assignment: DeviceAssignmentView) => void
}

export function DeviceAssignmentsTable({
  data,
  search,
  navigate,
  onViewDetails,
}: DeviceAssignmentsTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<DeviceAssignmentView>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: { original: DeviceAssignmentView } }) => (
          <span className='font-mono text-xs'>{row.original.id}</span>
        ),
        meta: { label: 'ID' },
        enableHiding: false,
      },
      {
        accessorKey: 'serialNumber',
        header: ({ column }: { column: { toggleSorting: (asc?: boolean) => void; getIsSorted: () => boolean | 'asc' | 'desc' } }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 px-2'
          >
            Appareil
          </Button>
        ),
        cell: ({ row }: { row: { original: DeviceAssignmentView } }) => (
          <Button
            variant='link'
            className='h-auto p-0 font-normal'
            onClick={() => onViewDetails(row.original)}
          >
            {row.original.serialNumber}
          </Button>
        ),
      },
      {
        accessorKey: 'deviceType',
        header: 'Type',
        cell: ({ row }: { row: { original: DeviceAssignmentView } }) => (
          <Badge>{deviceTypeLabel(row.original.deviceType)}</Badge>
        ),
        meta: { label: 'Type' },
      },
      {
        accessorKey: 'assigneeName',
        header: 'Affecté à',
        cell: ({ row }: { row: { original: DeviceAssignmentView } }) => (
          <span className='font-medium'>{row.original.assigneeName}</span>
        ),
        meta: { label: 'Affecté à' },
      },
      {
        accessorKey: 'status',
        header: 'État',
        cell: ({ row }: { row: { original: DeviceAssignmentView } }) => (
          <Badge variant='outline'>{deviceStatusLabel(row.original.status)}</Badge>
        ),
        meta: { label: 'État' },
      },
      {
        accessorKey: 'batteryLevel',
        header: 'Batterie',
        cell: ({ row }: { row: { original: DeviceAssignmentView } }) => {
          const level = row.original.batteryLevel
          if (level === null) return <span className='text-muted-foreground'>—</span>
          return (
            <span className={cn(row.original.batteryCritical && 'font-semibold text-destructive')}>
              {level}%
            </span>
          )
        },
        meta: { label: 'Batterie' },
      },
      {
        accessorKey: 'lastSync',
        header: 'Sync',
        cell: ({ row }: { row: { original: DeviceAssignmentView } }) => (
          <span className='text-muted-foreground'>{row.original.lastSync ?? '—'}</span>
        ),
        meta: { label: 'Sync' },
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
      { columnId: 'deviceType', searchKey: 'type', type: 'string' },
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
        filters={[
          {
            columnId: 'deviceType',
            title: 'Type',
            options: [
              { label: 'GPS', value: 'GPS' },
              { label: 'PDA', value: 'PDA' },
              { label: 'Lecteur RFID', value: 'RFIDREADER' },
            ],
          },
          {
            columnId: 'status',
            title: 'État',
            options: [
              { label: 'Assigné', value: 'ASSIGNED' },
              { label: 'En mission', value: 'INMISSION' },
              { label: 'Hors ligne', value: 'OFFLINE' },
              { label: 'Sync en attente', value: 'PENDINGSYNC' },
              { label: 'Synchronisé', value: 'SYNCED' },
              { label: 'Maintenance', value: 'MAINTENANCE' },
              { label: 'Déployé', value: 'DEPLOYED' },
              { label: 'Retiré', value: 'REMOVED' },
              { label: 'Perdu', value: 'LOST' },
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
                  Aucune affectation d&apos;appareil.
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