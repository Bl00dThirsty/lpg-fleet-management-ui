import { curated, organizations } from '@lpg/mock-data'
import type { Site as CuratedSite, ClientSite } from '@lpg/types'
import { type SiteType, type SiteStatus } from '@/features/sites/data/sites'

export type MarketerSite = {
  id: string
  marketerId: string
  name: string
  type: SiteType
  city: string
  region: string
  status: SiteStatus
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

function viewTypeFromSeed(
  site: CuratedSite | ClientSite,
  orgName: string,
): SiteType {
  const functions = 'functions' in site ? (site.functions ?? []) : []
  if (orgName.includes('SCDP')) return 'scdp'
  if (functions.includes('CENTREEMPLISSEUR')) return 'filling-center'
  if (functions.includes('POINTAPPROVISIONABLE')) return 'delivery-point'
  if (functions.includes('ENTREPOT')) return 'depot'
  return 'marketer'
}

function viewStatusFromSeed(
  status: string | undefined,
  isActive: boolean,
): SiteStatus {
  if (status === 'ACTIVE' || status === 'VERIFIED') return 'active'
  if (status === 'SUSPENDED' || status === 'REJECTED') return 'inactive'
  return isActive ? 'active' : 'planned'
}

function cityFromAddress(address: string | undefined): string {
  if (!address) return '—'
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  const beforeCam = parts.filter((p) => !/cameroun/i.test(p))
  if (beforeCam.length === 0) return '—'
  const last = beforeCam[beforeCam.length - 1]!
  const tokens = last.split(/\s+/)
  return tokens[tokens.length - 1] ?? '—'
}

const orgByName = new Map(organizations.map((o) => [o.id, o.name]))
const marketerOrgIds = new Set(
  organizations.filter((o) => o.type === 'MARKETEUR').map((o) => o.id),
)

const seedSites: readonly (CuratedSite | ClientSite)[] = [
  ...curated.sites,
  ...curated.client_sites,
]

function deriveMarketerSites(): MarketerSite[] {
  return seedSites
    .filter((site) => {
      const orgId = 'org_id' in site ? (site as CuratedSite).org_id : (site as ClientSite).client_org_id
      return marketerOrgIds.has(orgId)
    })
    .map((site) => {
      const orgId = 'org_id' in site ? (site as CuratedSite).org_id : (site as ClientSite).client_org_id
      const orgName = orgByName.get(orgId) ?? orgId
      const type = viewTypeFromSeed(site, orgName)
      const status = viewStatusFromSeed(
        'status' in site ? (site as CuratedSite).status : undefined,
        'is_active' in site ? (site as ClientSite).is_active : true,
      )
      const region = site.region
      return {
        id: site.id,
        marketerId: orgId,
        name: site.name,
        type,
        city: cityFromAddress('address' in site ? (site as CuratedSite | ClientSite).address : undefined),
        region: REGION_LABELS[region] ?? region,
        status,
      }
    })
}

export const marketerSites: MarketerSite[] = deriveMarketerSites()

export function getMarketerSites(marketerId: string): MarketerSite[] {
  return marketerSites.filter((s) => s.marketerId === marketerId)
}