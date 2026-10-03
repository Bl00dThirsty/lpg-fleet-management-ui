import { useMemo } from 'react'
import { Plug } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { getIntegrationSummary, getIntegrations, type IntegrationView } from './data/integrations'

export function IntegrationsPage() {
  const integrations = useMemo(() => getIntegrations(), [])
  const summary = useMemo(() => getIntegrationSummary(), [])

  return (
    <PageShell>
      <PageHeader
        title='État intégrations'
        description='Connexions de services intégrés et leur activité d’authentification.'
      />

      <div className='grid gap-4 sm:grid-cols-4'>
        <KpiTile label='Intégrations' value={String(summary.total)} />
        <KpiTile label='Actives' value={String(summary.active)} />
        <KpiTile label='Auth réussies' value={summary.totalSuccess.toLocaleString('fr-FR')} />
        <KpiTile label='Échecs' value={String(summary.totalFailures)} />
      </div>

      <SectionCard title='Intégrations' description='État de chaque connexion client API.'>
        <div className='space-y-2'>
          {integrations.map((integration) => (
            <IntegrationRow key={integration.id} integration={integration} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function IntegrationRow({ integration }: { integration: IntegrationView }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <Plug className='size-4 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{integration.serviceName}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {integration.successCount} succès / {integration.failureCount} échecs
            {integration.certificateExpiry ? ` / Cert. ${integration.certificateExpiry.slice(0, 10)}` : ''}
          </p>
        </div>
      </div>
      <Badge variant={integration.isActive ? 'default' : 'secondary'}>
        {integration.isActive ? 'Active' : 'Inactive'}
      </Badge>
    </div>
  )
}