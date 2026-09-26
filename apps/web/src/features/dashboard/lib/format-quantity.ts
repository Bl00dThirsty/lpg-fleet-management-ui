import {
  currentLang,
  formatBtl,
  formatNumber,
  formatTM,
} from '@/lib/i18n/formatters'
import type {
  DashboardMetricValue,
  DashboardUnit,
} from '../data/dashboard-quantity'

export type { DashboardUnit } from '../data/dashboard-quantity'

type TranslateFn = (key: string) => string

/**
 * The single formatter of the dashboard. A GPL volume is never rendered without
 * its canonical unit, and every other metric value has exactly one rendering.
 */
export function formatDashboardQuantity(
  value: number,
  unit: DashboardUnit,
): string {
  if (!Number.isFinite(value)) return '—'

  return unit === 'btl'
    ? formatBtl(value, currentLang())
    : formatTM(value, currentLang())
}

export function formatDashboardMetricValue(
  value: DashboardMetricValue,
  t: TranslateFn,
): string {
  switch (value.kind) {
    case 'quantity':
      return formatDashboardQuantity(value.quantity.value, value.quantity.unit)
    case 'percent':
      return `${value.percent} %`
    case 'days':
      return `${value.days} ${t('units.days')}`
    default:
      return formatNumber(value.count, currentLang())
  }
}
