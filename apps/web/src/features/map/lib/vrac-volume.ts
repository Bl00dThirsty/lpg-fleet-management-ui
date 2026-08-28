import { getTrucks, type Truck } from '@/features/trucks/data/trucks'
import { quantityInfo, VRAC_UNIT } from '@/features/trucks/lib/quantity'

export interface VracSummary {
  totalTM: number
  unit: 'TM'
  activeTruckCount: number
}

export function aggregateVracVolume(): VracSummary {
  const vracTrucks: Truck[] = getTrucks().filter(
    (t) => t.type === 'VRAC' && (t.max_volume ?? 0) > 0,
  )
  let totalTM = 0
  for (const truck of vracTrucks) {
    const info = quantityInfo(truck)
    if (info.unit === VRAC_UNIT) totalTM += info.loaded
  }
  return {
    totalTM: Math.round(totalTM * 100) / 100,
    unit: 'TM',
    activeTruckCount: vracTrucks.length,
  }
}
