import { useQuery } from '@tanstack/react-query'
import { api } from '@lpg/api-client'
import type { ActivityKind, ActivityStatus } from '@lpg/types'
import { ACTIVITY_STATUS_DEFAULTS } from './defaults'
import { resolveStatusMeta } from './status-meta'

export function useActivityStatuses(activity?: ActivityKind) {
  return useQuery({
    queryKey: ['activity-statuses', activity],
    queryFn: async () => {
      try {
        const res = await api.activityStatuses?.list?.()
        if (Array.isArray(res?.data) && res.data.length > 0) {
          return res.data as ActivityStatus[]
        }
      } catch {
        // Fallback to defaults
      }
      return ACTIVITY_STATUS_DEFAULTS
    },
    initialData: ACTIVITY_STATUS_DEFAULTS,
    select: (statuses) => {
      if (!activity) return statuses
      return statuses.filter((s) => s.activity === activity)
    },
  })
}

export function useStatusMeta(
  activity: ActivityKind,
  value: string
): ActivityStatus {
  const { data: statuses } = useActivityStatuses(activity)
  const match = statuses?.find(
    (s) => s.activity === activity && s.status_value === value
  )
  return match ?? resolveStatusMeta(activity, value)
}
