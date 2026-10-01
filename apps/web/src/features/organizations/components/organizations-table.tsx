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
  getGroupedRowModel,
  type SortingState,
  type VisibilityState,
  useReactTable,
  type GroupingState
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
import { DataTablePagination, DataTableColumnHeader, DataTableToolbar } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Organization } from '../data/organizations'
import {
  orgTypeLabel,
  orgStatusLabel,
  orgRegionOptions,
  regionLabel,
} from '../data/organizations'
import { CrudRowActions } from '@/components/entity-crud'

type OrganizationsTableProps = {
  data: Organization[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (org: Organization) => void
  onEdit?: (org: Organization) => void
  onDelete?: (org: Organization) => void
}

export function OrganizationsTable({
  data,
  search,
  navigate,
  onViewDetails,
  onEdit,
  onDelete,
}: OrganizationsTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
   const [grouping, setGrouping] = useState<GroupingState>([])

  const columns = useMemo<ColumnDef<Organization>[]>(
    () => [
      /* {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: { original: Organization } }) => (
          <span className='font-mono text-xs'>{row.original.id}</span>
        ),
        meta: { label: 'ID' },
        enableHiding: false,
        enableSorting: false,
      },*/
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Nom' />,
        cell: ({ row }: { row: { original: Organization } }) => (
          <Button
            variant='link'
            className='h-auto p-0 font-normal'
            onClick={() => onViewDetails(row.original)}
          >
            {row.original.name}
          </Button>
        ),
        meta: { label: 'Nom' },
      },
      {
        accessorKey: 'type',
        sortingFn: (a, b) => orgTypeLabel(a.original.type).localeCompare(orgTypeLabel(b.original.type)),
        header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
        cell: ({ row }: { row: { original: Organization } }) => <Badge variant='outline'>{orgTypeLabel(row.original.type)}</Badge>,
        meta: { label: 'Type' },
      },
      {
        accessorKey: 'status',
        sortingFn: (a, b) => orgStatusLabel(a.original.status).localeCompare(orgStatusLabel(b.original.status)),
        header: ({ column }) => <DataTableColumnHeader column={column} title='Statut' />,
        cell: ({ row }: { row: { original: Organization } }) => <Badge variant='outline'>{orgStatusLabel(row.original.status)}</Badge>,
        meta: { label: 'Statut' },
      },
      {
        accessorKey: 'region',
        sortingFn: (a, b) => regionLabel(a.original.region).localeCompare(regionLabel(b.original.region)),
        header: ({ column }) => <DataTableColumnHeader column={column} title='Région' />,
        cell: ({ row }: { row: { original: Organization } }) => <Badge variant='outline'>{regionLabel(row.original.region)}</Badge>,
        meta: { label: 'Région' },
      },
      {
        accessorKey: 'sites',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Sites' />,
        cell: ({ row }: { row: { original: Organization } }) => row.original.sites,
        meta: { label: 'Sites' },
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }: { row: { original: Organization } }) => (
          <div className='flex justify-end'>
            <CrudRowActions
              resource='orgs'
              itemLabel='cette organisation'
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
      { columnId: 'type', searchKey: 'type', type: 'array' },
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'region', searchKey: 'region', type: 'array' },
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
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    getGroupedRowModel: getGroupedRowModel(),
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
       <div className='flex flex-wrap items-center gap-3'>
          <DataTableToolbar
            table={table}
            searchPlaceholder='Rechercher une organisation...'
            searchKey='name'
            filters={[
              {
                columnId: 'type',
                title: 'Type',
                options: [
                  { label: 'Régulateur', value: 'REGULATEUR' },
                  { label: 'Dépôt', value: 'DEPOT' },
                  { label: 'Marketeur', value: 'MARKETEUR' },
                  { label: 'Transporteur', value: 'TRANSPORTEUR' },
                  { label: 'Client', value: 'CLIENT' },
                ],
              },
              {
                columnId: 'status',
                title: 'Statut',
                options: [
                  { label: 'Non assigné', value: 'UNASSIGNED' },
                  { label: 'Assigné', value: 'ASSIGNED' },
                  { label: 'Actif', value: 'ACTIVE' },
                  { label: 'Vérifié', value: 'VERIFIED' },
                  { label: 'Suspendu', value: 'SUSPENDED' },
                  { label: 'Rejeté', value: 'REJECTED' },
                ],
              },
              {
                columnId: 'region',
                title: 'Région',
                options: orgRegionOptions,
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
            <option value='region'>Région</option>
            <option value='status'>Statut</option>
            <option value='type'>Type</option>
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
                  Aucune organisation.
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