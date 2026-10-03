import { pickup_requests, sites } from '@lpg/mock-data'
import type { PickupRequest, PickupStatus } from '@lpg/types'

export interface SupplyRequest {
  id: string
  marketeurOrgId: string
  sourceSiteId: string
  sourceSiteName: string
  destSiteId: string
  destSiteName: string
  requestedQuantity: number
  approvedQuantity: number | null
  status: PickupStatus
}

export const statusLabels: Record<PickupStatus, string> = {
  DRAFT: 'Brouillon',
  VALIDATED: 'Validée',
  INPROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
}

export const statusClasses: Record<PickupStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  VALIDATED: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  INPROGRESS: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  COMPLETED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  CANCELLED: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

function siteName(siteId: string): string {
  const site = sites.find((s) => s.id === siteId)
  return site?.name ?? siteId
}

export function buildSupplyView(requests: PickupRequest[]): SupplyRequest[] {
  return requests.map((r) => ({
    id: r.id,
    marketeurOrgId: r.marketeur_org_id,
    sourceSiteId: r.source_site_id,
    sourceSiteName: siteName(r.source_site_id),
    destSiteId: r.destination_site_id,
    destSiteName: siteName(r.destination_site_id),
    requestedQuantity: r.requested_quantity,
    approvedQuantity: r.approved_quantity ?? null,
    status: r.status,
  }))
}

export function getSupplyView(): SupplyRequest[] {
  return buildSupplyView(pickup_requests as PickupRequest[])
}

export function getSupplyById(id: string): SupplyRequest | undefined {
  const request = (pickup_requests as PickupRequest[]).find((r) => r.id === id)
  return request ? buildSupplyView([request])[0] : undefined
}

export const supplyView: readonly SupplyRequest[] = getSupplyView()
