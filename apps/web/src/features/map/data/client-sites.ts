import { organizations } from '@/lib/entity-data'
import type { ClientSite } from '@lpg/types'

export type ClientSiteMarkerType = 'client-marketer' | 'client-delivery' | 'client-other'

export interface ClientSiteView {
  id: string
  name: string
  city: string
  region: string
  clientName: string
  client_org_id: string
  current_marketeur_org_id: string | null
  is_active: boolean
  markerType: ClientSiteMarkerType
  longitude: number
  latitude: number
}

const REGION_LABELS: Record<string, string> = {
  ADAMAOUA: 'Adamaoua',
  CENTRE: 'Centre',
  EST: 'Est',
  EXTREMENORD: 'ExtrÃªme-Nord',
  LITTORAL: 'Littoral',
  NORD: 'Nord',
  NORDOUEST: 'Nord-Ouest',
  OUEST: 'Ouest',
  SUD: 'Sud',
  SUDOUEST: 'Sud-Ouest',
}

const orgById = new Map(organizations.map((o) => [o.id, o.name]))

function cityFromAddress(address: string | undefined): string {
  if (!address) return 'â€”'
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  const beforeCam = parts.filter((p) => !/cameroun/i.test(p))
  if (beforeCam.length === 0) return 'â€”'
  const last = beforeCam[beforeCam.length - 1]!
  const tokens = last.split(/\s+/)
  return tokens[tokens.length - 1] ?? 'â€”'
}

function markerTypeFor(clientSite: ClientSite): ClientSiteMarkerType {
  if (clientSite.client_org_id.includes('marketeur')) return 'client-marketer'
  if (clientSite.client_org_id.includes('client')) return 'client-delivery'
  return 'client-other'
}

export function getClientSitesView(raw: ClientSite[]): ClientSiteView[] {
  return raw.map((cs): ClientSiteView => {
    const geo = cs.geo_point as [number, number] | null | undefined
    return {
      id: cs.id,
      name: cs.name,
      city: cityFromAddress(cs.address),
      region: REGION_LABELS[cs.region] ?? cs.region,
      clientName: orgById.get(cs.client_org_id) ?? cs.client_org_id,
      client_org_id: cs.client_org_id,
      current_marketeur_org_id: cs.current_marketeur_org_id ?? null,
      is_active: cs.is_active,
      markerType: markerTypeFor(cs),
      longitude: geo?.[0] ?? 0,
      latitude: geo?.[1] ?? 0,
    }
  })
}

export const clientSites: readonly ClientSiteView[] = []
