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
import { CrudRowActions } from '@/components/entity-crud/crud-row-actions'
import type { LivreurView } from '../data/livreurs'
import {
  livreurStatusLabel,
  mfaStatusLabel,
} from '../data/livreurs'

type LivreursTableProps = {
  data: LivreurView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (livreur: LivreurView) => void
  onEdit: (livreur: LivreurView) => void
  onDelete: (livreur: LivreurView) => void
  onToggleStatus: (livreur: LivreurView) => void
  canWrite: boolean
  canManage: boolean
}

export function LivreursTable({
  data,
  search,
  navigate,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
  canWrite,
  canManage,
}: LivreursTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<LivreurView>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: ({ column }: { column: { toggleSorting: (asc?: boolean) => void; getIsSorted: () => boolean | 'asc' | 'desc' } }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 px-2'
          >
            Nom
          </Button>
        ),
        cell: ({ row }: { row: { original: LivreurView } }) => (
          <Button
            variant='link'
            className='h-auto p-0 font-normal'
            onClick={() => onViewDetails(row.original)}
          >
            {row.original.fullName}
          </Button>
        ),
        meta: { label: 'Nom' },
      },
      {
        accessorKey: 'email',
        header: 'E-mail',
        cell: ({ row }: { row: { original: LivreurView } }) => (
          <span className='text-sm'>{row.original.email}</span>
        ),
        meta: { label: 'E-mail' },
      },
      {
        accessorKey: 'orgName',
        header: 'Organisation',
        cell: ({ row }: { row: { original: LivreurView } }) => row.original.orgName,
        meta: { label: 'Organisation' },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }: { row: { original: LivreurView } }) => (
          <Badge variant='outline'>{livreurStatusLabel(row.original.status)}</Badge>
        ),
        meta: { label: 'Statut' },
      },
      {
        accessorKey: 'mfaStatus',
        header: 'MFA',
        cell: ({ row }: { row: { original: LivreurView } }) => (
          <span className='text-sm'>{mfaStatusLabel(row.original.mfaStatus)}</span>
        ),
        meta: { label: 'MFA' },
      },
      {
        accessorKey: 'lastLogin',
        header: 'Dernière connexion',
        cell: ({ row }: { row: { original: LivreurView } }) => (
          <span className='text-sm'>{row.original.lastLogin}</span>
        ),
        meta: { label: 'Dernière connexion' },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }: { row: { original: LivreurView } }) => (
          <CrudRowActions
            resource='livreurs'
            itemLabel={`le livreur ${row.original.email}`}
            onEdit={canWrite ? () => onEdit(row.original) : undefined}
            onDelete={canManage ? () => onDelete(row.original) : undefined}
            extra={canWrite ? [{
              label: row.original.status === 'ACTIVE' ? 'Désactiver' : 'Activer',
              onSelect: () => onToggleStatus(row.original),
            }] : undefined}
          />
        ),
        meta: { label: 'Actions' },
      },
    ],
    [canManage, canWrite, onEdit, onDelete, onToggleStatus, onViewDetails],
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
        searchPlaceholder='Rechercher un livreur...'
        searchKey='fullName'
        filters={[
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
                  Aucun livreur.
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
