import type { ActivityKind, ActivityStatus } from '@lpg/types'
import { ACTIVITY_STATUS_DEFAULTS } from './defaults'

const STATUS_MAP = new Map<string, ActivityStatus>()
for (const s of ACTIVITY_STATUS_DEFAULTS) {
  STATUS_MAP.set(`${s.activity}:${s.status_value}`, s)
}

/**
 * Resolves metadata (label, code, description, tone, sort_order) for an activity status.
 * Fallbacks to sensible defaults if the status is unmapped.
 */
export function resolveStatusMeta(
  activity: ActivityKind,
  value: string
): ActivityStatus {
  const match = STATUS_MAP.get(`${activity}:${value}`)
  if (match) return match

  return {
    activity,
    status_value: value,
    code: value.slice(0, 3).toUpperCase(),
    label: value,
    description: '',
    tone: 'slate',
    sort_order: 99,
    is_active: true,
  }
}
