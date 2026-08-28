import { curated, organizations } from '@lpg/mock-data'

export interface ClientSiteView {
  id: string
  name: string
  city: string
  region: string
  clientName: string
  client_org_id: string
  current_marketeur_org_id: string | null
  is_active: boolean
  longitude: number
  latitude: number
}

const REGION_LABELS: Record<string, string> = {
  ADAMAOUA: 'Adamaoua',
  CENTRE: 'Centre',
  EST: 'Est',
  EXTREMENORD: 'Extrême-Nord',
  LITTORAL: 'Littoral',
  NORD: 'Nord',
  NORDOUEST: 'Nord-Ouest',
  OUEST: 'Ouest',
  SUD: 'Sud',
  SUDOUEST: 'Sud-Ouest',
}

const orgById = new Map(organizations.map((o) => [o.id, o.name]))

function cityFromAddress(address: string | undefined): string {
  if (!address) return '—'
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  const beforeCam = parts.filter((p) => !/cameroun/i.test(p))
  if (beforeCam.length === 0) return '—'
  const last = beforeCam[beforeCam.length - 1]!
  const tokens = last.split(/\s+/)
  return tokens[tokens.length - 1] ?? '—'
}

export const clientSites: readonly ClientSiteView[] = curated.client_sites.map(
  (cs): ClientSiteView => {
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
      longitude: geo?.[0] ?? 0,
      latitude: geo?.[1] ?? 0,
    }
  },
)
