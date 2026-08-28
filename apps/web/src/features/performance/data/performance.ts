import { checkpoints, drivers, delivery_tours } from '@lpg/mock-data'
import type { Checkpoint, DeliveryTour } from '@lpg/types'

export interface DriverPerformanceView {
  driverId: string
  driverName: string
  totalTours: number
  completed: number
  inFlight: number
  completionRate: number
  missedCheckpoints: number
  totalCheckpoints: number
}

const DRIVER_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  (drivers as { id: string; first_name: string; last_name: string }[]).map((d) => [
    d.id,
    `${d.first_name} ${d.last_name}`.trim(),
  ]),
)

const NAME_BY_PLACEHOLDER: Record<string, string> = {
  'driver-0003-youssouf-hamadou': 'Youssouf Hamadou',
  'driver-0004-adolphe-fozeng': 'Adolphe Fozeng',
  'driver-0001-samuel-abanda': 'Samuel Abanda',
  'driver-0007-didier-ndeugou': 'Didier Ndeugou',
  'driver-0006-robert-tchakounte': 'Robert Tchakounté',
}

function driverName(id: string): string {
  return DRIVER_NAME_BY_ID[id] ?? NAME_BY_PLACEHOLDER[id] ?? id
}

function pct(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0
}

export function getDriverPerformance(): DriverPerformanceView[] {
  const tours = delivery_tours as DeliveryTour[]
  const driverTours = tours.filter((t) => t.driver_id)
  const driverIds = Array.from(new Set(driverTours.map((t) => t.driver_id!)))
  const cpByTour = new Map<string, Checkpoint[]>()
  for (const cp of checkpoints as Checkpoint[]) {
    const list = cpByTour.get(cp.tournee_id) ?? []
    list.push(cp)
    cpByTour.set(cp.tournee_id, list)
  }

  return driverIds.map((driverId) => {
    const driverTours = toursForDriver(driverId, tours)
    const totalCheckpoints = driverTours.reduce(
      (acc, t) => acc + (cpByTour.get(t.id)?.length ?? 0),
      0,
    )
    const missed = driverTours.reduce(
      (acc, t) =>
        acc +
        (cpByTour.get(t.id)?.filter((c) => c.status === 'SKIPPED').length ?? 0),
      0,
    )
    const completed = driverTours.filter((t) => t.status === 'CLOSED').length
    const inFlight = driverTours.filter((t) => t.status !== 'CLOSED').length
    return {
      driverId,
      driverName: driverName(driverId),
      totalTours: driverTours.length,
      completed,
      inFlight,
      completionRate: pct(completed, driverTours.length),
      missedCheckpoints: missed,
      totalCheckpoints,
    }
  }).sort((a, b) => b.completionRate - a.completionRate)
}

function toursForDriver(driverId: string, tours: DeliveryTour[]): DeliveryTour[] {
  return tours.filter((t) => t.driver_id === driverId)
}

export function getPerformanceSummary() {
  const rows = getDriverPerformance()
  const avgCompletion = pct(
    rows.reduce((acc, r) => acc + r.completed, 0),
    rows.reduce((acc, r) => acc + r.totalTours, 0),
  )
  return {
    drivers: rows.length,
    tours: rows.reduce((acc, r) => acc + r.totalTours, 0),
    avgCompletion,
    missedCheckpoints: rows.reduce((acc, r) => acc + r.missedCheckpoints, 0),
  }
}