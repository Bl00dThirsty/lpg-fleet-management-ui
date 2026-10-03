import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader, DataTablePagination } from '@/components/data-table'
import { SectionCard } from '@/components/layout/page'
import { formatTm } from '@/features/map/utils/format'
import type { FinanceMarketeurRow } from '../data/finance'

const currency = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} XAF`

/**
 * Sortable per-marketeur breakdown of declared volume, gap and subsidy impact.
 */
export function MarketeurBreakdownTable({ rows }: { rows: FinanceMarketeurRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const columns = useMemo<ColumnDef<FinanceMarketeurRow>[]>(
    () => [
      {
        accessorKey: 'marketeur',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Marketeur' />,
        cell: ({ row }) => (
          <span className='ps-3 font-medium'>{row.original.marketeur}</span>
        ),
      },
      {
        accessorKey: 'declaredVolume',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Déclaré' />
        ),
        cell: ({ row }) => formatTm(row.original.declaredVolume),
      },
      {
        accessorKey: 'volumeGap',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Écart' />,
        cell: ({ row }) => formatTm(row.original.volumeGap),
      },
      {
        accessorKey: 'subsidyImpact',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Impact subvention' />
        ),
        cell: ({ row }) => (
          <span className='tabular-nums'>{currency(row.original.subsidyImpact)}</span>
        ),
      },
      {
        accessorKey: 'reconciliationCount',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Réconciliations' />
        ),
        cell: ({ row }) => row.original.reconciliationCount.toLocaleString('fr-FR'),
        meta: { className: 'text-right tabular-nums' },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    initialState: {
      sorting: [{ id: 'subsidyImpact', desc: true }],
      pagination: { pageSize: 5 },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <SectionCard
      title='Impact par marketeur'
      description='Volume déclaré, écart et impact subvention agrégés par organisation.'
      className='col-span-full'
    >
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.columnDef.meta?.className as string | undefined
                    }
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className='group/row'>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className as string | undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Aucune donnée de réconciliation.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-4' />
    </SectionCard>
  )
}
