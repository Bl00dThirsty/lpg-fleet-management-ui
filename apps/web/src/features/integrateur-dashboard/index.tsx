import { hasEffectivePermission } from '@lpg/permissions'
import { useAuthStore } from '@/store/auth-store'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { AttentionList } from './components/attention-list'
import { DevicesTable } from './components/devices-table'
import { KpiTiles } from './components/kpi-tiles'
import { StatusBreakdown } from './components/status-breakdown'
import { TypeBreakdown } from './components/type-breakdown'
import {
  loadDashboardDevices,
  toIntegrateurDashboardData,
} from './data/integrateur-dashboard'
import { pickRecentlySynced } from './lib/dashboard-metrics'

const RECENT_DEVICES_LIMIT = 5

export function IntegrateurDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const canRead =
    !!user &&
    hasEffectivePermission(
      user.system_role,
      'integrateur-dashboard.read',
      user.custom_roles
    )

  const query = useQuery({
    queryKey: ['devices', 'dashboard', user?.id],
    queryFn: loadDashboardDevices,
    enabled: canRead,
  })

  if (!canRead)
    return (
      <PageShell>
        <p role='alert'>{"Vous n'avez pas accès à ce tableau de bord."}</p>
      </PageShell>
    )
  if (query.isPending) return <RouteSkeleton />
  if (query.isError) {
    return (
      <PageShell>
        <PageHeader title='Tableau de bord intégrateur' />
        <div role='alert' className='space-y-3'>
          <p>Impossible de charger les appareils. Veuillez réessayer.</p>
          <Button
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            {query.isFetching ? 'Chargement…' : 'Réessayer'}
          </Button>
        </div>
      </PageShell>
    )
  }

  const data = toIntegrateurDashboardData(query.data)

  return (
    <PageShell fluid className='space-y-6 bg-muted/20 pb-10'>
      <PageHeader
        title='Tableau de bord intégrateur'
        description='Suivi des appareils GPS, PDA et lecteurs RFID : affectations, états et dernières synchronisations.'
      />
      <p role='status' className='text-xs text-muted-foreground'>
        {query.isFetching
          ? 'Actualisation en cours…'
          : `Dernière actualisation : ${new Date(query.dataUpdatedAt).toLocaleString('fr-FR')}`}
      </p>
      {(import.meta.env.VITE_API_MODE ?? 'fake') === 'fake' && (
        <p className='text-xs text-muted-foreground'>
          Données de démonstration
        </p>
      )}
      <KpiTiles kpis={data.kpis} />
      <section className='grid gap-6 lg:grid-cols-2'>
        <StatusBreakdown slices={data.statusSlices} />
        <TypeBreakdown slices={data.typeSlices} />
      </section>
      <section className='grid gap-6 lg:grid-cols-2'>
        <SectionCard
          title='Appareils hors ligne'
          description='Appareils à diagnostiquer pour rétablir la connexion.'
        >
          <AttentionList rows={data.attention} />
        </SectionCard>
        <SectionCard
          title='Dernières synchronisations'
          description={`Les ${RECENT_DEVICES_LIMIT} appareils synchronisés le plus récemment.`}
        >
          <DevicesTable
            devices={pickRecentlySynced(
              data.devices.filter((device) => device.last_sync),
              RECENT_DEVICES_LIMIT
            )}
          />
        </SectionCard>
      </section>
    </PageShell>
  )
}
