/**
 * CRUD configuration for the `organizations` entity.
 *
 * Drives `<EntityForm>` and the create/edit mapping. `region`/`city`/`sites`
 * shown in the table are derived (from sites) and are NOT part of the
 * writable schema, so they are excluded from the form.
 *
 * When CREATING an operational organisation (MARKETEUR/TRANSPORTEUR/DEPOT) an
 * optional first site can be registered in the same operation (`site_*`
 * fields → `siteFromForm`).
 */

import type { OrgType, Organization, Region, Site } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'

const ORG_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Régulateur', value: 'REGULATEUR' },
  { label: 'Dépôt', value: 'DEPOT' },
  { label: 'Marketeur', value: 'MARKETEUR' },
  { label: 'Transporteur', value: 'TRANSPORTEUR' },
  { label: 'Client', value: 'CLIENT' },
]

const REGION_OPTIONS: { label: string; value: string }[] = [
  { label: 'Adamaoua', value: 'ADAMAOUA' },
  { label: 'Centre', value: 'CENTRE' },
  { label: 'Est', value: 'EST' },
  { label: 'Extrême-Nord', value: 'EXTREMENORD' },
  { label: 'Littoral', value: 'LITTORAL' },
  { label: 'Nord', value: 'NORD' },
  { label: 'Nord-Ouest', value: 'NORDOUEST' },
  { label: 'Ouest', value: 'OUEST' },
  { label: 'Sud', value: 'SUD' },
  { label: 'Sud-Ouest', value: 'SUDOUEST' },
]

const SITE_SECTION = 'Site initial (optionnel)'

export const organizationFields: FieldConfig[] = [
  field.text('name', 'Nom', { required: true }),
  field.select('type', 'Type', ORG_TYPE_OPTIONS, { required: true }),
  field.text('registration_number', 'N° d’enregistrement'),
  field.text('tax_id', 'N° fiscal'),
  field.switchField('is_active', 'Organisation active'),
  field.text('site_name', 'Nom du site', {
    section: SITE_SECTION,
    placeholder: 'Ex. SCTM Bonabéri',
    help: 'Crée le premier site opérationnel de l’organisation.',
  }),
  field.select('site_region', 'Région', REGION_OPTIONS, { section: SITE_SECTION }),
  field.text('site_address', 'Adresse', { section: SITE_SECTION }),
  field.number('site_latitude', 'Latitude', { section: SITE_SECTION }),
  field.number('site_longitude', 'Longitude', { section: SITE_SECTION }),
]

/** Fields for edit mode: the initial site is not editable here. */
export const organizationEditFields: FieldConfig[] = organizationFields.filter(
  (f) => !f.name.startsWith('site_'),
)

export function organizationToForm(o: Organization): FormValues {
  return {
    id: o.id,
    name: o.name,
    type: o.type,
    registration_number: (o as { registration_number?: string }).registration_number ?? '',
    tax_id: (o as { tax_id?: string }).tax_id ?? '',
    is_active: o.is_active,
  }
}

export function organizationFromForm(v: FormValues): Partial<Organization> {
  return {
    name: String(v.name),
    type: v.type as OrgType,
    registration_number: v.registration_number ? String(v.registration_number) : undefined,
    tax_id: v.tax_id ? String(v.tax_id) : undefined,
    is_active: Boolean(v.is_active),
  }
}

/**
 * Build the bundled initial site payload when the create form carries a site
 * name; otherwise returns null (no site is registered).
 */
export function siteFromForm(
  v: FormValues,
  orgId: string,
): Omit<Site, 'id'> | null {
  const name = String(v.site_name ?? '').trim()
  if (!name) return null
  const latitude = typeof v.site_latitude === 'number' ? v.site_latitude : Number(v.site_latitude)
  const longitude = typeof v.site_longitude === 'number' ? v.site_longitude : Number(v.site_longitude)
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
  return {
    org_id: orgId,
    region: (v.site_region as Region | undefined) ?? 'CENTRE',
    name,
    address: v.site_address ? String(v.site_address) : undefined,
    geo_point: hasCoordinates ? [longitude, latitude] : undefined,
    functions: [],
    is_verified: false,
    status: 'UNASSIGNED',
    is_active: true,
  }
}