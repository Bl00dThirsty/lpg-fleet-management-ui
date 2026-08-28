import { useMemo } from 'react'
import { ListChecks } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { getVisitSummary, getVisits, getVisitsByRegion, type VisitView } from './data/visits'

export function VisitsPage() {
  const visits = useMemo(() => getVisits(), [])
  const summary = useMemo(() => getVisitSummary(), [])
  const byRegion = useMemo(() => getVisitsByRegion(), [])

  return (
    <PageShell>
      <PageHeader
        title='Rapports de visite terrain'
        description='Sites clients et leur statut de vérification terrain.'
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <KpiTile label='Sites clients' value={String(summary.total)} />
        <KpiTile label='Vérifiés' value={String(summary.verified)} />
        <KpiTile label='À vérifier' value={String(summary.pending)} />
      </div>

      <SectionCard title='Par région' description='Répartition des sites par zone géographique.'>
        <div className='grid gap-2 sm:grid-cols-3'>
          {Object.entries(byRegion).map(([region, count]) => (
            <div key={region} className='flex items-center justify-between rounded-lg border px-3 py-2 text-sm'>
              <span className='text-muted-foreground'>{region}</span>
              <span className='font-medium'>{count}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title='Sites' description='Détail de chaque site client.'>
        <div className='space-y-2'>
          {visits.map((visit) => (
            <VisitRow key={visit.id} visit={visit} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function VisitRow({ visit }: { visit: VisitView }) {
  const verified = visit.status === 'VERIFIE'
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <ListChecks className='size-4 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{visit.siteName}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {visit.clientName} / {visit.region}
          </p>
        </div>
      </div>
      <Badge variant={verified ? 'default' : 'secondary'}>{visit.statusLabel}</Badge>
    </div>
  )
}