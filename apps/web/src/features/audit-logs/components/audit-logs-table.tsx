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
import { DataTableColumnHeader, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { ScrollText, ShieldAlert } from 'lucide-react'
import { auditActionLabels, type AuditAction, type AuditLogView } from '../data/audit-logs'

type AuditLogsTableProps = {
  data: AuditLogView[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

const ACTION_OPTIONS = (Object.keys(auditActionLabels) as AuditAction[]).map((value) => ({
  label: auditActionLabels[value],
  value,
}))

function riskTone(score: number): string {
  if (score >= 60) return 'text-red-600 font-semibold'
  if (score >= 30) return 'text-amber-600 font-medium'
  return 'text-muted-foreground'
}

export function AuditLogsTable({ data, search, navigate }: AuditLogsTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<AuditLogView>[]>(
    () => [
      {
        accessorKey: 'action',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Action' />
        ),
        cell: ({ row }) => {
          const denied = row.original.action === 'PERMISSIONDENIED'
          return (
            <div className='flex min-w-0 items-center gap-2'>
              {denied ? (
                <ShieldAlert className='size-4 shrink-0 text-amber-500' />
              ) : (
                <ScrollText className='size-4 shrink-0 text-primary' />
              )}
              <span className='truncate'>{row.original.actionLabel}</span>
            </div>
          )
        },
        filterFn: (row, _id, value) => row.original.action === value,
        meta: { label: 'Action' },
        enableHiding: false,
      },
      {
        accessorKey: 'actor',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Acteur' />
        ),
        cell: ({ row }) => row.original.actor,
        meta: { label: 'Acteur' },
      },
      {
        id: 'resource',
        accessorFn: (row) => `${row.resourceTable} ${row.resourceId}`.trim(),
        header: 'Ressource',
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>
            {row.original.resourceTable
              ? `${row.original.resourceTable}/${row.original.resourceId || '—'}`
              : '—'}
          </span>
        ),
        meta: { label: 'Ressource' },
        enableSorting: false,
      },
      {
        accessorKey: 'riskScore',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Risque' />
        ),
        cell: ({ row }) => (
          <span className={riskTone(row.original.riskScore)}>
            {row.original.riskScore}
          </span>
        ),
        meta: { label: 'Risque' },
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP',
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>
            {row.original.ipAddress || '—'}
          </span>
        ),
        meta: { label: 'IP' },
        enableSorting: false,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Date' />
        ),
        cell: ({ row }) => (
          <span className='whitespace-nowrap text-xs tabular-nums text-muted-foreground'>
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleString('fr-FR')
              : '—'}
          </span>
        ),
        meta: { label: 'Date' },
      },
    ],
    [],
  )

  const {
    columnFilters,
    pagination,
    onPaginationChange,
    ensurePageInRange,
    onColumnFiltersChange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: false },
    columnFilters: [
      { columnId: 'action', searchKey: 'action', type: 'string' },
    ],
  })

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, pagination, rowSelection, columnVisibility },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange,
    onPaginationChange,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Rechercher un acteur, une action…'
        searchKey='actor'
        filters={[{ columnId: 'action', title: 'Action', options: ACTION_OPTIONS }]}
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.tdClassName,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Aucun événement.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Badge variant='outline'>
          {table.getFilteredRowModel().rows.length} événement(s)
        </Badge>
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}