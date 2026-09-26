import type { DateRange } from 'react-day-picker'
import type { DashboardPeriod } from '../data/dashboard'

export function parseLocalDate(value: string | Date): Date {
  if (value instanceof Date) return new Date(value.getTime())
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
  }
  return new Date(value)
}

export function getLocalDateRange(period: DashboardPeriod, now = new Date()): DateRange {
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  if (period === 'daily') {
    return {
      from: new Date(year, month, day),
      to: new Date(year, month, day, 23, 59, 59, 999),
    }
  }

  if (period === 'monthly') {
    return {
      from: new Date(year, month, 1),
      to: new Date(year, month + 1, 0, 23, 59, 59, 999),
    }
  }

  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(year, month, day + mondayOffset)
  const sunday = new Date(year, month, day + mondayOffset + 6)

  return {
    from: monday,
    to: new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999),
  }
}
