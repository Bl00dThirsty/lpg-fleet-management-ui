export type ColumnSortState = false | 'asc' | 'desc'

export type AriaSortValue = 'ascending' | 'descending' | 'none'

export function ariaSortValue(sortState: ColumnSortState): AriaSortValue {
  if (sortState === 'asc') return 'ascending'
  if (sortState === 'desc') return 'descending'
  return 'none'
}

export function headerSortAttribute(column: {
  canSort: boolean
  sortState: ColumnSortState
}): AriaSortValue | undefined {
  if (!column.canSort) return undefined
  return ariaSortValue(column.sortState)
}
