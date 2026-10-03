import type { DashboardView } from '../data/dashboard'

function escapeCell(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCsvRow(cells: string[]): string {
  return cells.map(escapeCell).join(';')
}

export function exportDashboardCsv(dashboard: DashboardView): void {
  const rows: string[][] = []

  rows.push(['Section', 'Indicateur', 'Valeur', 'Unite', 'Delta %', 'Highlight'])

  for (const metric of dashboard.metrics) {
    rows.push([
      'KPI principal',
      metric.title,
      String(metric.value),
      metric.unit,
      String(metric.deltaPercent),
      metric.highlight,
    ])
  }

  for (const fleet of dashboard.fleets) {
    rows.push([
      'Flotte',
      fleet.fleetName,
      String(fleet.transportedTM),
      'TM',
      `${fleet.sharePercent}% part`,
      `${fleet.utilizationPercent}% mobilisation`,
    ])
  }

  for (const site of dashboard.reserveSites) {
    rows.push([
      'Reserve site',
      site.siteName,
      String(site.reserveTM),
      'TM',
      `${site.fillPercent}%`,
      site.status,
    ])
  }

  const csv = rows.map((row) => toCsvRow(row)).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `dashboard-${dashboard.overview.generatedAt.slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
