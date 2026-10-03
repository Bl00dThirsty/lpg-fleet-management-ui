import { useEffect, useMemo, useState } from 'react'
import { FileBarChart, FileDown, Loader2, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@lpg/ui'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import {
  EntityFormSheet,
  useEntityPermission,
  field,
} from '@/components/entity-crud'
import type { ReportFormat, ReportType } from '@lpg/types'
import {
  formatFileSize,
  getReportSummary,
  getReports,
  reportStatusLabels,
  reportTypeLabels,
  type ReportView,
} from './data/reports'
import { useReportsStore } from './data/reports-store'

const TYPE_OPTIONS = (
  Object.keys(reportTypeLabels) as ReportType[]
).map((value) => ({ label: reportTypeLabels[value], value }))

const FORMAT_OPTIONS: { label: string; value: ReportFormat }[] = [
  { label: 'Excel', value: 'EXCEL' },
  { label: 'PDF', value: 'PDF' },
  { label: 'CSV', value: 'CSV' },
]

const requestFields = [
  field.text('name', 'Nom du rapport', { required: true }),
  field.select('type', 'Type', TYPE_OPTIONS, { required: true }),
  field.select('format', 'Format', FORMAT_OPTIONS, { required: true }),
]

export function ReportsPage() {
  const perm = useEntityPermission('reports')
  const reports = useReportsStore((s) => s.reports)
  const hasPending = useReportsStore((s) => s.hasPending)
  const [creating, setCreating] = useState(false)
  const [detail, setDetail] = useState<ReportView | null>(null)

  const view = useMemo(() => getReports(reports), [reports])
  const summary = useMemo(() => getReportSummary(), [view])

  // Poll pending/generating reports to their terminal state.
  useEffect(() => {
    if (!hasPending) return
    const interval = setInterval(() => {
      useReportsStore.getState().tick()
    }, 3000)
    return () => clearInterval(interval)
  }, [hasPending])

  async function handleRequest(values: Record<string, unknown>) {
    useReportsStore
      .getState()
      .requestReport(
        String(values.name),
        values.type as ReportType,
        values.format as ReportFormat,
      )
    toast.success('Rapport demandé. Génération en cours…')
    setCreating(false)
  }

  return (
    <PageShell>
      <PageHeader
        title='Rapports & exports'
        description='Rapports asynchrones : génération puis téléchargement.'
        actions={
          perm.canCreate ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className='mr-1 h-4 w-4' /> Demander un rapport
            </Button>
          ) : undefined
        }
      />

      <div className='grid gap-4 sm:grid-cols-4'>
        <KpiTile label='Rapports' value={String(summary.total)} />
        <KpiTile label='Prêts' value={String(summary.ready)} />
        <KpiTile label='En cours' value={String(summary.pending)} />
        <KpiTile label='Échecs' value={String(summary.failed)} />
      </div>

      <SectionCard
        title='Rapports générés'
        description='Les rapports en attente sont rafraîchis automatiquement.'
        actions={
          hasPending ? (
            <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
              <Loader2 className='size-3.5 animate-spin' /> Génération en cours…
            </span>
          ) : (
            <Button
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-xs'
              onClick={() => useReportsStore.getState().tick()}
            >
              <RefreshCw className='mr-1 size-3.5' /> Rafraîchir
            </Button>
          )
        }
      >
        <div className='space-y-2'>
          {view.length === 0 && (
            <p className='text-sm text-muted-foreground'>Aucun rapport.</p>
          )}
          {view.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onOpen={() => setDetail(report)}
              onDownload={() => {
                useReportsStore.getState().downloadReport(report.id)
                toast.success(`Téléchargement de « ${report.name} » lancé.`)
              }}
            />
          ))}
        </div>
      </SectionCard>

      <EntityFormSheet
        open={creating}
        onOpenChange={setCreating}
        title='Demander un rapport'
        description='Le rapport est généré de façon asynchrone puis devient téléchargeable.'
        fields={requestFields}
        onSubmit={handleRequest}
        onCancel={() => setCreating(false)}
        submitLabel='Demander'
      />

      <ReportDetailsDialog
        report={detail}
        onClose={() => setDetail(null)}
        onDownload={() => {
          if (!detail) return
          useReportsStore.getState().downloadReport(detail.id)
          toast.success(`Téléchargement de « ${detail.name} » lancé.`)
        }}
      />
    </PageShell>
  )
}

function ReportRow({
  report,
  onOpen,
  onDownload,
}: {
  report: ReportView
  onOpen: () => void
  onDownload: () => void
}) {
  const ready = report.status === 'READY'
  const busy = report.status === 'PENDING' || report.status === 'GENERATING'
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <button type='button' onClick={onOpen} className='flex min-w-0 items-center gap-2 text-left'>
        <FileBarChart className='size-4 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{report.name}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {report.typeLabel} / {report.format}
            {report.generatedBy && <> / {report.generatedBy}</>}
          </p>
        </div>
      </button>
      <div className='flex flex-wrap items-center gap-1.5'>
        {report.generatedAt && (
          <span className='text-xs text-muted-foreground'>
            {report.generatedAt.slice(0, 10)}
          </span>
        )}
        {report.fileSize != null && (
          <span className='text-xs text-muted-foreground'>
            {formatFileSize(report.fileSize)}
          </span>
        )}
        <Badge variant={ready ? 'default' : busy ? 'secondary' : 'outline'}>
          {busy && <Loader2 className='mr-1 size-3 animate-spin' />}
          {reportStatusLabels[report.status]}
        </Badge>
        {ready && (
          <Button
            variant='outline'
            size='icon'
            className='size-7'
            aria-label='Télécharger'
            onClick={onDownload}
          >
            <FileDown className='size-3.5 text-emerald-600' />
          </Button>
        )}
      </div>
    </div>
  )
}

function ReportDetailsDialog({
  report,
  onClose,
  onDownload,
}: {
  report: ReportView | null
  onClose: () => void
  onDownload: () => void
}) {
  const ready = report?.status === 'READY'
  return (
    <Dialog open={report !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{report?.name}</DialogTitle>
          <DialogDescription>
            Fiche détaillée du rapport et de sa disponibilité.
          </DialogDescription>
        </DialogHeader>
        {report && (
          <div className='space-y-3 text-sm'>
            <dl className='grid grid-cols-2 gap-x-4 gap-y-2'>
              <dt className='text-muted-foreground'>Type</dt>
              <dd>{report.typeLabel}</dd>
              <dt className='text-muted-foreground'>Format</dt>
              <dd>{report.format}</dd>
              <dt className='text-muted-foreground'>Statut</dt>
              <dd>
                <Badge variant={ready ? 'default' : 'outline'}>
                  {reportStatusLabels[report.status]}
                </Badge>
              </dd>
              <dt className='text-muted-foreground'>Généré le</dt>
              <dd>{report.generatedAt ? new Date(report.generatedAt).toLocaleString('fr-FR') : '—'}</dd>
              <dt className='text-muted-foreground'>Par</dt>
              <dd>{report.generatedBy ?? '—'}</dd>
              <dt className='text-muted-foreground'>Expire le</dt>
              <dd>{report.expiresAt ? new Date(report.expiresAt).toLocaleDateString('fr-FR') : '—'}</dd>
              <dt className='text-muted-foreground'>Taille</dt>
              <dd>{formatFileSize(report.fileSize) || '—'}</dd>
            </dl>
            {ready && (
              <Button className='w-full' onClick={onDownload}>
                <FileDown className='mr-1 size-4' /> Télécharger
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}