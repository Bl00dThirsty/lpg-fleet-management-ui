import { useMemo } from 'react'
import { Building2, Package, Truck, Users, TrendingUp, PieChart, BarChart2, Activity } from 'lucide-react'
import { MetricCardWithChart, TrendLine, StatusDistribution, CompositionBar } from '@/components/charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMarketerDashboardData } from '../data/marketer-analytics'
import type { Organization } from '@lpg/types'
import { useUsersStore } from '@/store/users-store'

const STATUS_CHART_CONFIG = {
  PLANNED: { label: 'Planifiées', color: 'hsl(210, 100%, 50%)' },
  INPROGRESS: { label: 'En cours', color: 'hsl(45, 100%, 50%)' },
  CHECKPOINTACTIVE: { label: 'Point actif', color: 'hsl(25, 100%, 50%)' },
  ACKNOWLEDGED: { label: 'Accusée', color: 'hsl(160, 100%, 35%)' },
  PENDINGTRANSPORTERACK: { label: 'Attente transporteur', color: 'hsl(280, 100%, 50%)' },
  CLOSED: { label: 'Clôturées', color: 'hsl(120, 100%, 35%)' },
  CANCELLED: { label: 'Annulées', color: 'hsl(0, 100%, 50%)' },
}

const MODE_CHART_CONFIG = {
  INTERNAL: { label: 'Interne', color: 'hsl(210, 100%, 50%)' },
  EXTERNAL: { label: 'Externe', color: 'hsl(160, 100%, 35%)' },
}

const VOLUME_CHART_CONFIG = {
  vrac: { label: 'Vrac (TM)', color: 'hsl(210, 100%, 50%)' },
  bouteilles: { label: 'Bouteilles (btl)', color: 'hsl(160, 100%, 35%)' },
}

const COMPLETION_CHART_CONFIG = {
  rate: { label: 'Taux de livraison (%)', color: 'hsl(120, 100%, 35%)' },
}

/**
 * Headline stats + charts for a marketer, aggregated from live collections.
 */
export function MarketerOverview({ marketer }: { marketer: Organization }) {
  const users = useUsersStore((s) => s.users)
  const dashboardData = useMemo(() => getMarketerDashboardData(marketer.id), [marketer.id])

  const stats = useMemo(() => {
    const sites = (curated.sites as Site[]).filter((s) => s.org_id === marketer.id)
    const vehicles = (curated.vehicles as Vehicle[]).filter((v) => v.org_id === marketer.id)
    const clientSites = (curated.client_sites as ClientSite[]).filter(
      (cs) => cs.current_marketeur_org_id === marketer.id,
    )
    const personnel = users.filter((u) => u.org_id === marketer.id)
    return {
      sites: sites.length,
      vehicles: vehicles.length,
      personnel: personnel.length,
      clientSites: clientSites.length,
    }
  }, [marketer.id, users])

  return (
    <div className='space-y-6'>
      {/* KPI Cards */}
      <div className='grid gap-4 grid-cols-2 lg:grid-cols-4'>
        <MetricCardWithChart
          label='Sites associés'
          value={stats.sites}
          icon={Building2}
          sparkline={[stats.sites, stats.vehicles, stats.personnel, stats.clientSites]}
          className='rounded-2xl border-border/60 shadow-none'
        />
        <MetricCardWithChart
          label='Camions'
          value={stats.vehicles}
          icon={Truck}
          sparkline={[stats.vehicles, stats.sites, stats.clientSites, stats.personnel]}
          className='rounded-2xl border-border/60 shadow-none'
        />
        <MetricCardWithChart
          label='Utilisateurs'
          value={stats.personnel}
          icon={Users}
          sparkline={[stats.personnel, stats.clientSites, stats.vehicles, stats.sites]}
          className='rounded-2xl border-border/60 shadow-none'
        />
        <MetricCardWithChart
          label='Sites clients'
          value={stats.clientSites}
          icon={Package}
          sparkline={[stats.clientSites, stats.personnel, stats.sites, stats.vehicles]}
          className='rounded-2xl border-border/60 shadow-none'
        />
      </div>

      {/* Charts Row 1 */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4 text-primary' />
              Volume livré (6 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine
              points={dashboardData.volumeTrends.map((d) => ({ label: d.period, value: d.vrac }))}
              config={VOLUME_CHART_CONFIG}
              height={280}
              unit='TM'
            />
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4 text-primary' />
              Volume bouteilles (6 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine
              points={dashboardData.volumeTrends.map((d) => ({ label: d.period, value: d.bouteilles }))}
              config={VOLUME_CHART_CONFIG}
              height={280}
              unit='btl'
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <PieChart className='h-4 w-4 text-primary' />
              Répartition des statuts de tournées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDistribution
              data={dashboardData.tourStatusDist.map((d) => ({
                key: d.status,
                label: d.label,
                value: d.count,
              }))}
              config={STATUS_CHART_CONFIG}
              height={280}
            />
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart2 className='h-4 w-4 text-primary' />
              Mode d'exécution des tournées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDistribution
              data={dashboardData.executionModeDist.map((d) => ({
                key: d.mode,
                label: d.mode,
                value: d.count,
              }))}
              config={MODE_CHART_CONFIG}
              height={280}
              donut={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-4 w-4 text-primary' />
              Taux de livraison vs demandé (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine
              points={dashboardData.completionRates.map((d) => ({ label: d.period, value: d.rate }))}
              config={COMPLETION_CHART_CONFIG}
              height={280}
              unit='%'
            />
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-4 w-4 text-primary' />
              Couverture des sites clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompositionBar
              data={[
                { label: 'Total', value: dashboardData.clientSiteCoverage.total },
                { label: 'Actifs', value: dashboardData.clientSiteCoverage.active },
                { label: 'Vérifiés', value: dashboardData.clientSiteCoverage.verified },
              ]}
              config={{
                Total: { label: 'Total', color: 'hsl(210, 100%, 50%)' },
                Actifs: { label: 'Actifs', color: 'hsl(160, 100%, 35%)' },
                Vérifiés: { label: 'Vérifiés', color: 'hsl(45, 100%, 50%)' },
              }}
              horizontal
              height={200}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Re-export needed types
import { curated } from '@lpg/mock-data'
import type { Site, Vehicle, ClientSite } from '@lpg/types'