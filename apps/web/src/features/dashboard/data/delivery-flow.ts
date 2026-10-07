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
  return { label, vrac, bottles50kg, total: round1(vrac + bottles50kg) }
}

function monthlyPoints(now: Date): DeliveryFlowPoint[] {
  const dates = rollingMonthDates(now)
  return dates.map((date, index) =>
    toPoints(monthFormatter.format(date), MONTHLY_VRAC[index]!, MONTHLY_BOTTLES[index]!)
  )
}

function quarterPoints(now: Date): DeliveryFlowPoint[] {
  const dates = rollingMonthDates(now)
  const points: DeliveryFlowPoint[] = []
  for (let group = 0; group < 4; group++) {
    const slice = [0, 1, 2].map((offset) => group * 3 + offset)
    const vrac = slice.reduce((sum, index) => sum + (MONTHLY_VRAC[index] ?? 0), 0)
    const bottles = slice.reduce((sum, index) => sum + (MONTHLY_BOTTLES[index] ?? 0), 0)
    const endMonth = dates[slice[2]!]!
    const quarter = Math.floor(endMonth.getMonth() / 3) + 1
    points.push(toPoints(`T${quarter} ${endMonth.getFullYear()}`, vrac, bottles))
  }
  return points
}

function weeklyPoints(): DeliveryFlowPoint[] {
  const lastVrac = MONTHLY_VRAC[MONTHLY_VRAC.length - 1]!
  const lastBottles = MONTHLY_BOTTLES[MONTHLY_BOTTLES.length - 1]!
  const weights = [0.24, 0.26, 0.24, 0.26]
  const vracParts = weights.map((weight) => Math.round(lastVrac * weight))
  const bottlesParts = weights.map((weight) => Math.round(lastBottles * weight))
  vracParts[3] = lastVrac - (vracParts[0]! + vracParts[1]! + vracParts[2]!)
  bottlesParts[3] = lastBottles - (bottlesParts[0]! + bottlesParts[1]! + bottlesParts[2]!)
  return weights.map((_, index) =>
    toPoints(`Sem ${index + 1}`, vracParts[index]!, bottlesParts[index]!)
  )
}

export function buildDeliveryFlowSeries(
  range: DeliveryFlowRange,
  now: Date = new Date()
): DeliveryFlowPoint[] {
  if (range === 'last-30-days') return weeklyPoints()
  if (range === 'last-quarter') return quarterPoints(now)
  return monthlyPoints(now)
}
