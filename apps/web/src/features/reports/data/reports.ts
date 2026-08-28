import { curated } from '@lpg/mock-data'
import type { Report, ReportFormat, ReportStatus, ReportType } from '@lpg/types'
import { useReportsStore } from './reports-store'

export type { ReportFormat, ReportStatus, ReportType }

export interface ReportView {
  id: string
  name: string
  type: ReportType
  typeLabel: string
  format: ReportFormat
  status: ReportStatus
  statusLabel: string
  generatedAt: string | null
  generatedBy: string | null
  expiresAt: string | null
  fileSize: number | null
}

export const reportTypeLabels: Record<ReportType, string> = {
  OPERATIONAL: 'Opérationnel',
  FINANCIAL: 'Financier',
  COMPLIANCE: 'Conformité',
}

export const reportStatusLabels: Record<ReportStatus, string> = {
  PENDING: 'En attente',
  GENERATING: 'Génération en cours',
  READY: 'Prêt',
  FAILED: 'Échec',
  EXPIRED: 'Expiré',
}

const USER_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  curated.users.map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()]),
)

export function getReports(source?: Report[]): ReportView[] {
  return (source ?? useReportsStore.getState().reports).map((report) => ({
    id: report.id,
    name: report.name,
    type: report.type,
    typeLabel: reportTypeLabels[report.type],
    format: report.format,
    status: report.status,
    statusLabel: reportStatusLabels[report.status],
    generatedAt: report.generated_at ?? null,
    generatedBy: report.generated_by ? (USER_NAME_BY_ID[report.generated_by] ?? report.generated_by) : null,
    expiresAt: report.expires_at ?? null,
    fileSize: report.file_size ?? null,
  }))
}

export function getReportSummary() {
  return {
    total: getReports().length,
    ready: reportCountByStatus('READY'),
    pending: reportCountByStatus('PENDING') + reportCountByStatus('GENERATING'),
    failed: reportCountByStatus('FAILED'),
  }
}

function reportCountByStatus(status: ReportStatus): number {
  return getReports().filter((r) => r.status === status).length
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}