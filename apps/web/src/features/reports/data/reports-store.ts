import { create } from 'zustand'
import { curated } from '@lpg/mock-data'
import type { Report, ReportFormat, ReportStatus, ReportType } from '@lpg/types'

const POLL_MS = 3000

interface ReportsState {
  reports: Report[]
  /** true while a report is PENDING/GENERATING */
  hasPending: boolean
  requestReport: (name: string, type: ReportType, format: ReportFormat) => void
  tick: () => void
  downloadReport: (id: string) => void
}

function uid(): string {
  return `rep-${crypto.randomUUID?.()?.slice(0, 8) ?? Date.now()}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export const useReportsStore = create<ReportsState>()((set, get) => ({
  reports: (curated.reports as Report[]).map((r) => ({ ...r })),
  hasPending: false,

  requestReport(name, type, format) {
    const report: Report = {
      id: uid(),
      name,
      type,
      format,
      status: 'PENDING',
      parameters_json: {},
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    set((s) => ({ reports: [report, ...s.reports], hasPending: true }))
    // Simulated async generation: the page polls via `tick`.
    void scheduleTick()
  },

  tick() {
    let hasPending = false
    const reports = get().reports.map((report) => {
      if (report.status === 'PENDING') {
        hasPending = true
        return { ...report, status: 'GENERATING' as ReportStatus, updated_at: nowIso() }
      }
      if (report.status === 'GENERATING') {
        const now = Date.now()
        const generatedAt = nowIso()
        const fileUrl = `/reports/${report.id}.${report.format === 'PDF' ? 'pdf' : report.format === 'EXCEL' ? 'xlsx' : 'csv'}`
        const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString()
        return {
          ...report,
          status: 'READY' as ReportStatus,
          generated_at: generatedAt,
          file_url: fileUrl,
          file_size: Math.round(1024 + Math.random() * 512000),
          expires_at: expiresAt,
          updated_at: generatedAt,
        }
      }
      // Expire stale READY reports past their expiry.
      if (report.status === 'READY' && report.expires_at && report.expires_at < nowIso()) {
        return { ...report, status: 'EXPIRED' as ReportStatus, updated_at: nowIso() }
      }
      return report
    })
    set({ reports, hasPending })
  },

  downloadReport(id) {
    const report = get().reports.find((r) => r.id === id)
    if (!report) return
    if (report.status !== 'READY') return
    const csv = [
      ['Rapport', report.name],
      ['Type', report.type],
      ['Format', report.format],
      ['Généré le', report.generated_at ?? ''],
      ['Expire le', report.expires_at ?? ''],
    ]
      .map((row) => `"${row[0]}","${row[1]}"`)
      .join('\r\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.id}.${report.format === 'PDF' ? 'pdf' : report.format === 'EXCEL' ? 'xlsx' : 'csv'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
}))

let pollTimer: ReturnType<typeof setInterval> | null = null

/** Exposed for tests: cancels the polling loop started by `requestReport`. */
export function stopReportsPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function scheduleTick() {
  if (pollTimer) return
  pollTimer = setInterval(() => {
    const { hasPending, tick } = useReportsStore.getState()
    if (!hasPending) {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
      return
    }
    tick()
  }, POLL_MS)
}