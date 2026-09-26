import type { DashboardView } from './dashboard'
import type { DashboardTranslator } from './dashboard-metrics'
import { totalUnitKeys } from './dashboard-quantity'

const UNIT_KEYS = {
  TM: 'export.units.TM',
  btl: 'export.units.btl',
  count: 'export.units.count',
  percent: 'export.units.percent',
} as const

function metricCells(value: DashboardView['metrics'][number]['value']) {
  switch (value.kind) {
    case 'quantity':
      return {
        text: String(value.quantity.value),
        unit: UNIT_KEYS[value.quantity.unit],
      }
    case 'percent':
      return { text: String(value.percent), unit: UNIT_KEYS.percent }
    case 'days':
      return { text: String(value.days), unit: 'export.units.days' }
    default:
      return { text: String(value.count), unit: UNIT_KEYS.count }
  }
}

/**
 * Every cell is a translatable key or a real value, and the unit column is
 * localized too, so the export never leaks a raw enum token to the spreadsheet.
 */
export function buildDashboardCsvRows(
  dashboard: DashboardView,
  t: DashboardTranslator = (key) => key,
): string[][] {
  const rows: string[][] = [
    [
      t('export.section'),
      t('export.indicator'),
      t('export.value'),
      t('export.unit'),
      t('export.context'),
    ],
  ]
  const context = dashboard.overview.dateRangeLabel

  for (const metric of dashboard.metrics) {
    const cells = metricCells(metric.value)
    rows.push([t('export.kpi'), metric.title, cells.text, cells.unit, context])
  }

  for (const fleet of dashboard.fleets) {
    for (const unit of totalUnitKeys()) {
      const transported = fleet.transported[unit]
      if (transported.value <= 0) continue
      rows.push([
        t('export.fleet'),
        fleet.fleetName,
        String(transported.value),
        UNIT_KEYS[unit],
        `${fleet.sharePercent[unit]}% · ${fleet.utilizationPercent}%`,
      ])
    }
  }

  for (const route of dashboard.routeContributions) {
    rows.push([
      t('export.route'),
      route.reference,
      String(route.loaded.value),
      UNIT_KEYS[route.unit],
      `${route.carrierName} · ${route.plateNumber} · ${route.originLabel} - ${route.destinationLabel}`,
    ])
  }

  for (const activity of dashboard.recentActivities) {
    rows.push([
      t('export.activity'),
      activity.id,
      activity.volume ? String(activity.volume.value) : '',
      activity.volume ? UNIT_KEYS[activity.volume.unit] : '',
      `${activity.title} · ${activity.happenedAt}`,
    ])
  }

  return rows
}

export function dashboardCsvFileName(dashboard: DashboardView): string {
  const day = dashboard.overview.generatedAt.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? `dashboard-${day}.csv` : 'dashboard.csv'
}
