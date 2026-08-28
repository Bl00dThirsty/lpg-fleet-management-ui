import { curated } from '@lpg/mock-data'
import type { Organization } from '@lpg/types'

export const transporterStatusOptions = [
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
] as const

export function getTransporters(
  orgs: Organization[] = curated.organizations as Organization[],
): Organization[] {
  return orgs.filter((o) => o.type === 'TRANSPORTEUR')
}

export const transporters: Organization[] = getTransporters()

export function getTransporterById(
  id: string,
  orgs?: Organization[],
): Organization | undefined {
  return (orgs ?? getTransporters()).find((t) => t.id === id)
}