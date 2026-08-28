import { curated, organizations } from '@lpg/mock-data'
import type { Site as CuratedSite, ClientSite } from '@lpg/types'

export type SiteType =
  | 'depot'
  | 'scdp'
  | 'filling-center'
  | 'marketer'
  | 'delivery-point'

export type SiteStatus = 'active' | 'planned' | 'inactive'

export type Site = {
  id: string
  name: string
  type: SiteType
  city: string
  region: string
  operator: string
  latitude: number
  longitude: number
  description: string
  status: SiteStatus
  isKeySite?: boolean
  functions: string[]
  allTypes: SiteType[]
}

export const siteTypeLabels: Record<SiteType, string> = {
  depot: 'Dépôts',
  scdp: 'Sites SCDP',
  'filling-center': 'Centres emplisseurs',
  marketer: 'Marketers',
  'delivery-point': 'Points de livraison',
}

export const siteStatusLabels: Record<SiteStatus, string> = {
  active: 'Actif',
  planned: 'Planifie',
  inactive: 'Inactif',
}

export const siteTypeOptions = [
  { label: 'Dépôts', value: 'depot' },
  { label: 'Sites SCDP', value: 'scdp' },
  { label: 'Centres emplisseurs', value: 'filling-center' },
  { label: 'Marketers', value: 'marketer' },
  { label: 'Points de livraison', value: 'delivery-point' },
] as const satisfies ReadonlyArray<{ label: string; value: SiteType }>

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

function allTypesFromSeed(
  site: CuratedSite | ClientSite,
  primary: SiteType,
  orgName: string,
): SiteType[] {
  const functions = 'functions' in site ? (site.functions ?? []) : []
  const set = new Set<SiteType>([primary])
  // SCDP is org-based, not function, but keep as separate type if org is SCDP
  if (orgName.includes('SCDP')) set.add('scdp')
  if (functions.includes('CENTREEMPLISSEUR')) set.add('filling-center')
  if (functions.includes('ENTREPOT')) set.add('depot')
  if (functions.includes('POINTAPPROVISIONABLE')) set.add('delivery-point')
  if (set.size === 1 && primary === 'marketer' && functions.length === 0) {
    return ['marketer']
  }
  return [...set].sort()
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

function descriptionFor(
  orgName: string,
  type: SiteType,
  region: string,
): string {
  const typeLabel = siteTypeLabels[type]
  return `${orgName} — ${typeLabel}, région ${REGION_LABELS[region] ?? region}.`
}

const orgByName = new Map(organizations.map((o) => [o.id, o.name]))

const seedSites: readonly (CuratedSite | ClientSite)[] = [
  ...curated.sites,
  ...curated.client_sites,
]

function orgId(site: CuratedSite | ClientSite): string {
  return 'org_id' in site ? (site as CuratedSite).org_id : (site as ClientSite).client_org_id
}

export const sites: Site[] = seedSites.map((site) => {
  const orgId_ = orgId(site)
  const orgName = orgByName.get(orgId_) ?? orgId_
  const type = viewTypeFromSeed(site, orgName)
  const allTypes = allTypesFromSeed(site, type, orgName)
  const rawFunctions = 'functions' in site ? ((site.functions ?? []) as string[]) : []
  const status = viewStatusFromSeed(
    'status' in site ? (site as CuratedSite).status : undefined,
    'is_active' in site ? (site as ClientSite).is_active : true,
  )
  const region = site.region
  return {
    id: site.id,
    name: site.name,
    type,
    allTypes,
    functions: rawFunctions,
    city: cityFromAddress('address' in site ? (site as CuratedSite | ClientSite).address : undefined),
    region: REGION_LABELS[region] ?? region,
    operator: orgName,
    latitude: 'geo_point' in site ? ((site as CuratedSite).geo_point as [number, number])?.[1] ?? 0 : 0,
    longitude: 'geo_point' in site ? ((site as CuratedSite).geo_point as [number, number])?.[0] ?? 0 : 0,
    description: descriptionFor(orgName, type, region),
    status,
    isKeySite: type === 'filling-center' || type === 'scdp',
  }
})

export function getKeySites() {
  return sites.filter((site) => site.isKeySite)
}