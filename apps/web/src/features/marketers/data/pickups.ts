import { curated } from '@lpg/mock-data'
import type { PickupRequest, Organization, Site, ClientSite, User } from '@lpg/types'

export type PickupStatusLabel = {
  label: string
  value: PickupRequest['status']
}

export const pickupStatusOptions: PickupStatusLabel[] = [
  { label: 'Brouillon', value: 'DRAFT' },
  { label: 'Validé', value: 'VALIDATED' },
  { label: 'En cours', value: 'INPROGRESS' },
  { label: 'Terminé', value: 'COMPLETED' },
  { label: 'Annulé', value: 'CANCELLED' },
]

export function getPickupsForMarketer(marketerOrgId: string): (PickupRequest & { source_site?: Site; destination_site?: Site | ClientSite; requester?: User })[] {
  return curated.pickup_requests
    .filter((p) => p.marketeur_org_id === marketerOrgId)
    .map((pickup) => {
      const source_site = curated.sites.find((s) => s.id === pickup.source_site_id)
      const destination_site = [...curated.sites, ...curated.client_sites].find(
        (s) => s.id === pickup.destination_site_id
      )
      const requester = curated.users.find((u) => u.id === pickup.created_by)
      return { ...pickup, source_site, destination_site, requester }
    })
}

export function getPickupById(id: string) {
  return curated.pickup_requests.find((p) => p.id === id)
}

export function getAllPickups(): (PickupRequest & { marketeur?: Organization; source_site?: Site; destination_site?: Site | ClientSite })[] {
  return curated.pickup_requests.map((pickup) => {
    const marketeur = curated.organizations.find((o) => o.id === pickup.marketeur_org_id)
    const source_site = curated.sites.find((s) => s.id === pickup.source_site_id)
    const destination_site = [...curated.sites, ...curated.client_sites].find(
      (s) => s.id === pickup.destination_site_id
    )
    return { ...pickup, marketeur, source_site, destination_site }
  })
}