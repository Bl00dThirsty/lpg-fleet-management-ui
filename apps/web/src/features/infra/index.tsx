import { ExternalLink, ServerCog } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { getInfraDashboards } from './data/infra'

export function InfraPage() {
  const dashboards = getInfraDashboards()
  return (
    <PageShell>
      <PageHeader
        title='Dashboards Grafana'
        description='Emplacements dédiés aux tableaux de bord Grafana (intégration à venir).'
      />

      <SectionCard
        title='Tableaux de bord'
        description='Ces panneaux seront alimentés par le serveur Grafana de la plateforme.'
      >
        <div className='space-y-3'>
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4'
            >
              <div className='flex min-w-0 items-center gap-3'>
                <ServerCog className='size-5 shrink-0 text-primary' />
                <div className='min-w-0'>
                  <p className='text-sm font-medium'>{dashboard.title}</p>
                  <p className='truncate text-xs text-muted-foreground'>{dashboard.description}</p>
                </div>
              </div>
              <a
                href='/grafana'
                className='inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline'
              >
                <ExternalLink className='size-3.5' />
                Ouvrir Grafana
              </a>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}