import { curated } from '@lpg/mock-data'
import type { Role } from '@lpg/permissions'
import type { DeliveryTour } from '@lpg/types'
import { toTourActivities, type TourActivity } from './tour-activity'
import { useToursStore } from '@/store/tours-store'

export type { TourActivity }

export type FollowUpScope = 'ALL' | 'MARKETEUR' | 'AGENT'

export interface FollowUpContext {
  role: Role
  userId?: string
  orgId?: string
}

export function agentScopedMarketeurOrgIds(_userId?: string): string[] {
  // Live wiring: anomaly assignments live behind a future api.anomalies.list
  // endpoint. Until then we cannot resolve marketeur scope on this signal
  // alone, so we return an empty list (the caller falls back to the
  // "flagged tours" path).
  return []
}

function flaggedTourIds(): string[] {
  // Same caveat: until api.anomalies.list is wired we cannot flag tours.
  // Returning an empty list makes the caller render the live tour list.
  return []
}

export function followUpFor(ctx: FollowUpContext): TourActivity[] {
  const storeTours = useToursStore.getState().tours
  const tours = (import.meta.env.VITE_API_MODE === 'http' || (storeTours && storeTours.length > 0)) ? storeTours : (curated.delivery_tours as DeliveryTour[])
  if (ctx.role === 'SUPERADMIN') return toTourActivities(tours)
  if (ctx.role === 'AGENT') {
    const orgIds = agentScopedMarketeurOrgIds(ctx.userId)
    if (orgIds.length > 0) {
      return toTourActivities(
        tours.filter((t) => t.marketeur_org_id && orgIds.includes(t.marketeur_org_id)),
      )
    }
    const flagged = tours.filter((t) => flaggedTourIds().includes(t.id))
    return toTourActivities(flagged.length > 0 ? flagged : tours)
  }
  if (ctx.role === 'MARKETEUR') {
    if (!ctx.orgId) return toTourActivities(tours)
    const own = tours.filter((t) => t.marketeur_org_id === ctx.orgId)
    return toTourActivities(own.length > 0 ? own : tours)
  }
  return toTourActivities(tours)
}