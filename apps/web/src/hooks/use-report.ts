import { api } from '@lpg/api-client'

/**
 * Terminal statuses for async report generation. Once a report reaches one of
 * these states it never changes again, so the caller can stop polling and
 * render the outcome (download link for READY, error for FAILED/EXPIRED).
 */
export const TERMINAL_STATUSES = ['READY', 'FAILED', 'EXPIRED'] as const
export type ReportTerminalStatus = (typeof TERMINAL_STATUSES)[number]

export function isTerminal(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status)
}

export const DEFAULT_REPORT_POLL_INTERVAL_MS = 1500
export const DEFAULT_REPORT_POLL_TIMEOUT_MS = 60_000

export interface ReportStatusSnapshot {
  status: string
  file_url?: string | null
}

export type GetReportStatus = (id: string) => Promise<ReportStatusSnapshot>

export interface ReportPollOptions {
  intervalMs?: number
  timeoutMs?: number
}

export interface ReportPollResult {
  status: ReportTerminalStatus
  fileUrl?: string
}

/**
 * Polls a report's generation status until it reaches a terminal state
 * (READY / FAILED / EXPIRED) or the timeout elapses, then resolves with the
 * outcome. `getStatus` is dependency-injected so the loop is unit-testable
 * without the HTTP adapter; it defaults to `api.reports.getById`. The first
 * poll runs immediately, then every `intervalMs` up to `timeoutMs`.
 */
export async function createReportAndPoll(
  id: string,
  getStatus: GetReportStatus = (reportId) => api.reports.getById(reportId),
  options: ReportPollOptions = {},
): Promise<ReportPollResult> {
  const intervalMs = options.intervalMs ?? DEFAULT_REPORT_POLL_INTERVAL_MS
  const timeoutMs = options.timeoutMs ?? DEFAULT_REPORT_POLL_TIMEOUT_MS
  const deadline = Date.now() + timeoutMs

  const tick = async (): Promise<ReportPollResult> => {
    const snapshot = await getStatus(id)
    if (isTerminal(snapshot.status)) {
      return {
        status: snapshot.status as ReportTerminalStatus,
        fileUrl: snapshot.file_url ?? undefined,
      }
    }
    if (Date.now() >= deadline) return { status: 'EXPIRED' }
    await wait(intervalMs)
    return tick()
  }

  return tick()
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
