import { useMemo } from 'react'
import { Truck, Route, CheckCircle, TrendingUp, BarChart2, Package, CheckCircle2 } from 'lucide-react'
import { MetricCardWithChart, TrendLine, StatusDistribution, CompositionBar } from '@/components/charts'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@lpg/ui'
import { getTransporterDashboardData } from '../data/transporter-analytics'
import type { Organization } from '@lpg/types'

const VOLUME_CHART_CONFIG = {
  vrac: { label: 'Vrac (TM)', color: 'hsl(210, 100%, 50%)' },
  bouteilles: { label: 'Bouteilles (btl)', color: 'hsl(160, 100%, 35%)' },
}

/**
 * Headline stats + charts for a transporter, aggregated from live collections.
 */
export function TransporterOverview({ transporter }: { transporter: Organization }) {
  const dashboardData = useMemo(() => getTransporterDashboardData(transporter.id), [transporter.id])

  const stats = {
    totalFleet: dashboardData.fleetStats.total,
    activeFleet: dashboardData.fleetStats.active,
    totalCapacity: dashboardData.fleetStats.totalCapacity,
    activeTours: dashboardData.tourStats.inProgress,
    totalTours: dashboardData.tourStats.total,
    pendingAck: dashboardData.tourStats.pendingAck,
    completedTours: dashboardData.tourStats.completed,
  }

  return (
    <div className='space-y-6'>
      {/* KPI Cards */}
      <div className='grid gap-4 grid-cols-2 lg:grid-cols-4'>
        <MetricCardWithChart
          label='Flotte Totale'
          value={stats.totalFleet}
          icon={Truck}
          delta={stats.totalFleet > 0 ? Math.round((stats.activeFleet / stats.totalFleet) * 100) : 0}
          actions={
            <Badge variant='secondary' className='mt-2'>
              {stats.activeFleet} actifs
            </Badge>
          }
          className='rounded-2xl border-border/60 shadow-none'
        />

        <MetricCardWithChart
          label='Tournées en cours'
          value={stats.activeTours}
          icon={Route}
          actions={
            <Badge variant='secondary' className='mt-2'>
              sur {stats.totalTours} total
            </Badge>
          }
          className='rounded-2xl border-border/60 shadow-none'
        />

        <MetricCardWithChart
          label="En attente d'accusé"
          value={stats.pendingAck}
          icon={CheckCircle2}
          actions={
            <Badge variant='secondary' className='mt-2'>
              à reconnaître
            </Badge>
          }
          className='rounded-2xl border-border/60 shadow-none'
        />

        <MetricCardWithChart
          label='Capacité Totale'
          value={Math.round(stats.totalCapacity)}
          icon={Package}
          actions={
            <Badge variant='secondary' className='mt-2'>
              TM
            </Badge>
          }
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
              <BarChart2 className='h-4 w-4 text-primary' />
              Statut des tournées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDistribution
              data={dashboardData.tourStatusDist.map((d) => ({
                key: d.status,
                label: d.label,
                value: d.count,
              }))}
              config={{
                PLANNED: { label: 'Planifiées', color: 'hsl(210, 100%, 50%)' },
                INPROGRESS: { label: 'En cours', color: 'hsl(45, 100%, 50%)' },
                CHECKPOINTACTIVE: { label: 'Point actif', color: 'hsl(25, 100%, 50%)' },
                ACKNOWLEDGED: { label: 'Accusée', color: 'hsl(160, 100%, 35%)' },
                PENDINGTRANSPORTERACK: { label: 'Attente transporteur', color: 'hsl(280, 100%, 50%)' },
                CLOSED: { label: 'Clôturées', color: 'hsl(120, 100%, 35%)' },
                CANCELLED: { label: 'Annulées', color: 'hsl(0, 100%, 50%)' },
              }}
              height={280}
            />
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-4 w-4 text-primary' />
              Types de tournées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDistribution
              data={dashboardData.tourTypeDist.map((d) => ({
                key: d.type,
                label: d.type === 'VRAC' ? 'Vrac (TM)' : 'Bouteilles 50kg (btl)',
                value: d.count,
              }))}
              config={{
                VRAC: { label: 'Vrac (TM)', color: 'hsl(210, 100%, 50%)' },
                BOUTEILLES50KG: { label: 'Bouteilles 50kg (btl)', color: 'hsl(160, 100%, 35%)' },
              }}
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
              <TrendingUp className='h-4 w-4 text-primary' />
              Utilisation de la flotte (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine
              points={dashboardData.fleetUtilization.map((d) => ({ label: d.period, value: d.utilizationPct }))}
              config={{
                utilization: { label: 'Utilisation (%)', color: 'hsl(160, 100%, 35%)' },
              }}
              height={280}
              unit='%'
            />
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4 text-primary' />
              Utilisation de la capacité (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine
              points={dashboardData.capacityUtilization.map((d) => ({ label: d.period, value: d.utilizationPct }))}
              config={{
                utilization: { label: 'Capacité utilisée (%)', color: 'hsl(210, 100%, 50%)' },
              }}
              height={280}
              unit='%'
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 4 */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-primary' />
              Pipeline d'accusé de réception
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompositionBar
              data={dashboardData.ackPipeline.map((d) => ({
                label: d.stage,
                value: d.count,
              }))}
              config={{
                Créées: { label: 'Créées', color: 'hsl(210, 100%, 50%)' },
                Assignées: { label: 'Assignées', color: 'hsl(45, 100%, 50%)' },
                Accusées: { label: 'Accusées', color: 'hsl(160, 100%, 35%)' },
                Clôturées: { label: 'Clôturées', color: 'hsl(120, 100%, 35%)' },
              }}
              horizontal
              height={200}
            />
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-border/60 shadow-none'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-4 w-4 text-primary' />
              Type de tournées (Vrac vs Bouteilles)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompositionBar
              data={[
                { label: 'Vrac (TM)', value: dashboardData.tourTypeDist.find((d) => d.type === 'VRAC')?.count ?? 0 },
                { label: 'Bouteilles (btl)', value: dashboardData.tourTypeDist.find((d) => d.type === 'BOUTEILLES50KG')?.count ?? 0 },
              ]}
              config={{
                'Vrac (TM)': { label: 'Vrac (TM)', color: 'hsl(210, 100%, 50%)' },
                'Bouteilles (btl)': { label: 'Bouteilles (btl)', color: 'hsl(160, 100%, 35%)' },
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