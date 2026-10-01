import { useMemo, useState } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type GroupingState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table'
import {
  Badge,
  DataTablePagination,
  DataTableToolbar,
} from '@lpg/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SiteStatusBadge } from './site-status-badge'
import { SiteActionsMenu } from './site-actions-menu'
import { cn } from '@/lib/utils'
import { defaultThresholds, REGIONS } from '../data/site-lifecycle'
import { isSupplyOrigin, siteFunctionsLabel } from '../lib/site-functions'
import type { PromotionThresholds } from '../lib/auto-promotion'
import type {
  SiteRole,
  SiteRow,
  TransitionRequest,
} from '../lib/site-status-machine'

const REGION_OPTIONS = REGIONS.map((r) => ({ label: r, value: r }))
const STATUS_VALUES = ['UNASSIGNED', 'ASSIGNED', 'ACTIVE', 'VERIFIED', 'SUSPENDED', 'REJECTED'] as const

export function SitesTable({
  rows,
  role,
  onAction,
  onDelete,
  onOpenMap,
}: {
  rows: SiteRow[]
  role: SiteRole
  onAction: (row: SiteRow, req: TransitionRequest) => void
  onDelete?: (row: SiteRow) => void
  onOpenMap?: (row: SiteRow) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const thresholds: PromotionThresholds = defaultThresholds

  const columns = useMemo<ColumnDef<SiteRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Site',
        cell: ({ row }) => (
          <div className='min-w-48'>
            <p className='font-medium'>{row.original.name}</p>
            <p className='font-mono text-xs text-muted-foreground'>{row.original.id}</p>
          </div>
        ),
        meta: { label: 'Site' },
        enableHiding: false,
      },
      {
        accessorKey: 'region',
        header: 'Région',
        cell: ({ row }) => <Badge variant='outline'>{row.original.region}</Badge>,
        meta: { label: 'Région' },
      },
      {
        accessorKey: 'delivery_count',
        header: 'Livraisons',
        cell: ({ row }) => row.original.delivery_count,
        meta: { label: 'Livraisons' },
      },
      {
        accessorKey: 'geo_confidence_score',
        header: 'Confiance',
        cell: ({ row }) => `${row.original.geo_confidence_score}/100`,
        meta: { label: 'Confiance' },
      },
      {
        id: 'functions',
        accessorFn: (row) => siteFunctionsLabel(row),
        header: 'Fonctions',
        cell: ({ row }) => {
          const r = row.original
          const supply = isSupplyOrigin(r)
          const label = siteFunctionsLabel(r)
          return label === '—' ? (
            <span className='text-muted-foreground'>—</span>
          ) : supply ? (
            <Badge variant='default' className='font-mono text-xs'>
              {label}
            </Badge>
          ) : (
            <Badge variant='outline' className='font-mono text-xs'>
              {label}
            </Badge>
          )
        },
        meta: { label: 'Fonctions' },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => (
          <SiteStatusBadge row={row.original} thresholds={thresholds} />
        ),
        meta: { label: 'Statut' },
        enableHiding: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <SiteActionsMenu
            row={row.original}
            role={role}
            onAction={(req) => onAction(row.original, req)}
            onDelete={onDelete ? () => onDelete(row.original) : undefined}
            onOpenMap={onOpenMap ? () => onOpenMap(row.original) : undefined}
          />
        ),
        meta: { label: 'Actions' },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [role, onAction, onDelete, thresholds, onOpenMap],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination, columnFilters, grouping, expanded, columnVisibility },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    enableGrouping: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <DataTableToolbar
          table={table}
          searchPlaceholder='Rechercher un site...'
          searchKey='name'
          filters={[
            { columnId: 'region', title: 'Région', options: REGION_OPTIONS },
            {
              columnId: 'status',
              title: 'Statut',
              options: STATUS_VALUES.map((v) => ({ label: v, value: v })),
            },
          ]}
        />
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>Grouper par</span>
          <select
            value={grouping[0] ?? ''}
            onChange={(e) =>
              setGrouping(e.target.value ? [e.target.value] : [])
            }
            className='h-8 rounded-md border bg-background px-2 text-sm'
          >
            <option value=''>—</option>
            <option value='region'>Région</option>
            <option value='functions'>Fonction</option>
            <option value='status'>Statut</option>
          </select>
        </div>
      </div>

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(header.column.columnDef.meta?.className)}
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(row.getIsGrouped() && 'bg-muted/40 font-medium')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Aucun site.
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
