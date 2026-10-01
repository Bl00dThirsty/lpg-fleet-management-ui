import { curated } from '@lpg/mock-data'
import type {
  Client as CuratedClient,
  ClientSite as CuratedClientSite,
  Organization as CuratedOrganization,
} from '@lpg/mock-data'
import type { Region } from '@lpg/types'

export type ClientStatus = 'ACTIVE' | 'INACTIVE'

export interface ClientView {
  id: string
  orgId: string
  name: string
  contactName: string
  contactPhone: string
  contactEmail: string
  clientSiteCount: number
  region: Region
  status: ClientStatus
  created_at: string
  updated_at: string
}

export interface ClientSiteView {
  id: string
  name: string
  region: Region
  status: ClientStatus
  verified: boolean
}

export function getClients(
  clients: CuratedClient[] = curated.clients as CuratedClient[],
): ClientView[] {
  const orgs = curated.organizations as CuratedOrganization[]
  const clientSites = curated.client_sites as CuratedClientSite[]

  return clients.map((client) => {
    const org = orgs.find((o) => o.id === client.org_id)
    const clientSitesOf = clientSites.filter(
      (s) => s.client_org_id === client.org_id,
    )
    const region = clientSitesOf[0]?.region ?? 'CENTRE'
    return {
      id: client.id,
      orgId: client.org_id,
      name: org?.name ?? '—',
      contactName: client.primary_contact_name ?? '—',
      contactPhone: client.primary_contact_phone ?? '—',
      contactEmail: client.primary_contact_email ?? '—',
      clientSiteCount: clientSitesOf.length,
      region,
      status: client.is_active ? 'ACTIVE' : 'INACTIVE',
      created_at: client.created_at ?? '2026-01-01',
      updated_at: client.updated_at ?? '2026-01-01',
    }
  })
}

export function getClientSites(clientOrgId: string): ClientSiteView[] {
  const clientSites = curated.client_sites as CuratedClientSite[]
  return clientSites
    .filter((s) => s.client_org_id === clientOrgId)
    .map((site) => ({
      id: site.id,
      name: site.name,
      region: site.region,
      status: site.is_active ? 'ACTIVE' : 'INACTIVE',
      verified: site.is_verified,
    }))
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
}

export function clientStatusLabel(status: ClientStatus): string {
  return CLIENT_STATUS_LABELS[status]
}