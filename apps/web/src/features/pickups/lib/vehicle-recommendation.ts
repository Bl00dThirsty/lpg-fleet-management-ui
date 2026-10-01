import type { Vehicle, VehicleType } from '@lpg/types'

export interface VehicleRecommendation {
  vehicle: Vehicle
  fitRatio: number
  spareCapacity: number
}

export interface RecommendVehiclesInput {
  quantity: number
  type: VehicleType
  org_id: string
  vehicles?: Vehicle[]
  now?: Date
}

export function isCertificateValid(vehicle: Vehicle, now: Date): boolean {
  if (vehicle.type !== 'VRAC') return true
  if (!vehicle.certificate_number || !vehicle.certificate_expiry_at) return false
  const expiry = new Date(vehicle.certificate_expiry_at)
  if (Number.isNaN(expiry.getTime())) return false
  return expiry.getTime() > now.getTime()
}

export function capacityOf(vehicle: Vehicle, type: VehicleType): number | null {
  if (vehicle.type !== type) return null
  if (type === 'VRAC') return vehicle.max_volume ?? null
  return vehicle.max_bottle_count ?? null
}

export function recommendVehicles({
  quantity,
  type,
  org_id,
  vehicles,
  now = new Date(),
}: RecommendVehiclesInput): VehicleRecommendation[] {
  if (quantity <= 0) return []
  const pool = (vehicles ?? []).filter(
    (v) =>
      v.is_active &&
      !v.deleted_at &&
      v.org_id === org_id &&
      v.type === type &&
      isCertificateValid(v, now),
  )

  const withCapacity = pool
    .map((v) => ({ vehicle: v, capacity: capacityOf(v, type)! }))
    .filter(({ capacity }) => capacity >= quantity)

  return withCapacity
    .map(({ vehicle, capacity }) => ({
      vehicle,
      fitRatio: quantity / capacity,
      spareCapacity: capacity - quantity,
    }))
    .sort((a, b) => b.fitRatio - a.fitRatio)
    .slice(0, 5)
}
