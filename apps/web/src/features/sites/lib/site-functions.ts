/**
 * site_function (schema `site_function` enum) helpers.
 *
 * A site carries a multi-valued `functions` array: a site may be a filling
 * centre AND a supply point at once (e.g. `["CENTREEMPLISSEUR","ENTREPOT"]`).
 *
 * Domain semantics (see 03_sites_and_client_sites.json metadata):
 *  - CENTREEMPLISSEUR — filling centre: bulk LPG is filled into tanker trucks
 *    and cylinder bundles here; the marketeur "gets its GPL" here or at a
 *    supply point.
 *  - ENTREPOT — storage depot: holds LPG reserves; may also supply
 *    POINTAPPROVISIONABLE sites. Pure storage: it is NOT a pickup origin.
 *  - POINTAPPROVISIONABLE — supply point: receives deliveries from filling
 *    centres; last-mile distribution point. A normal enlèvement origin.
 *
 * OrgType (REGULATEUR/DEPOT/MARKETEUR/TRANSPORTEUR/CLIENT) is an independent
 * organisation taxonomy; do not confuse with these per-site functions.
 */

import { getSettingFunctions } from '@lpg/mock-data'
import type { SiteFunction } from '@lpg/types'

export const SITE_FUNCTIONS: readonly SiteFunction[] = [
  'CENTREEMPLISSEUR',
  'ENTREPOT',
  'POINTAPPROVISIONABLE',
]

export const SITE_FUNCTION_LABELS: Record<SiteFunction, string> = {
  CENTREEMPLISSEUR: 'Centre emplisseur',
  ENTREPOT: 'Entrepôt',
  POINTAPPROVISIONABLE: 'Point d\'approvisionnement',
}

export const SITE_FUNCTION_OPTIONS = SITE_FUNCTIONS.map((f) => ({
  label: SITE_FUNCTION_LABELS[f],
  value: f,
}))

/** Default origin functions for a Flux-1 enlèvement, mirroring the schema's
 * `sites` constraints. Read live from the `settings` table (setting key
 * `flux1.pickup_source_functions`); this constant is the settings-driven
 * fallback when the key is absent, so there is no hardcoded business rule
 * in code. */
export const PICKUP_SOURCE_FUNCTIONS: readonly SiteFunction[] = [
  'CENTREEMPLISSEUR',
  'POINTAPPROVISIONABLE',
]

export function getPickupSourceFunctions(): readonly SiteFunction[] {
  const raw = getSettingFunctions('flux1.pickup_source_functions', [
    'CENTREEMPLISSEUR',
    'POINTAPPROVISIONABLE',
  ])
  return raw as SiteFunction[]
}

export function hasFunction(site: { functions?: SiteFunction[] | null | undefined }, fn: SiteFunction): boolean {
  return Boolean(site.functions?.includes(fn))
}

/** True when the site may serve as an enlèvement (pickup) origin. */
export function isSupplyOrigin(site: { functions?: SiteFunction[] | null | undefined }): boolean {
  const allowed = new Set(getPickupSourceFunctions())
  return site.functions?.some((f) => allowed.has(f)) ?? false
}

/** True when the site is a filling centre (bulk load point). */
export function isFillingCentre(site: { functions?: SiteFunction[] | null | undefined }): boolean {
  return hasFunction(site, 'CENTREEMPLISSEUR')
}

export function siteFunctionsLabel(site: { functions?: SiteFunction[] | null | undefined }): string {
  const fns = site.functions?.filter(Boolean) ?? []
  if (fns.length === 0) return '—'
  return fns.map((f) => SITE_FUNCTION_LABELS[f]).join(', ')
}
