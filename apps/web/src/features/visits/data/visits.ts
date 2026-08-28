import { client_sites as mockClientSites, organizations } from '@lpg/mock-data'
import type { ClientSite } from '@lpg/types'

export interface VisitView {
  id: string
  clientName: string
  siteName: string
  region: string
  status: 'VERIFIE' | 'PENDING'
  statusLabel: string
  verifiedAt: string | null
}

const ORG_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  (organizations as { id: string; name: string }[]).map((o) => [o.id, o.name]),
)

export function getVisits(): VisitView[] {
  return (mockClientSites as ClientSite[]).map((site) => ({
    id: site.id,
    clientName: ORG_NAME_BY_ID[site.client_org_id] ?? site.client_org_id,
    siteName: site.name,
    region: site.region,
    status: site.is_verified ? 'VERIFIE' : 'PENDING',
    statusLabel: site.is_verified ? 'Vérifié' : 'En attente de vérification',
    verifiedAt: site.verified_at ?? null,
  }))
}

export function getVisitSummary() {
  const rows = getVisits()
  return {
    total: rows.length,
    verified: rows.filter((r) => r.status === 'VERIFIE').length,
    pending: rows.filter((r) => r.status === 'PENDING').length,
  }
}

export function getVisitsByRegion(): Record<string, number> {
  const rows = getVisits()
  const byRegion: Record<string, number> = {}
  for (const row of rows) {
    byRegion[row.region] = (byRegion[row.region] ?? 0) + 1
  }
  return byRegion
}