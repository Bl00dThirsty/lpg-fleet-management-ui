import type { Site as ApiSite, Truck as ApiTruck } from '@lpg/types'
import type { Site, SiteType, SiteStatus } from '@/features/sites/sites'
import type { Truck } from '@/features/trucks/trucks'

/**
 * Adapters that convert the canonical backend contract (@lpg/types) into the
 * local UI shapes used by the existing feature components. This keeps the UI
 * layer stable while the data source switches to the live API.
 */

export function mapTruck(t: ApiTruck): Truck {
  return t as Truck
}

export function mapSite(s: ApiSite): Site {
  return {
    id: s.id,
    name: s.name,
    type: s.type as SiteType,
    city: s.city,
    region: s.region,
    operator: s.operator,
    latitude: s.lat,
    longitude: s.lng,
    description: s.description,
    status: s.status as SiteStatus,
    isKeySite: s.isKeySite,
  }
}
