import { curated } from '@lpg/mock-data'
import type { Vehicle as CuratedVehicle } from '@lpg/types'

export const truckStatusLabels: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_TRANSIT: 'En livraison',
  MAINTENANCE: 'Maintenance',
  INACTIVE: 'Inactif',
}

export function getTransporterTrucks(orgId?: string): CuratedVehicle[] {
  const vehicles = curated.vehicles as CuratedVehicle[]
  if (!orgId) return vehicles.filter((v) => v.is_active)
  return vehicles.filter((v) => v.org_id === orgId && v.is_active)
}