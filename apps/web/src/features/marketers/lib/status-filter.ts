export type MarketerRouteStatus = 'active' | 'inactive'
export type MarketerFilterValue = 'true' | 'false'

export function toMarketerStatusFilterValue(
  value: unknown,
): MarketerFilterValue | undefined {
  if (value === 'active') return 'true'
  if (value === 'inactive') return 'false'
  return undefined
}

export function fromMarketerStatusFilterValue(
  value: unknown,
): MarketerRouteStatus | undefined {
  if (value === 'true') return 'active'
  if (value === 'false') return 'inactive'
  return undefined
}
