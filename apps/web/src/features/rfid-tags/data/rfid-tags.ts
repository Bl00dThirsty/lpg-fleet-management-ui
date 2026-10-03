import { client_sites, rfid_tags, sites } from '@lpg/mock-data'
import type { RfidTag, RfidTagStatus } from '@lpg/types'

export type RfidTagView = {
  tag: RfidTag
  tag_id: string
  bottle_serial: string
  status: RfidTagStatus
  location: string
  created_at: string
}

export const rfidTagStatusLabels: Record<RfidTagStatus, string> = {
  AVAILABLE: 'Disponible',
  ASSIGNEDTOBOTTLE: 'Assignée à une bouteille',
  INTRANSITOUT: 'En transit sortie',
  INTRANSITIN: 'En transit entrée',
  LOST: 'Perdu',
  BLOCKED: 'Bloqué',
}

export const rfidTagStatusClasses: Record<RfidTagStatus, string> = {
  AVAILABLE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  ASSIGNEDTOBOTTLE: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  INTRANSITOUT: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  INTRANSITIN: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  LOST: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  BLOCKED: 'bg-red-500/10 text-red-700 dark:text-red-300',
}

export const rfidTagStatusOptions = [
  { label: 'Disponible', value: 'AVAILABLE' },
  { label: 'Assignée à une bouteille', value: 'ASSIGNEDTOBOTTLE' },
  { label: 'En transit sortie', value: 'INTRANSITOUT' },
  { label: 'En transit entrée', value: 'INTRANSITIN' },
  { label: 'Perdu', value: 'LOST' },
  { label: 'Bloqué', value: 'BLOCKED' },
] as const satisfies ReadonlyArray<{ label: string; value: RfidTagStatus }>

const siteById = new Map(sites.map((site) => [site.id, site.name]))
const clientSiteById = new Map(client_sites.map((csite) => [csite.id, csite.name]))

function locationName(tag: RfidTag): string {
  if (tag.current_site_id) return siteById.get(tag.current_site_id) ?? '—'
  if (tag.current_client_site_id)
    return clientSiteById.get(tag.current_client_site_id) ?? '—'
  return '—'
}

function buildView(tag: RfidTag): RfidTagView {
  return {
    tag,
    tag_id: tag.tag_id,
    bottle_serial: tag.bottle_serial ?? '—',
    status: tag.status,
    location: locationName(tag),
    created_at: tag.created_at ?? '',
  }
}

export function getRfidTags(): RfidTag[] {
  return rfid_tags
}

export const rfidTags: readonly RfidTag[] = getRfidTags()

export function getRfidTagsView(source: RfidTag[] = rfid_tags): RfidTagView[] {
  return source.map(buildView)
}

export function getRfidTagById(id: string): RfidTagView | undefined {
  return getRfidTagsView().find(
    (view) => view.tag.id === id || view.tag_id === id
  )
}

export function getRfidTagLocationOptions(
  tags: readonly RfidTagView[],
): { label: string; value: string }[] {
  return Array.from(new Set(tags.map((view) => view.location))).filter(
    (location) => location !== '—',
  ).map((location) => ({ label: location, value: location }))
}