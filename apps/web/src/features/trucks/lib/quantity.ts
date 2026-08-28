import { getTruckTelemetry, type Truck } from '../data/trucks'

export const VRAC_UNIT = ' TM' as const
export const BOUTEILLES_UNIT = ' bouteilles' as const

export interface TruckQuantityInfo {
  amount: string
  percent: number
  loaded: number
  max: number | null
  unit: typeof VRAC_UNIT | typeof BOUTEILLES_UNIT
}

export function quantityInfo(truck: Truck): TruckQuantityInfo {
  const telemetry = getTruckTelemetry(truck.id)
  const isVrac = truck.type === 'VRAC'
  const max = isVrac ? truck.max_volume ?? null : truck.max_bottle_count ?? null
  const loaded = telemetry.loaded_quantity ?? truck.loaded_quantity ?? 0
  const percent = max && max > 0 ? Math.round((loaded / max) * 100) : 0
  const unit = isVrac ? VRAC_UNIT : BOUTEILLES_UNIT
  const amount = `${Math.round(loaded)}/${max ?? '—'}${unit}`
  return { amount, percent, loaded, max, unit }
}
