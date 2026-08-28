import { delivery_tours, declarations, organizations } from '@lpg/mock-data'
import type { Declaration, DeliveryTour } from '@lpg/types'

export interface MarketeurQuotaView {
  marketeurId: string
  marketeurName: string
  declaredVolume: number
  deliveredVolume: number
  usageRate: number
}

function orgName(id: string): string {
  return organizations.find((o) => o.id === id)?.name ?? id
}

function pct(used: number, allocated: number): number {
  return allocated > 0 ? Math.round((used / allocated) * 100) : 0
}

export function getMarketeurQuotas(): MarketeurQuotaView[] {
  const decl = declarations as Declaration[]
  const tours = delivery_tours as DeliveryTour[]
  const ids = Array.from(new Set(decl.map((d) => d.marketeur_org_id)))

  return ids.map((id) => {
    const declaredVolume = decl
      .filter((d) => d.marketeur_org_id === id)
      .reduce((acc, d) => acc + d.declared_volume, 0)
    const deliveredVolume = tours
      .filter((t) => t.marketeur_org_id === id)
      .reduce((acc, t) => acc + (t.delivered_quantity ?? 0), 0)
    return {
      marketeurId: id,
      marketeurName: orgName(id),
      declaredVolume,
      deliveredVolume,
      usageRate: pct(deliveredVolume, declaredVolume),
    }
  })
}

export function getQuotaSummary() {
  const rows = getMarketeurQuotas()
  return {
    marketeurs: rows.length,
    declared: rows.reduce((acc, r) => acc + r.declaredVolume, 0),
    delivered: rows.reduce((acc, r) => acc + r.deliveredVolume, 0),
    avgUsage: pct(
      rows.reduce((acc, r) => acc + r.deliveredVolume, 0),
      rows.reduce((acc, r) => acc + r.declaredVolume, 0),
    ),
  }
}