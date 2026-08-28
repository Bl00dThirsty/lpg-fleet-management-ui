import { curated } from '@lpg/mock-data'
import type { Role } from '@lpg/permissions'
import { toTourActivities, type TourActivity } from './tour-activity'

export type { TourActivity }

export type FollowUpScope = 'ALL' | 'MARKETEUR' | 'AGENT'

export interface FollowUpContext {
  role: Role
  userId?: string
  orgId?: string
}

export function agentScopedMarketeurOrgIds(userId?: string): string[] {
  if (!userId) return []
  const assignedIds = curated.anomaly_assignments
    .filter((a) => a.assigned_to_user_id === userId)
    .map((a) => a.anomaly_id)
  if (assignedIds.length === 0) return []
  const orgIds = new Set<string>()
  for (const anomaly of curated.anomalies) {
    if (!assignedIds.includes(anomaly.id)) continue
    if (anomaly.entity_type === 'MARKETEUR' && anomaly.entity_id) {
      orgIds.add(anomaly.entity_id)
    }
    if (anomaly.entity_type === 'TOURNEE' && anomaly.entity_id) {
      const tour = curated.delivery_tours.find((t) => t.id === anomaly.entity_id)
      if (tour?.marketeur_org_id) orgIds.add(tour.marketeur_org_id)
    }
  }
  return [...orgIds]
}

function flaggedTourIds(): string[] {
  return curated.anomalies
    .filter(
      (a) =>
        a.entity_type === 'TOURNEE' &&
        !!a.entity_id &&
        (a.type === 'TRANSPORTERNOACK' || a.type === 'TOURNEEUNASSIGNEDTOOLONG'),
    )
    .map((a) => a.entity_id as string)
}

export function followUpFor(ctx: FollowUpContext): TourActivity[] {
  if (ctx.role === 'SUPERADMIN') return toTourActivities(curated.delivery_tours)
  if (ctx.role === 'AGENT') {
    const orgIds = agentScopedMarketeurOrgIds(ctx.userId)
    if (orgIds.length > 0) {
      return toTourActivities(
        curated.delivery_tours.filter((t) => t.marketeur_org_id && orgIds.includes(t.marketeur_org_id)),
      )
    }
    const flagged = curated.delivery_tours.filter((t) => flaggedTourIds().includes(t.id))
    return toTourActivities(flagged.length > 0 ? flagged : curated.delivery_tours)
  }
  if (ctx.role === 'MARKETEUR') {
    if (!ctx.orgId) return toTourActivities(curated.delivery_tours)
    const own = curated.delivery_tours.filter((t) => t.marketeur_org_id === ctx.orgId)
    return toTourActivities(own.length > 0 ? own : curated.delivery_tours)
  }
  return toTourActivities(curated.delivery_tours)
}
