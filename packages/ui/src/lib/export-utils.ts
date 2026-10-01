import { type Table } from '@tanstack/react-table'

type ExportOptions = {
  filename?: string
  /** columns to include; defaults to all visible leaf columns */
  columns?: string[]
}

function buildRows<TData>(table: Table<TData>): {
  headers: string[]
  rows: (string | number)[][]
} {
  const leafColumns = table.getVisibleLeafColumns()
  const headers = leafColumns.map((c) => {
    const header = c.columnDef.header
    if (typeof header === 'string') return header
    // fall back to id
    return c.id
  })
  const rows = table.getFilteredRowModel().rows.map((row) =>
    leafColumns.map((c) => {
      const v = row.getValue(c.id)
      if (v == null) return ''
      if (typeof v === 'object') return JSON.stringify(v)
      return v as string | number
    })
  )
  return { headers, rows }
}

export function exportToCsv<TData>(table: Table<TData>, opts: ExportOptions = {}) {
  const { headers, rows } = buildRows(table)
  const escape = (val: string | number) => {
    let s = String(val)
    // CSV formula-injection guard: cells starting with a formula prefix
    // (Excel treats them as DDE/formula commands) are neutralized with a
    // leading apostrophe so they render as plain text when opened.
    if (/^[=+\-@]/.test(s)) s = `'${s}`
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n')
  downloadFile(csv, (opts.filename ?? 'export') + '.csv', 'text/csv;charset=utf-8;')
}

export function exportToExcel<TData>(table: Table<TData>, opts: ExportOptions = {}) {
  const { headers, rows } = buildRows(table)
  const html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="utf-8"></head><body><table border="1">' +
    '<tr>' +
    headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('') +
    '</tr>' +
    rows
      .map(
        (r) =>
          '<tr>' +
          r
            .map((c) => {
              let s = String(c)
              if (/^[=+\-@]/.test(s)) s = `'${s}`
              return `<td>${escapeHtml(s)}</td>`
            })
            .join('') +
          '</tr>'
      )
      .join('') +
    '</table></body></html>'
  downloadFile(html, (opts.filename ?? 'export') + '.xls', 'application/vnd.ms-excel')
}

export function exportToJson<TData>(table: Table<TData>, opts: ExportOptions = {}) {
  const { headers, rows } = buildRows(table)
  const data = rows.map((r) => {
    const obj: Record<string, string | number> = {}
    headers.forEach((h, i) => {
      const cell = r[i]
      if (cell !== undefined) obj[h] = cell
    })
    return obj
  })
  downloadFile(
    JSON.stringify(data, null, 2),
    (opts.filename ?? 'export') + '.json',
    'application/json'
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
