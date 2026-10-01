import { useMemo } from 'react'
import { useRoleStore } from '@/store/role-store'
import { followUpFor, type FollowUpContext, type TourActivity } from '../data/scope'

export interface UseFollowUp {
  tours: TourActivity[]
}

export function useFollowUp(userId?: string, orgId?: string): UseFollowUp {
  const role = useRoleStore((s) => s.activeRole)
  const tours = useMemo<TourActivity[]>(
    () => followUpFor({ role, userId, orgId } satisfies FollowUpContext),
    [role, userId, orgId],
  )
  return { tours }
}
