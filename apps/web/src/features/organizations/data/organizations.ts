import { curated } from '@lpg/mock-data'
import type {
  Organization as CuratedOrganization,
  Site as CuratedSite,
  Region,
} from '@lpg/types'

export type { OrgType } from '@lpg/types'

export type SiteStatus = 'UNASSIGNED' | 'ASSIGNED' | 'ACTIVE' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED'

export interface Organization {
  id: string
  name: string
  type: CuratedOrganization['type']
  status: SiteStatus
  region: Region
  city: string
  sites: number
  created_at: string
  updated_at: string
}

const CITY_BY_REGION: Record<Region, string> = {
  ADAMAOUA: 'Ngaoundéré',
  CENTRE: 'Yaoundé',
  EST: 'Bertoua',
  EXTREMENORD: 'Maroua',
  LITTORAL: 'Douala',
  NORD: 'Garoua',
  NORDOUEST: 'Bamenda',
  OUEST: 'Bafoussam',
  SUD: 'Ebolowa',
  SUDOUEST: 'Buéa',
}

function regionForOrg(orgId: string, idx: number): Region {
  const sites = curated.sites as CuratedSite[]
  const owningSite = sites.find((s) => s.org_id === orgId)
  if (owningSite) return owningSite.region
  const regions = curated.regions.map((r) => r.code as Region)
  return regions[idx % regions.length] ?? 'CENTRE'
}

export function getOrganizations(
  orgs: CuratedOrganization[] = curated.organizations as CuratedOrganization[],
): Organization[] {
  return orgs.map((org, idx) => {
    const region = regionForOrg(org.id, idx)
    return {
      id: org.id,
      name: org.name,
      type: org.type,
      status: org.is_active ? 'ACTIVE' : 'SUSPENDED',
      region,
      city: CITY_BY_REGION[region] ?? '—',
      sites: org.operational_site_count ?? 0,
      created_at: org.created_at ?? '2026-01-01',
      updated_at: org.updated_at ?? '2026-01-01',
    }
  })
}

export const ORG_TYPE_LABELS: Record<CuratedOrganization['type'], string> = {
  REGULATEUR: 'Régulateur',
  DEPOT: 'Dépôt',
  MARKETEUR: 'Marketeur',
  TRANSPORTEUR: 'Transporteur',
  CLIENT: 'Client',
}

export function orgTypeLabel(type: CuratedOrganization['type']): string {
  return ORG_TYPE_LABELS[type]
}

export const ORG_STATUS_LABELS: Record<SiteStatus, string> = {
  UNASSIGNED: 'Non assigné',
  ASSIGNED: 'Assigné',
  ACTIVE: 'Actif',
  VERIFIED: 'Vérifié',
  SUSPENDED: 'Suspendu',
  REJECTED: 'Rejeté',
}

export function orgStatusLabel(status: SiteStatus): string {
  return ORG_STATUS_LABELS[status]
}

const REGION_LABELS: Record<Region, string> = {
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

export function regionLabel(region: Region): string {
  return REGION_LABELS[region] ?? region
}

export const orgRegionOptions: { label: string; value: string }[] = (
  Object.keys(REGION_LABELS) as Region[]
).map((value) => ({ label: REGION_LABELS[value], value }))