import type { Site as CuratedSite, ClientSite } from '@lpg/types'

export type SiteType =
  'depot' | 'scdp' | 'filling-center' | 'marketer' | 'delivery-point'

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
  orgId?: string
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
  orgName: string
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
  isActive: boolean
): SiteStatus {
  if (status === 'ACTIVE' || status === 'VERIFIED') return 'active'
  if (status === 'SUSPENDED' || status === 'REJECTED') return 'inactive'
  return isActive ? 'active' : 'planned'
}

export function cityFromAddress(address: string | undefined): string {
  if (!address) return '—'
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  const beforeCam = parts.filter((p) => !/cameroun/i.test(p))
  if (beforeCam.length === 0) return '—'
  const last = beforeCam[beforeCam.length - 1]!
  const tokens = last.split(/\s+/)
  return tokens[tokens.length - 1] ?? '—'
}

function descriptionFor(
  orgName: string,
  type: SiteType,
  region: string
): string {
  const typeLabel = siteTypeLabels[type]
  return `${orgName} — ${typeLabel}, région ${REGION_LABELS[region] ?? region}.`
}

function orgId(site: CuratedSite | ClientSite): string {
  return 'org_id' in site
    ? (site as CuratedSite).org_id
    : (site as ClientSite).client_org_id
}

/**
 * Synchronous accessor — accepts raw rows already fetched by the host page
 * via `api.sites.list()` / `api.clientSites.list()`. Pages must trigger the
 * fetch on mount and pass the result. The previous `curated.sites` +
 * `curated.client_sites` seed has been removed.
 */
export function getSites(
  raw: (CuratedSite | ClientSite)[] = [],
  orgsById: Record<string, string> = {}
): Site[] {
  return raw.map((site) => {
    const orgId_ = orgId(site)
    const orgName = orgsById[orgId_] ?? orgId_
    const type = viewTypeFromSeed(site, orgName)
    const status = viewStatusFromSeed(
      'status' in site ? (site as CuratedSite).status : undefined,
      'is_active' in site ? (site as ClientSite).is_active : true
    )
    const region = site.region ?? ''
    const geo = site.geo_point
    return {
      id: site.id,
      name: site.name,
      type,
      city: cityFromAddress(site.address),
      region: REGION_LABELS[region] ?? region,
      operator: orgName,
      latitude: geo?.[1] ?? 0,
      longitude: geo?.[0] ?? 0,
      description: descriptionFor(orgName, type, region),
      status,
      isKeySite: type === 'filling-center' || type === 'scdp',
      orgId: orgId_,
    }
  })
}

/**
 * Empty placeholder for backwards compatibility with sync consumers that
 * imported the previous `sites` constant. Pages should call `getSites()`
 * with fetched rows instead.
 */
export const sites: Site[] = []

export function getKeySites(
  raw?: (CuratedSite | ClientSite)[],
  orgsById?: Record<string, string>
): Site[] {
  return getSites(raw, orgsById).filter((site) => site.isKeySite)
}
