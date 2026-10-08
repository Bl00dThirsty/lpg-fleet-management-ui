import type {
  Client as CuratedClient,
  ClientSite as CuratedClientSite,
  Organization as CuratedOrganization,
} from '@lpg/types'
import type { Region } from '@lpg/types'

export type ClientStatus = 'ACTIVE' | 'INACTIVE'

export interface ClientView {
  id: string
  orgId: string
  name: string
  registrationNumber?: string
  taxId?: string
  industrySector?: string
  billingAddress?: string
  paymentTerms?: number
  creditLimit?: number
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
  address?: string
  geo_point?: [number, number] | number[] | null
  latitude?: number
  longitude?: number
  geo_confidence_score?: number
  delivery_count?: number
  status: ClientStatus
  verified: boolean
  site_contact_name?: string
  site_contact_phone?: string
  verified_at?: string | null
}

export function getClients(
  clients: CuratedClient[] = [],
  orgs: CuratedOrganization[] = [],
  clientSites: CuratedClientSite[] = []
): ClientView[] {
  return clients
    .filter((client) => !client.deleted_at)
    .map((client) => {
      const org = orgs.find((o) => o.id === client.org_id)
      const clientSitesOf = clientSites.filter(
        (s) => s.client_org_id === client.org_id && !s.deleted_at
      )
      const region = clientSitesOf[0]?.region ?? 'CENTRE'
      return {
        id: client.id,
        orgId: client.org_id,
        name: org?.name ?? '—',
        registrationNumber: org?.registration_number ?? '—',
        taxId: client.tax_id ?? org?.tax_id ?? '—',
        industrySector: client.industry_sector ?? '—',
        billingAddress: client.billing_address ?? '—',
        paymentTerms: client.payment_terms ?? 30,
        creditLimit: client.credit_limit ?? 0,
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

export function getClientSites(
  clientOrgId: string,
  clientSites: CuratedClientSite[] = []
): ClientSiteView[] {
  return clientSites
    .filter((s) => s.client_org_id === clientOrgId && !s.deleted_at)
    .map((site) => ({
      id: site.id,
      name: site.name,
      region: site.region,
      address: site.address,
      geo_point: site.geo_point,
      latitude:
        site.geo_point && site.geo_point.length >= 2
          ? site.geo_point[1]
          : undefined,
      longitude:
        site.geo_point && site.geo_point.length >= 2
          ? site.geo_point[0]
          : undefined,
      geo_confidence_score: site.geo_confidence_score,
      delivery_count: site.delivery_count,
      status: site.is_active ? 'ACTIVE' : 'INACTIVE',
      verified: site.is_verified,
      verified_at: site.verified_at,
      site_contact_name: site.site_contact_name,
      site_contact_phone: site.site_contact_phone,
    }))
}

export function getClientById(
  clientId: string,
  clientList: CuratedClient[] = [],
  orgs: CuratedOrganization[] = [],
  clientSites: CuratedClientSite[] = []
): { client: ClientView; sites: ClientSiteView[] } | null {
  const all = getClients(clientList, orgs, clientSites)
  const found = all.find((c) => c.id === clientId || c.orgId === clientId)
  if (!found) return null
  const sites = getClientSites(found.orgId, clientSites)
  return { client: found, sites }
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
}

export function clientStatusLabel(status: ClientStatus): string {
  return CLIENT_STATUS_LABELS[status]
}
