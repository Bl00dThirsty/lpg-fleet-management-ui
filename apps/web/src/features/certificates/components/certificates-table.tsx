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
  type GroupingState,
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
import type { CertificateStatus, CertificateView } from '../data/certificates'
import { certStatusLabel } from '../data/certificates'

const STATUS_BADGE_CLASS: Record<CertificateStatus, string> = {
  VALID: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  EXPIRING: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  EXPIRED: 'bg-red-500/10 text-red-700 dark:text-red-300',
  MISSING: 'bg-muted text-muted-foreground',
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'Valide', value: 'VALID' },
  { label: 'Expirant', value: 'EXPIRING' },
  { label: 'Expiré', value: 'EXPIRED' },
  { label: 'Manquant', value: 'MISSING' },
]

type CertificatesTableProps = {
  data: CertificateView[]
  search: Record<string, unknown>
  navigate: NavigateFn
  onViewDetails: (certificate: CertificateView) => void
  onEdit?: (certificate: CertificateView) => void
  onDelete?: (certificate: CertificateView) => void
}

export function CertificatesTable({
  data,
  search,
  navigate,
  onViewDetails,
  onEdit,
  onDelete,
}: CertificatesTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [grouping, setGrouping] = useState<GroupingState>([])

  const columns = useMemo<ColumnDef<CertificateView>[]>(
    () => [
      {
        accessorKey: 'licensePlate',
        header: ({ column }: { column: { toggleSorting: (asc?: boolean) => void; getIsSorted: () => boolean | 'asc' | 'desc' } }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 px-2'
          >
            Plaque
          </Button>
        ),
        cell: ({ row }: { row: { original: CertificateView } }) => (
          <Button
            variant='link'
            className='h-auto p-0 font-normal'
            onClick={() => onViewDetails(row.original)}
          >
            <span className='font-mono text-xs'>{row.original.licensePlate}</span>
          </Button>
        ),
        meta: { label: 'Plaque' },
      },
      {
        accessorKey: 'certificateNumber',
        header: 'Certificat n°',
        cell: ({ row }: { row: { original: CertificateView } }) => (
          <span className='font-mono text-xs'>{row.original.certificateNumber}</span>
        ),
        meta: { label: 'Certificat n°' },
      },
      {
        accessorKey: 'vehicleType',
        header: 'Type',
        cell: ({ row }: { row: { original: CertificateView } }) => (
          <Badge variant='outline'>{row.original.vehicleType}</Badge>
        ),
        meta: { label: 'Type' },
        enableGrouping: true,
      },
      {
        accessorKey: 'orgName',
        header: 'Titulaire / Org',
        cell: ({ row }: { row: { original: CertificateView } }) => row.original.orgName,
        meta: { label: 'Titulaire / Org' },
        enableGrouping: true,
      },
      {
        accessorKey: 'issuedAt',
        header: 'Émis le',
        cell: ({ row }: { row: { original: CertificateView } }) => (
          <span className='whitespace-nowrap'>{row.original.issuedAt.slice(0, 10)}</span>
        ),
        meta: { label: 'Émis le' },
      },
      {
        accessorKey: 'expiryAt',
        header: 'Expire le',
        cell: ({ row }: { row: { original: CertificateView } }) => (
          <span className='whitespace-nowrap'>{row.original.expiryAt.slice(0, 10)}</span>
        ),
        meta: { label: 'Expire le' },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }: { row: { original: CertificateView } }) => (
          <Badge
            variant='outline'
            className={STATUS_BADGE_CLASS[row.original.status]}
          >
            {certStatusLabel(row.original.status)}
          </Badge>
        ),
        meta: { label: 'Statut' },
        enableHiding: false,
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>Actions</span>,
        cell: ({ row }: { row: { original: CertificateView } }) => (
          <div className='text-right'>
            <CrudRowActions
              resource='certificates'
              itemLabel='ce certificat'
              onEdit={onEdit ? () => onEdit?.(row.original) : undefined}
              onDelete={onDelete ? () => onDelete?.(row.original) : undefined}
            />
          </div>
        ),
        meta: { label: 'Actions' },
        enableHiding: false,
        enableSorting: false,
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
       grouping,
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
    onGroupingChange: setGrouping,
    getGroupedRowModel: getGroupedRowModel(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  return (
    <div className='flex flex-1 flex-col gap-4'>
       <div className='flex flex-wrap items-center gap-3'>
        <DataTableToolbar
          table={table}
          searchPlaceholder='Rechercher une plaque...'
          searchKey='licensePlate'
          filters={[
            {
              columnId: 'status',
              title: 'Statut',
              options: STATUS_OPTIONS,
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
            <option value='vehicleType'>Type</option>
            <option value='orgName'>Organisation</option>
            <option value='status'>Statut</option>
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
                  Aucun certificat.
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