import {
  buildDashboardCsvRows,
  dashboardCsvFileName,
} from '../data/dashboard-export-rows'
import type { DashboardTranslator, DashboardView } from '../data/dashboard'

export type CsvAnchor = {
  href: string
  download: string
}

/**
 * The browser side of the export, isolated behind primitives so the download
 * sequence can be asserted without a real DOM.
 */
export type CsvDownloadEnvironment = {
  createObjectUrl: (text: string) => string
  revokeObjectUrl: (url: string) => void
  attachAnchor: (anchor: CsvAnchor) => void
  clickAnchor: (anchor: CsvAnchor) => void
  scheduleRevoke: (task: () => void) => void
}

function escapeCell(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildDashboardCsvText(rows: readonly string[][]): string {
  const body = rows
    .map((row) => row.map(escapeCell).join(';'))
    .join('\r\n')
  return `\uFEFF${body}`
}

export function createBrowserCsvDownloadEnvironment(): CsvDownloadEnvironment {
  const doc = globalThis.document
  if (!doc) {
    throw new Error('Dashboard CSV export requires a browser document')
  }
  let element: HTMLAnchorElement | null = null

  return {
    createObjectUrl: (text) =>
      URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' })),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
    attachAnchor: (anchor) => {
      const created = doc.createElement('a')
      created.href = anchor.href
      created.download = anchor.download
      created.rel = 'noopener'
      created.style.display = 'none'
      doc.body.appendChild(created)
      element = created
    },
    clickAnchor: () => element?.click(),
    // Revoking synchronously after click() aborts the download in Firefox and
    // Safari; defer it to a later task.
    scheduleRevoke: (task) => {
      setTimeout(task, 0)
    },
  }
}

export function exportDashboardCsv(
  dashboard: DashboardView,
  t: DashboardTranslator = (key) => key,
  env: CsvDownloadEnvironment = createBrowserCsvDownloadEnvironment(),
): void {
  const text = buildDashboardCsvText(buildDashboardCsvRows(dashboard, t))
  const url = env.createObjectUrl(text)
  const anchor: CsvAnchor = {
    href: url,
    download: dashboardCsvFileName(dashboard),
  }

  env.attachAnchor(anchor)
  env.clickAnchor(anchor)
  env.scheduleRevoke(() => env.revokeObjectUrl(url))
}

export { buildDashboardCsvRows, dashboardCsvFileName }
