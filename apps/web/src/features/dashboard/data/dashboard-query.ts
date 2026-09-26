import { z } from 'zod'
import type { DateRange } from 'react-day-picker'
import type { RouteTripView } from '@/features/tours/data/tour-activity'
import { getLocalDateRange, parseLocalDate } from '../lib/local-date-range'

/** The three calendar granularities the dashboard can be read at. */
export type DashboardPeriod = 'daily' | 'weekly' | 'monthly'

export type DashboardQuery = {
  range?: DateRange
  period?: DashboardPeriod
  fleetName?: string
}

export const dashboardPeriods = ['daily', 'weekly', 'monthly'] as const

const isoCalendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected an ISO calendar date')

export const dashboardSearchSchema = z.object({
  period: z.enum(dashboardPeriods).default('daily'),
  fleet: z.string().min(1).optional(),
  from: isoCalendarDate.optional(),
  to: isoCalendarDate.optional(),
})

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>

export type ResolvedDashboardQuery = {
  period: DashboardPeriod
  range: DateRange
  fleetName?: string
}

/** The period tab currently selected, as a translatable key. Never a raw token. */
export function periodLabelKey(period: DashboardPeriod): string {
  switch (period) {
    case 'weekly':
      return 'filters.week'
    case 'monthly':
      return 'filters.month'
    default:
      return 'filters.day'
  }
}

/**
 * Turn the loose UI query into the exact period, calendar range and fleet the
 * view must aggregate. A period without an explicit range resolves to the local
 * calendar bounds of that period.
 */
export function resolveDashboardQuery(
  query: DashboardQuery,
  now: Date = new Date(),
): ResolvedDashboardQuery {
  const period = query.period ?? 'daily'
  return {
    period,
    range: query.range ?? getLocalDateRange(period, now),
    fleetName: query.fleetName,
  }
}

export function selectDashboardPeriod(
  query: DashboardQuery,
  period: DashboardPeriod,
): DashboardQuery {
  return { ...query, period, range: undefined }
}

export function selectDashboardFleet(
  query: DashboardQuery,
  fleetName: string,
): DashboardQuery {
  return fleetName === 'all'
    ? { ...query, fleetName: undefined }
    : { ...query, fleetName }
}

export function filterByFleet<T extends { truck: { tenant_name: string } }>(
  trips: readonly T[],
  fleetName?: string,
): T[] {
  if (!fleetName) return [...trips]
  return trips.filter((trip) => trip.truck.tenant_name === fleetName)
}

function isWithinRange(dateIso: string, range: DateRange): boolean {
  const time = parseLocalDate(dateIso).getTime()
  if (Number.isNaN(time)) return false
  const fromTime = range.from
    ? parseLocalDate(range.from).setHours(0, 0, 0, 0)
    : -Infinity
  const toTime = range.to
    ? parseLocalDate(range.to).setHours(23, 59, 59, 999)
    : Infinity
  return time >= fromTime && time <= toTime
}

export function filterByDateRange<T extends RouteTripView>(
  trips: readonly T[],
  range?: DateRange,
): T[] {
  if (!range?.from && !range?.to) return [...trips]
  const normalized: DateRange = { from: range.from, to: range.to ?? range.from }
  return trips.filter((trip) => isWithinRange(trip.startedAt, normalized))
}

function toCalendarDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Serialize the query so it can travel through the URL and back. */
export function dashboardQueryToSearch(query: DashboardQuery): DashboardSearch {
  const search: DashboardSearch = { period: query.period ?? 'daily' }
  if (query.fleetName) search.fleet = query.fleetName
  if (query.range?.from) search.from = toCalendarDate(query.range.from)
  if (query.range?.to) search.to = toCalendarDate(query.range.to)
  return search
}

export function parseDashboardSearch(
  search: Partial<DashboardSearch> | undefined,
): DashboardQuery {
  const raw = search ?? {}
  const query: DashboardQuery = {
    period: dashboardPeriods.includes(raw.period as DashboardPeriod)
      ? (raw.period as DashboardPeriod)
      : 'daily',
  }
  if (typeof raw.fleet === 'string' && raw.fleet.length > 0) {
    query.fleetName = raw.fleet
  }

  const from = parseCalendarDay(raw.from)
  const to = parseCalendarDay(raw.to)
  if (from && to) {
    if (from.getTime() <= to.getTime()) {
      query.range = { from, to: endOfDay(to) }
    }
  } else if (from) {
    query.range = { from, to: endOfDay(from) }
  }

  return query
}

function parseCalendarDay(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined
  }
  const parsed = parseLocalDate(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  )
}
