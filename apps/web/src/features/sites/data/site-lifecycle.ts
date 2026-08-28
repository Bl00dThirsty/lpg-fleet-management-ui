import { sites as curatedSites, client_sites as curatedClientSites, getSettingNumber } from '@lpg/mock-data'
import type { ClientSite, SiteStatus } from '@lpg/types'
import type { PromotionThresholds } from '../lib/auto-promotion'
import type { SiteRow } from '../lib/site-status-machine'

const FALLBACK_THRESHOLDS: PromotionThresholds = {
  auto: 80,
  flag: 30,
}

/** Settings-driven geo confidence thresholds (AGENTS.md §4). */
export function getPromotionThresholds(): PromotionThresholds {
  return {
    auto: getSettingNumber('geo.confidence_auto_verify_threshold') ?? FALLBACK_THRESHOLDS.auto,
    flag: getSettingNumber('geo.confidence_flag_threshold') ?? FALLBACK_THRESHOLDS.flag,
  }
}

export const defaultThresholds: PromotionThresholds = getPromotionThresholds()

function clientSiteStatus(site: ClientSite): SiteStatus {
  if (!site.is_verified) return 'ASSIGNED'
  if ((site.delivery_count ?? 0) >= 1) return 'ACTIVE'
  return 'VERIFIED'
}

export const siteRows: SiteRow[] = curatedSites.map((site) => ({
  id: site.id,
  name: site.name,
  status: site.status,
  region: site.region,
  functions: site.functions ?? [],
  delivery_count: site.delivery_count ?? 0,
  geo_confidence_score: site.geo_confidence_score ?? 0,
  is_client_site: false,
}))

export const clientSiteRows: SiteRow[] = curatedClientSites.map((site) => ({
  id: site.id,
  name: site.name,
  status: clientSiteStatus(site),
  region: site.region,
  functions: [],
  delivery_count: site.delivery_count ?? 0,
  geo_confidence_score: site.geo_confidence_score ?? 0,
  is_client_site: true,
}))

export const REGIONS: readonly string[] = Array.from(
  new Set([...curatedSites, ...curatedClientSites].map((site) => site.region)),
).sort()

export function getSiteRows(): SiteRow[] {
  return curatedSites.map((site) => ({
    id: site.id,
    name: site.name,
    status: site.status,
    region: site.region,
    functions: site.functions ?? [],
    delivery_count: site.delivery_count ?? 0,
    geo_confidence_score: site.geo_confidence_score ?? 0,
    is_client_site: false,
  }))
}

export function getClientSiteRows(): SiteRow[] {
  return curatedClientSites.map((site) => ({
    id: site.id,
    name: site.name,
    status: clientSiteStatus(site),
    region: site.region,
    functions: [],
    delivery_count: site.delivery_count ?? 0,
    geo_confidence_score: site.geo_confidence_score ?? 0,
    is_client_site: true,
  }))
}

export function getVerificationInbox(): SiteRow[] {
  return [...getSiteRows(), ...getClientSiteRows()]
    .filter((s) => s.status === 'ASSIGNED' || s.status === 'ACTIVE')
    .sort((a, b) => (a.delivery_count < b.delivery_count ? -1 : 1))
}
