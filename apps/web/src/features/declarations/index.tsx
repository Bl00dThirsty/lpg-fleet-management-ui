import { useMemo } from 'react'
import { FileBarChart } from 'lucide-react'
import { getRouteApi } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { DeclarationsTable } from './components/declarations-table'
import { declarationsToViews, getDeclarationSummary } from './data/declarations'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { useComplianceStore } from '@/store/compliance-store'

const route = getRouteApi('/_authenticated/declarations/')

export function DeclarationsPage() {
  const user = useAuthStore((s) => s.user)
  const entities = useComplianceStore((s) => s.declarations)
  const scope = useMemo(() => getScope(user), [user])
  const rows = useMemo(
    () => declarationsToViews(entities, scope),
    [entities, scope],
  )
  const summary = useMemo(() => getDeclarationSummary(rows), [rows])
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <PageShell>
      <PageHeader
        title='Déclarations'
        description='Déclarations mensuelles des marketeurs, du brouillon à la réconciliation.'
      />
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiTile label='Total' value={String(summary.total)} icon={<FileBarChart className='size-4 text-primary' />} />
        <KpiTile label='Soumises' value={String(summary.submitted)} />
        <KpiTile label='Réconciliées' value={String(summary.reconciled)} />
        <KpiTile label='Contestées' value={String(summary.disputed)} />
      </div>
      <SectionCard>
        <DeclarationsTable rows={rows} search={search} navigate={navigate} />
      </SectionCard>
    </PageShell>
  )
}