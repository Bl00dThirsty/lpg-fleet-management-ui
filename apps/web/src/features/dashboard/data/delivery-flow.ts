import type { DeliveryTour } from '@lpg/types'

export type DeliveryFlowRange = 'last-30-days' | 'last-quarter' | 'last-12-months'

export type DeliveryFlowPoint = {
  label: string
  vrac: number
  bottles50kg: number
  total: number
}

const MONTHLY_VRAC = [92, 110, 100, 124, 138, 162, 152, 142, 172, 164, 155, 180]
const MONTHLY_BOTTLES = [50, 58, 55, 65, 72, 83, 78, 73, 88, 84, 80, 92]

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function rollingMonthDates(now: Date): Date[] {
  return Array.from({ length: 12 }, (_, index) => {
    return new Date(now.getFullYear(), now.getMonth() - (11 - index), 1)
  })
}

function toPoints(label: string, vrac: number, bottles50kg: number): DeliveryFlowPoint {
  return { label, vrac: round1(vrac), bottles50kg: round1(bottles50kg), total: round1(vrac + bottles50kg) }
}

function monthlyPoints(now: Date, tours?: readonly DeliveryTour[]): DeliveryFlowPoint[] {
  const dates = rollingMonthDates(now)
  const points = dates.map((date, index) =>
    toPoints(monthFormatter.format(date), MONTHLY_VRAC[index]!, MONTHLY_BOTTLES[index]!)
  )

  if (tours && tours.length > 0) {
    let addVrac = 0
    let addBtls = 0
    for (const t of tours) {
      if (t.deleted_at || t.mission_kind === 'PICKUP' || t.status === 'CANCELLED') continue
      const q = Math.max(0, t.delivered_quantity ?? t.requested_quantity ?? 0)
      if (t.type === 'VRAC') addVrac += q
      else addBtls += q / 20 // 50kg bottles converted to TM (20 bottles = 1 TM)
    }
    if (addVrac > 0 || addBtls > 0) {
      const last = points[points.length - 1]!
      last.vrac = round1(last.vrac + addVrac)
      last.bottles50kg = round1(last.bottles50kg + addBtls)
      last.total = round1(last.vrac + last.bottles50kg)
    }
  }

  return points
}

function quarterPoints(now: Date, tours?: readonly DeliveryTour[]): DeliveryFlowPoint[] {
  const months = monthlyPoints(now, tours)
  const dates = rollingMonthDates(now)
  const points: DeliveryFlowPoint[] = []
  for (let group = 0; group < 4; group++) {
    const slice = months.slice(group * 3, group * 3 + 3)
    const vrac = slice.reduce((sum, item) => sum + item.vrac, 0)
    const bottles = slice.reduce((sum, item) => sum + item.bottles50kg, 0)
    const endMonth = dates[group * 3 + 2]!
    const quarter = Math.floor(endMonth.getMonth() / 3) + 1
    points.push(toPoints(`T${quarter} ${endMonth.getFullYear()}`, vrac, bottles))
  }
  return points
}

function weeklyPoints(now: Date, tours?: readonly DeliveryTour[]): DeliveryFlowPoint[] {
  const months = monthlyPoints(now, tours)
  const lastMonth = months[months.length - 1]!
  const lastVrac = lastMonth.vrac
  const lastBottles = lastMonth.bottles50kg
  const weights = [0.24, 0.26, 0.24, 0.26]
  const vracParts = weights.map((weight) => Math.round(lastVrac * weight * 10) / 10)
  const bottlesParts = weights.map((weight) => Math.round(lastBottles * weight * 10) / 10)
  vracParts[3] = round1(lastVrac - (vracParts[0]! + vracParts[1]! + vracParts[2]!))
  bottlesParts[3] = round1(lastBottles - (bottlesParts[0]! + bottlesParts[1]! + bottlesParts[2]!))
  return weights.map((_, index) =>
    toPoints(`Sem ${index + 1}`, vracParts[index]!, bottlesParts[index]!)
  )
}

export function buildDeliveryFlowSeries(
  range: DeliveryFlowRange,
  now: Date = new Date(),
  tours?: readonly DeliveryTour[]
): DeliveryFlowPoint[] {
  if (range === 'last-30-days') return weeklyPoints(now, tours)
  if (range === 'last-quarter') return quarterPoints(now, tours)
  return monthlyPoints(now, tours)
}
