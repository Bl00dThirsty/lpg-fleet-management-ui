import type { ColumnDef } from '@tanstack/react-table'
import {
  type Row,
  type RowData,
  flexRender,
  Table as TanstackTable,
} from '@tanstack/react-table'
import { ChevronRightIcon, ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { NavigateFn } from '@/hooks/use-table-url-state'
import {
  type EntityTableOptions,
  type ToolbarFilter,
  useEntityTable,
} from './use-entity-table'

export type { NavigateFn, ToolbarFilter, EntityTableOptions }

export type EntityTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  search: Record<string, unknown>
  navigate: NavigateFn
  searchPlaceholder?: string
  searchKey?: string
  emptyLabel?: string
  toolbarFilters?: ToolbarFilter[]
  /** Optional classes for the outer wrapper. */
  className?: string
  options?: EntityTableOptions<TData>
  /** Allow bulk-actions slot to consume the table instance. */
  renderToolbarExtras?: (table: TanstackTable<TData>) => React.ReactNode
  /** Render the group row's label. */
  renderGroupLabel?: (groupValue: unknown) => React.ReactNode
  /** Optional row double-click — opens details in most features. */
  onRowDoubleClick?: (row: TData) => void
}

export function EntityTable<TData>({
  data,
  columns,
  search,
  navigate,
  searchPlaceholder,
  searchKey,
  emptyLabel = 'Aucun résultat.',
  toolbarFilters = [],
  className,
  options,
  renderToolbarExtras,
  renderGroupLabel,
  onRowDoubleClick,
}: EntityTableProps<TData>) {
  const { table } = useEntityTable<TData>({
    data,
    columns,
    search,
    navigate,
    options,
  })

  const isGrouped = table.getState().grouping.length > 0

  return (
    <div className={cn('flex flex-1 flex-col gap-4', className)}>
      <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
        <DataTableToolbar
          table={table}
          searchPlaceholder={searchPlaceholder}
          searchKey={searchKey}
          filters={toolbarFilters}
        />
        {renderToolbarExtras?.(table)}
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
              table.getRowModel().rows.map((row) => {
                if (row.getIsGrouped()) {
                  return (
                    <GroupRow
                      key={row.id}
                      row={row}
                      colCount={columns.length}
                      renderGroupLabel={renderGroupLabel}
                      onRowDoubleClick={onRowDoubleClick}
                    />
                  )
                }
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className='group/row'
                    onDoubleClick={
                      onRowDoubleClick
                        ? () => onRowDoubleClick(row.original as TData)
                        : undefined
                    }
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
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
      {/* isGrouped left unused in render — group rows are rendered inside the body. */}
      <span hidden data-entity-table-grouping={String(isGrouped)} />
    </div>
  )
}

type GroupRowProps<TData extends RowData> = {
  row: Row<TData>
  colCount: number
  renderGroupLabel?: (groupValue: unknown) => React.ReactNode
  onRowDoubleClick?: (row: TData) => void
}

function GroupRow<TData extends RowData>({
  row,
  colCount,
  renderGroupLabel,
}: GroupRowProps<TData>) {
  const groupValue = row.groupingValue
  const expanded = row.getIsExpanded()
  return (
    <TableRow className='group/row bg-muted/40'>
      <TableCell colSpan={colCount} className='py-1.5'>
        <Button
          variant='ghost'
          size='sm'
          onClick={row.getToggleExpandedHandler()}
          className='-ml-2 h-8 gap-1.5'
        >
          {expanded ? (
            <ChevronDownIcon className='size-4' />
          ) : (
            <ChevronRightIcon className='size-4' />
          )}
          <span className='font-semibold'>
            {renderGroupLabel ? renderGroupLabel(groupValue) : String(groupValue ?? '—')}
          </span>
          <span className='text-xs text-muted-foreground'>
            ({row.subRows.length} ligne{row.subRows.length > 1 ? 's' : ''})
          </span>
        </Button>
      </TableCell>
    </TableRow>
  )
}
