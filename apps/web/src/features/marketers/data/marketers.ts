import { curated } from '@lpg/mock-data'
import type { Organization } from '@lpg/types'

export const marketerStatusOptions = [
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
]

export function getMarketers(orgs: Organization[] = curated.organizations as Organization[]): Organization[] {
  return orgs.filter((o) => o.type === 'MARKETEUR')
}

export function getMarketerById(id: string, orgs?: Organization[]): Organization | undefined {
  return (orgs ?? (curated.organizations as Organization[])).find((m) => m.id === id)
}

export function getMarketerByName(name: string, orgs?: Organization[]): Organization | undefined {
  const source = orgs ?? (curated.organizations as Organization[])
  // Try exact match first, then partial match on the name
  return source.find(
    (m) =>
      m.name.includes(name) || (m.registration_number && m.registration_number.includes(name))
  )
}