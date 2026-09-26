export type ListState = 'loading' | 'error' | 'filtered-empty' | 'empty' | 'ready'

export function resolveListState(
  loading: boolean,
  error: boolean,
  dataCount: number,
  hasActiveFilters: boolean,
): ListState {
  if (loading) return 'loading'
  if (error) return 'error'
  if (dataCount === 0) return hasActiveFilters ? 'filtered-empty' : 'empty'
  return 'ready'
}
