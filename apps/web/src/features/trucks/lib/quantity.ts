import { getTruckTelemetry, type Truck } from '../data/trucks'

export interface TruckQuantityInfo {
  amount: string
  percent: number
  loaded: number
  max: number | null
  unit: ' TM' | ' bouteilles'
}

export function quantityInfo(truck: Truck): TruckQuantityInfo {
  const telemetry = getTruckTelemetry(truck.id)
  const isVrac = truck.type === 'VRAC'
  const max = isVrac ? truck.max_volume ?? null : truck.max_bottle_count ?? null
  const loaded = telemetry.loaded_quantity ?? truck.loaded_quantity ?? 0
  const percent = max && max > 0 ? Math.round((loaded / max) * 100) : 0
  const unit: TruckQuantityInfo['unit'] = isVrac ? ' TM' : ' bouteilles'
  const amount = `${Math.round(loaded)}/${max ?? '—'}${unit}`
  return { amount, percent, loaded, max, unit }
}
