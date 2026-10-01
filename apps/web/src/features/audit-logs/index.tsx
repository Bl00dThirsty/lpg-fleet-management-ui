import { useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { getAuditLogs, getAuditSummary, type AuditLogView } from './data/audit-logs'
import { AuditLogsTable } from './components/audit-logs-table'

const route = getRouteApi('/_authenticated/audit-logs/')

export function AuditLogsPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const summary = useMemo(() => getAuditSummary(), [])
  const logs = useMemo(() => getAuditLogs(), [])

  function exportCsv() {
    const header = ['Date', 'Action', 'Acteur', 'Table', 'ID', 'IP', 'Risque']
    const rows = logs.map((log) => [
      log.createdAt,
      auditActionLabel(log),
      log.actor,
      log.resourceTable,
      log.resourceId,
      log.ipAddress,
      String(log.riskScore),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).split('"').join('""')}"`).join(';'))
      .join('\r\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`${logs.length} événement(s) exporté(s) en CSV.`)
  }

  return (
    <PageShell>
      <PageHeader
        title='Journal d’audit'
        description='Traçabilité des actions sensibles sur l’ensemble de la plateforme.'
        actions={
          <Button variant='outline' onClick={exportCsv}>
            <Download className='mr-1 h-4 w-4' /> Exporter CSV
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <KpiTile label='Événements' value={String(summary.total)} />
        <KpiTile label='Permissions refusées' value={String(summary.denied)} />
        <KpiTile label='Risque élevé' value={String(summary.highRisk)} />
      </div>

      <SectionCard title='Événements' description='Actions enregistrées, de la plus récente à la plus ancienne.'>
        <AuditLogsTable data={logs} search={search} navigate={navigate} />
      </SectionCard>
    </PageShell>
  )
}

function auditActionLabel(log: AuditLogView): string {
  return log.actionLabel
}