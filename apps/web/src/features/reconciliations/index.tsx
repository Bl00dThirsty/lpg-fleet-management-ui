import { useMemo } from 'react'
import { AlertTriangle, Coins, FileBarChart, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { ReconciliationsTable } from './components/reconciliations-table'
import { reconciliationsToViews, getReconciliationSummary, gapToleranceThreshold } from './data/reconciliations'
import { useComplianceStore } from '@/store/compliance-store'

export function ReconciliationsPage() {
  const entities = useComplianceStore((s) => s.reconciliations)
  const rows = useMemo(() => reconciliationsToViews(entities), [entities])
  const summary = useMemo(() => getReconciliationSummary(rows), [rows])
  const tolerance = gapToleranceThreshold()

  return (
    <PageShell>
      <PageHeader
        title='Réconciliations'
        description='Déclaré contre suivi — détection des écarts de volume et impact sur la subvention.'
      />
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiTile label='Total' value={String(summary.total)} icon={<FileBarChart className='size-4 text-primary' />} />
        <KpiTile
          label={`Écarts > ${tolerance.toLocaleString('fr-FR')} %`}
          value={String(summary.flagged)}
          icon={<AlertTriangle className='size-4 text-rose-500' />}
        />
        <KpiTile
          label='Redressements'
          value={String(summary.redressement)}
          icon={<Receipt className='size-4 text-violet-500' />}
        />
        <KpiTile
          label='Impact subvention'
          value={`${summary.totalSubsidy / 1e6} M XFA`}
          icon={<Coins className='size-4 text-emerald-500' />}
        />
      </div>
      <SectionCard>
        <ReconciliationsTable rows={rows} />
      </SectionCard>
    </PageShell>
  )
}