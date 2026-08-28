import { useEffect, useMemo, useState } from 'react'
import {
  type GroupingState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import type { UserView } from '../data/users'
import { getUsersColumns } from './users-columns'

type UsersTableProps = {
  data: UserView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (user: UserView) => void
  onEdit: (user: UserView) => void
}

export function UsersTable({
  data,
  search,
  navigate,
  onViewDetails,
  onEdit,
}: UsersTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [grouping, setGrouping] = useState<GroupingState>([])

  const columns = useMemo(
    () => getUsersColumns({ onViewDetails, onEdit }),
    [onViewDetails, onEdit],
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
      { columnId: 'role', searchKey: 'role', type: 'string' },
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
      grouping,
    },
    enableRowSelection: true,
    enableGrouping: true,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  return (
    <div className='flex flex-1 flex-col gap-4'>
       <div className='flex flex-wrap items-center gap-3'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Rechercher un utilisateur...'
        searchKey='fullName'
        filters={[
          {
            columnId: 'role',
            title: 'Rôle',
            options: [
              { label: 'Super Admin', value: 'SUPERADMIN' },
              { label: 'Administrateur', value: 'ADMIN' },
              { label: 'Superviseur', value: 'SUPERVISOR' },
              { label: 'Intégrateur', value: 'INTEGRATEUR' },
              { label: 'Agent validateur', value: 'AGENT' },
              { label: 'Marketeur', value: 'MARKETEUR' },
              { label: 'Transporteur', value: 'TRANSPORTEUR' },
              { label: 'Livreur', value: 'LIVREUR' },
            ],
          },
          {
            columnId: 'status',
            title: 'Statut',
            options: [
              { label: 'Actif', value: 'ACTIVE' },
              { label: 'Inactif', value: 'INACTIVE' },
            ],
          },
        ]}
      />

      <div className='flex items-center gap-2'>
        <span className='text-xs text-muted-foreground'>Grouper par</span>
        <select
          value={grouping[0] ?? ''}
          onChange={(e) => setGrouping(e.target.value ? [e.target.value] : [])}
          className='h-8 rounded-md border bg-background px-2 text-sm'
        >
          <option value=''>—</option>
          <option value='role'>Rôle</option>
          <option value='orgName'>Organisation</option>
          <option value='status'>Statut</option>
          <option value='mfaStatus'>MFA</option>
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
                  className={cn(
                    'group/row',
                    row.getIsGrouped() && 'bg-muted/40 font-medium',
                  )}
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
                      {cell.getIsGrouped() ? (
                        <button
                          type='button'
                          className='flex items-center gap-2 text-primary'
                          onClick={row.getToggleExpandedHandler()}
                        >
                          {row.getIsExpanded() ? '▼' : '▶'}{' '}
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}{' '}
                          ({row.subRows.length})
                        </button>
                      ) : cell.getIsPlaceholder() ? null : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
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
                  Aucun utilisateur.
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
