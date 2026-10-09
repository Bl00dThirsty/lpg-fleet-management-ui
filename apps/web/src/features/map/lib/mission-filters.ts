import type { DeliveryTour, TourneeStatus } from '@lpg/types'
import type { AuthUser } from '@lpg/api-client'
import { getScope } from '@/features/scope/scope'
export interface MissionFilters {
  from: string
  to: string
  statuses: TourneeStatus[]
}
export const EMPTY_MISSION_FILTERS: MissionFilters = {
  from: '',
  to: '',
  statuses: [],
}
const dayFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Africa/Douala',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
export function missionDay(tour: DeliveryTour): string | null {
  const timestamp = tour.scheduled_at || tour.started_at
  if (!timestamp || !Number.isFinite(Date.parse(timestamp))) return null
  return dayFormat.format(new Date(timestamp))
}
export function canSeeMapMission(
  tour: DeliveryTour,
  user: AuthUser | null
): boolean {
  if (!user || tour.deleted_at || tour.mission_kind === 'PICKUP') return false
  const scope = getScope(user)
  if (scope.view === 'org' && user.org_type === 'REGULATEUR') return true
  if (scope.view === 'transporter')
    return !!user.org_id && tour.transporter_org_id === user.org_id
  if (scope.view === 'livreur') return tour.livreur_user_id === user.id
  if (tour.created_by === user.id) return true
  if (scope.view === 'agent') {
    return scope.siteIds.some(
      (id) =>
        id === tour.source_site_id ||
        id === tour.destination_site_id ||
        tour.checkpoints?.some(
          (cp) => cp.site_id === id || cp.client_site_id === id
        )
    )
  }
  if (scope.view === 'site') {
    if (tour.marketeur_org_id !== user.org_id) return false
    if (!scope.siteIds.length) return true
    return scope.siteIds.some(
      (id) =>
        id === tour.source_site_id ||
        id === tour.destination_site_id ||
        tour.checkpoints?.some(
          (cp) => cp.site_id === id || cp.client_site_id === id
        )
    )
  }
  return false
}
export function matchesMissionFilters(
  tour: DeliveryTour,
  marketerId: string | null,
  filters: MissionFilters
): boolean {
  if (tour.deleted_at || tour.mission_kind === 'PICKUP') return false
  if (marketerId && tour.marketeur_org_id !== marketerId) return false
  if (filters.from && filters.to && filters.from > filters.to) return false
  if (filters.statuses.length && !filters.statuses.includes(tour.status))
    return false
  const day = missionDay(tour)
  if ((filters.from || filters.to) && !day) return false
  return (
    (!filters.from || day! >= filters.from) &&
    (!filters.to || day! <= filters.to)
  )
}
