import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import type { Mock } from 'vitest'
import type { ColumnDef } from '@tanstack/react-table'
import { renderHook } from 'vitest-browser-react'
import type { NavigateFn } from '@/hooks/use-table-url-state'
import { useEntityTable } from './use-entity-table'

interface Row {
  id: string
  name: string
}

function columnsFn(onViewDetails?: (row: Row) => void): ColumnDef<Row>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      enableSorting: true,
      cell: ({ row }) => <span>{row.original.id}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Nom',
      enableSorting: true,
      cell: ({ row }) =>
        onViewDetails ? (
          <button onClick={() => onViewDetails(row.original)}>{row.original.name}</button>
        ) : (
          <span>{row.original.name}</span>
        ),
    },
  ]
}

const FIXTURES: Row[] = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Bravo' },
  { id: 'c', name: 'Charlie' },
]

function lastNavigate(navigate: Mock<NavigateFn>) {
  const calls = navigate.mock.calls
  return calls[calls.length - 1]?.[0] as
    | { search: unknown; replace?: boolean }
    | undefined
}

describe('useEntityTable', () => {
  it('returns a table instance with the provided columns and data', async () => {
    const navigate = vi.fn() as Mock<NavigateFn>
    const { result } = await renderHook(() =>
      useEntityTable<Row>({
        data: FIXTURES,
        columns: columnsFn(),
        search: {},
        navigate,
      }),
    )

    expect(result.current.table.getRowCount()).toBe(3)
    expect(result.current.table.getAllColumns().map((c) => c.id)).toEqual([
      'id',
      'name',
    ])
    expect(result.current.sorting).toEqual([])
    expect(result.current.rowSelection).toEqual({})
  })

  it('defaults to pageSize 10 when not specified', async () => {
    const navigate = vi.fn() as Mock<NavigateFn>
    const { result } = await renderHook(() =>
      useEntityTable<Row>({
        data: FIXTURES,
        columns: columnsFn(),
        search: {},
        navigate,
      }),
    )

    expect(result.current.table.getState().pagination.pageSize).toBe(10)
    expect(result.current.table.getState().pagination.pageIndex).toBe(0)
  })

  it('honours a custom pageSize option', async () => {
    const navigate = vi.fn() as Mock<NavigateFn>
    const { result } = await renderHook(() =>
      useEntityTable<Row>({
        data: FIXTURES,
        columns: columnsFn(),
        search: {},
        navigate,
        options: { pageSize: 25 },
      }),
    )

    expect(result.current.table.getState().pagination.pageSize).toBe(25)
  })

  it('derives pagination from the current search params', async () => {
    const navigate = vi.fn() as Mock<NavigateFn>
    const { result } = await renderHook(() =>
      useEntityTable<Row>({
        data: FIXTURES,
        columns: columnsFn(),
        search: { page: 2, pageSize: 5 },
        navigate,
        options: { pageSize: 5 },
      }),
    )

    expect(result.current.table.getState().pagination.pageIndex).toBe(1)
    expect(result.current.table.getState().pagination.pageSize).toBe(5)
  })

  it('column sorting updates the in-memory sort state', async () => {
    const navigate = vi.fn() as Mock<NavigateFn>
    const { result } = await renderHook(() =>
      useEntityTable<Row>({
        data: FIXTURES,
        columns: columnsFn(),
        search: {},
        navigate,
      }),
    )

    act(() => {
      result.current.setSorting([{ id: 'name', desc: true }])
    })

    expect(result.current.sorting.length).toBeGreaterThan(0)
    expect(result.current.sorting[0]).toMatchObject({ id: 'name', desc: true })
  })

  it('column visibility state is independent per render', async () => {
    const navigate = vi.fn() as Mock<NavigateFn>
    const { result } = await renderHook(() =>
      useEntityTable<Row>({
        data: FIXTURES,
        columns: columnsFn(),
        search: {},
        navigate,
      }),
    )

    act(() => {
      result.current.setColumnVisibility({ id: false })
    })
    expect(result.current.columnVisibility).toEqual({ id: false })
  })

  it('wires column filters through useTableUrlState', async () => {
    const navigate = vi.fn() as Mock<NavigateFn>
    const cols: ColumnDef<Row & { role: string }>[] = [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      { accessorKey: 'name', header: 'Nom', enableSorting: true },
      { accessorKey: 'role', header: 'Role', enableSorting: true },
    ]
    const { result } = await renderHook(() =>
      useEntityTable<Row & { role: string }>({
        data: (FIXTURES as Array<Row & { role: string }>),
        columns: cols,
        search: { role: 'ADMIN' },
        navigate,
        options: {
          urlState: {
            columnFilters: [{ columnId: 'role', searchKey: 'role', type: 'string' }],
          },
        },
      }),
    )

    expect(result.current.table.getState().columnFilters).toEqual([
      { id: 'role', value: 'ADMIN' },
    ])
  })

  it('navigates with updated search when a column filter changes', async () => {
    const navigate = vi.fn() as Mock<NavigateFn>
    const cols: ColumnDef<Row & { role: string }>[] = [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      { accessorKey: 'name', header: 'Nom', enableSorting: true },
      { accessorKey: 'role', header: 'Role', enableSorting: true },
    ]
    const { result } = await renderHook(() =>
      useEntityTable<Row & { role: string }>({
        data: (FIXTURES as Array<Row & { role: string }>),
        columns: cols,
        search: {},
        navigate,
        options: {
          urlState: {
            columnFilters: [{ columnId: 'role', searchKey: 'role', type: 'string' }],
          },
        },
      }),
    )

    act(() => {
      result.current.table.getColumn('role')?.setFilterValue('SUPERADMIN')
    })

    const last = lastNavigate(navigate)
    expect(last).toBeDefined()
    const s = last?.search
    if (typeof s === 'function') {
      const next = (s as (prev: Record<string, unknown>) => Record<string, unknown>)({})
      expect(next.role).toBe('SUPERADMIN')
    } else {
      expect((s as Record<string, unknown>).role).toBe('SUPERADMIN')
    }
  })

  it('respects defaultSort as the initial sorting state', async () => {
    const navigate = vi.fn() as Mock<NavigateFn>
    const { result } = await renderHook(() =>
      useEntityTable<Row>({
        data: FIXTURES,
        columns: columnsFn(),
        search: {},
        navigate,
        options: { defaultSort: [{ id: 'name', desc: false }] },
      }),
    )
    expect(result.current.sorting).toEqual([{ id: 'name', desc: false }])
    const rows = result.current.table.getSortedRowModel().rows
    expect(rows.map((r) => r.original.name)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
    ])
  })

  it('groups rows when enableGrouping + onGroupingChange wiring is on', async () => {
    type GroupedRow = { id: string; name: string; group: string }
    const data: GroupedRow[] = [
      { id: '1', name: 'A1', group: 'X' },
      { id: '2', name: 'A2', group: 'X' },
      { id: '3', name: 'B1', group: 'Y' },
    ]
    const groupedCols: ColumnDef<GroupedRow>[] = [
      { accessorKey: 'name', header: 'Nom', cell: ({ row }) => row.original.name },
      {
        accessorKey: 'group',
        header: 'Groupe',
        enableGrouping: true,
        cell: ({ row }) => row.original.group,
      },
    ]
    const navigate = vi.fn() as Mock<NavigateFn>
    const { result } = await renderHook(() =>
      useEntityTable<GroupedRow>({
        data,
        columns: groupedCols,
        search: {},
        navigate,
        options: { enableGrouping: true },
      }),
    )
    act(() => {
      result.current.table.setGrouping(['group'])
    })
    // After grouping, the row model has 2 group rows (one per group).
    const groups = result.current.table.getRowModel().rows.filter((r) => r.getIsGrouped())
    expect(groups.length).toBe(2)
  })
})

