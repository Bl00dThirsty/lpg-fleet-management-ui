import { curated } from '@lpg/mock-data'
import type { ClientSite, Region, Site, SiteFunction } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'
import { SITE_FUNCTION_OPTIONS } from '../lib/site-functions'

const REGION_OPTIONS: { label: string; value: string }[] = (
  ['ADAMAOUA', 'CENTRE', 'EST', 'EXTREMENORD', 'LITTORAL', 'NORD', 'NORDOUEST', 'OUEST', 'SUD', 'SUDOUEST'] as Region[]
).map((r) => ({ label: r, value: r }))

const ORG_OPTIONS = (curated.organizations as Array<{ id: string; name: string }>).map((o) => ({
  label: o.name,
  value: o.id,
}))

export const siteFields: FieldConfig[] = [
  field.text('name', 'Nom du site', { required: true }),
  field.select('org_id', 'Organisation', ORG_OPTIONS, { required: true }),
  field.select('region', 'Région', REGION_OPTIONS, { required: true }),
  field.checklist('functions', 'Fonction(s) du site', SITE_FUNCTION_OPTIONS, {
    required: true,
    help: 'Un site peut cumuler plusieurs fonctions (ex. centre emplisseur + entrepôt). Au moins une est obligatoire.',
  }),
  field.text('address', 'Adresse'),
  field.number('latitude', 'Latitude', {
    min: -90,
    max: 90,
    help: 'Optionnel — position GPS du site si connue (ex. -90 → 90).',
  }),
  field.number('longitude', 'Longitude', {
    min: -180,
    max: 180,
    help: 'Optionnel — position GPS du site si connue (ex. -180 → 180).',
  }),
  field.switchField('is_active', 'Site actif'),
]

export function siteToForm(s: Site): FormValues {
  return {
    id: s.id,
    name: s.name,
    org_id: s.org_id,
    region: s.region,
    address: s.address ?? '',
    functions: (s.functions ?? []).slice(),
    latitude: s.geo_point?.[1] ?? '',
    longitude: s.geo_point?.[0] ?? '',
    is_active: s.is_active,
  }
}

export function siteFromForm(v: FormValues): Partial<Site> {
  const latitude = v.latitude == null || v.latitude === '' ? null : Number(v.latitude)
  const longitude = v.longitude == null || v.longitude === '' ? null : Number(v.longitude)
  return {
    name: String(v.name).trim(),
    org_id: String(v.org_id),
    region: v.region as Region,
    functions: (v.functions as SiteFunction[] | undefined) ?? [],
    address: v.address ? String(v.address) : undefined,
    // A site is a geolocalisable point: geo_point is optional. Only set it
    // when both coordinates are provided; otherwise leave it null so the site
    // can be geo-verified later.
    geo_point: latitude != null && longitude != null ? [longitude, latitude] : null,
    status: 'UNASSIGNED',
    is_active: Boolean(v.is_active),
  }
}

export const clientSiteFields: FieldConfig[] = [
  field.text('name', 'Nom du site client', { required: true }),
  field.select('client_org_id', 'Organisation cliente', ORG_OPTIONS, { required: true }),
  field.select('region', 'Région', REGION_OPTIONS, { required: true }),
  field.text('address', 'Adresse'),
  field.number('latitude', 'Latitude', {
    min: -90,
    max: 90,
    help: 'Optionnel — position GPS du site si connue.',
  }),
  field.number('longitude', 'Longitude', {
    min: -180,
    max: 180,
    help: 'Optionnel — position GPS du site si connue.',
  }),
  field.switchField('is_active', 'Site actif'),
]

export function clientSiteToForm(s: ClientSite): FormValues {
  return {
    id: s.id,
    name: s.name,
    client_org_id: s.client_org_id,
    region: s.region,
    address: s.address ?? '',
    latitude: s.geo_point?.[1] ?? '',
    longitude: s.geo_point?.[0] ?? '',
    is_active: s.is_active,
  }
}

export function clientSiteFromForm(v: FormValues): Partial<ClientSite> {
  const latitude = v.latitude == null || v.latitude === '' ? null : Number(v.latitude)
  const longitude = v.longitude == null || v.longitude === '' ? null : Number(v.longitude)
  return {
    name: String(v.name).trim(),
    client_org_id: String(v.client_org_id),
    region: v.region as Region,
    address: v.address ? String(v.address) : undefined,
    geo_point: latitude != null && longitude != null ? [longitude, latitude] : null,
    is_active: Boolean(v.is_active),
  }
}
