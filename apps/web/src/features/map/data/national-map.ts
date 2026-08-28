import { getZones, type ZoneView } from '../../zones/data/zones'
import { getGeoAnomalies, type GeoAnomalyView } from './geo-anomalies'
import { clientSites, type ClientSiteView } from './client-sites'
import { sites, type Site } from '../../sites/data/sites'
import { regionsForMap, type RegionSummary } from '../lib/regions'
import { aggregateVracVolume, type VracSummary } from '../lib/vrac-volume'
import { getTrucks, type Truck } from '@/features/trucks/data/trucks'
import {
  getRouteTripsView,
  type RouteTripView,
} from '@/features/tours/data/tour-activity'
import type { UserScope } from '@/features/scope/scope'
import { scopeFilter } from '@/features/scope/scope'
import { curated } from '@lpg/mock-data'
import type { Checkpoint } from '@lpg/types'
import { PERIOD_WINDOWS } from '../utils/map-theme'

export type CheckpointView = {
  id: string
  tournee_id: string
  sequence: number
  status: Checkpoint['status']
  site_id: string | null
  client_site_id: string | null
  latitude: number | null
  longitude: number | null
  expected_arrival: string | null
  actual_arrival: string | null
  tourReference: string
}

export interface NationalMapView {
  sites: readonly Site[]
  clientSites: readonly ClientSiteView[]
  zones: readonly ZoneView[]
  regions: readonly RegionSummary[]
  anomalies: readonly GeoAnomalyView[]
  vrac: VracSummary
  trucks: readonly Truck[]
  routes: readonly RouteTripView[]
  checkpoints: readonly CheckpointView[]
}

/**
 * Aggregates every map layer. The optional scope restricts sites, client
 * sites and anomalies to the authenticated user's scope (AGENTS.md §4);
 * trucks and tour routes are already scope-aware via their own builders.
 */
function buildCheckpointViews(): CheckpointView[] {
  const tours = curated.delivery_tours as unknown as Array<{ id: string }>
  const tourRefById = new Map(tours.map((tour, index) => [tour.id, `TRP-${2401 + index}`]))
  return (curated.checkpoints as unknown as Checkpoint[])
    .map((checkpoint) => {
      let latitude: number | null = null
      let longitude: number | null = null
      if (checkpoint.site_id) {
        const site = (curated.sites as unknown as Array<{ id: string; geo_point: [number, number] | null }>).find(
          (site) => site.id === checkpoint.site_id
        )
        if (site?.geo_point) {
          longitude = site.geo_point[0]
          latitude = site.geo_point[1]
        }
      } else if (checkpoint.client_site_id) {
        const clientSite = (curated.client_sites as unknown as Array<{ id: string; geo_point: [number, number] | null }>).find(
          (cs) => cs.id === checkpoint.client_site_id
        )
        if (clientSite?.geo_point) {
          longitude = clientSite.geo_point[0]
          latitude = clientSite.geo_point[1]
        }
      }
      return {
        id: checkpoint.id,
        tournee_id: checkpoint.tournee_id,
        sequence: checkpoint.sequence,
        status: checkpoint.status,
        site_id: checkpoint.site_id ?? null,
        client_site_id: checkpoint.client_site_id ?? null,
        latitude,
        longitude,
        expected_arrival: checkpoint.expected_arrival ?? null,
        actual_arrival: checkpoint.actual_arrival ?? null,
        tourReference: tourRefById.get(checkpoint.tournee_id) ?? checkpoint.tournee_id,
      }
    })
    .filter((checkpoint) => checkpoint.latitude !== null && checkpoint.longitude !== null)
}

export type TourPeriod = 'today' | 'week' | 'month' | 'custom'

export type OrgRegionOption = {
  id: string
  orgId: string
  orgName: string
  acronym: string
  type: string
  region: string
  siteCount: number
}

export function toAcronym(name: string): string {
  const cleaned = name.replace(/—.*$/, '').trim()
  const words = cleaned.split(/[\s\-/]+/).filter(Boolean)
  if (words.length >= 2) {
    const letters = words
      .filter((w) => !/^(de|des|du|sa|sarl|cameroon|societe|société)$/i.test(w))
      .slice(0, 4)
      .map((w) => w[0]!.toUpperCase())
      .join('')
    if (letters.length >= 2) return letters
  }
  return cleaned
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
}

export function getOrgRegionOptions(scope?: UserScope): OrgRegionOption[] {
  const resolvedScope: UserScope = scope ?? { view: 'org', siteIds: [] }
  const filteredSites = scopeFilter([...sites], resolvedScope, (s) => s.id)
  const byKey = new Map<string, OrgRegionOption>()
  for (const site of filteredSites) {
    const key = `${site.operator}::${site.region || '—'}`
    const org = curated.organizations.find((o) => o.name === site.operator) as unknown as { id: string; type: string } | undefined
    const orgId = org?.id ?? site.operator
    const type = org?.type ?? 'MARKETEUR'
    const existing = byKey.get(key)
    if (existing) {
      existing.siteCount += 1
    } else {
      byKey.set(key, {
        id: `${orgId}::${site.region || '—'}`,
        orgId,
        orgName: site.operator,
        acronym: toAcronym(site.operator),
        type,
        region: site.region || '—',
        siteCount: 1,
      })
    }
  }
  // also include orgs with zero sites? include DEPOT orgs that have no operational sites but should appear
  for (const org of curated.organizations as unknown as Array<{ id: string; name: string; type: string }>) {
    if (org.type !== 'DEPOT') continue
    const has = [...byKey.values()].some((v) => v.orgId === org.id)
    if (!has) {
      byKey.set(`${org.name}::—`, {
        id: `${org.id}::—`,
        orgId: org.id,
        orgName: org.name,
        acronym: toAcronym(org.name),
        type: org.type,
        region: '—',
        siteCount: 0,
      })
    }
  }
  return [...byKey.values()].sort((a, b) => a.region.localeCompare(b.region) || a.acronym.localeCompare(b.acronym))
}

export function getPeriodRange(period: TourPeriod, custom?: { from: string; to: string }): { from: Date; to: Date } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (custom?.from && custom?.to) {
    return { from: new Date(custom.from), to: new Date(custom.to) }
  }
  if (period === 'today') {
    const end = new Date(startOfDay)
    end.setDate(end.getDate() + 1)
    return { from: startOfDay, to: end }
  }
  if (period === 'week' || period === 'month') {
    const offset = PERIOD_WINDOWS[period]
    const from = new Date(startOfDay)
    from.setDate(from.getDate() - offset)
    const to = new Date(startOfDay)
    to.setDate(to.getDate() + 1)
    return { from, to }
  }
  // fallback
  const from = new Date(startOfDay)
  from.setDate(from.getDate() - PERIOD_WINDOWS.month)
  const to = new Date(startOfDay)
  to.setDate(to.getDate() + 1)
  return { from, to }
}

export function getNationalMapView(scope?: UserScope): NationalMapView {
  const resolvedScope: UserScope = scope ?? { view: 'org', siteIds: [] }
  return {
    sites: scopeFilter([...sites], resolvedScope, (s) => s.id),
    clientSites: scopeFilter([...clientSites], resolvedScope, (c) => c.id),
    zones: getZones(),
    regions: regionsForMap(),
    anomalies: scopeFilter(
      [...getGeoAnomalies()],
      resolvedScope,
      (a) => a.entity_id ?? a.id,
    ),
    vrac: aggregateVracVolume(),
    trucks: getTrucks(scope),
    routes: getRouteTripsView('ALL', scope),
    checkpoints: buildCheckpointViews(),
  }
}