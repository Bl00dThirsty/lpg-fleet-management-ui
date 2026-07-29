import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import { PageShell } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { buildDashboardView } from './dashboard'

export function FleetDetailPage() {
  const { fleetName } = useParams({ from: '/_authenticated/dashboard/fleets/$fleetName' })
  const dashboard = buildDashboardView()
  const fleet = dashboard.fleets.find(
    (candidate) => candidate.fleetName === decodeURIComponent(fleetName)
  )

  return (
    <PageShell fluid className='space-y-6 bg-muted/20'>
      <Link to='/dashboard' className='inline-flex w-fit'>
        <Button variant='outline' size='sm' className='gap-2'>
          <ArrowLeft className='size-4' />
          Retour au tableau de bord
        </Button>
      </Link>

      {!fleet ? (
        <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
          <p>Flotte introuvable.</p>
        </div>
      ) : (
        <section className='max-w-3xl space-y-4'>
          <PageHeader title={fleet.fleetName} description='Contribution et performance de la flotte.' />
          <div className='grid gap-3 sm:grid-cols-2'>
            <MiniStat label='Camions actifs' value={`${fleet.activeTruckCount}/${fleet.truckCount}`} />
            <MiniStat label='Part du volume' value={`${fleet.sharePercent}%`} />
            <MiniStat label='Transporté' value={`${fleet.transportedKg.toLocaleString('fr-FR')} kg`} />
            <MiniStat label='Livré' value={`${fleet.deliveredKg.toLocaleString('fr-FR')} kg`} />
            <MiniStat label='En attente' value={`${fleet.pendingKg.toLocaleString('fr-FR')} kg`} />
            <MiniStat label='Mobilisation' value={`${fleet.utilizationPercent}%`} />
            <MiniStat label='Service' value={`${fleet.onTimeRate}%`} />
            <MiniStat label='Risque' value={`${fleet.riskTruckCount} camion${fleet.riskTruckCount > 1 ? 's' : ''}`} />
          </div>
          <Card className='rounded-2xl border-border/60 shadow-none'>
            <CardHeader>
              <CardTitle>Missions associées</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {dashboard.routeContributions
                .filter((contribution) => contribution.carrierName === fleet.fleetName)
                .map((contribution) => (
                  <div
                    key={contribution.id}
                    className='flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm'
                  >
                    <div>
                      <p className='font-medium'>{contribution.reference}</p>
                      <p className='text-xs text-muted-foreground'>
                        {contribution.originLabel} → {contribution.destinationLabel}
                      </p>
                    </div>
                    <Badge variant='outline' className='border-transparent bg-muted/40 text-foreground'>
                      {contribution.loadedQuantityKg.toLocaleString('fr-FR')} kg
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </section>
      )}
    </PageShell>
  )
}

export function ReserveSiteDetailPage() {
  const { siteId } = useParams({ from: '/_authenticated/dashboard/sites/$siteId' })
  const dashboard = buildDashboardView()
  const site = dashboard.reserveSites.find((candidate) => candidate.siteId === siteId)

  return (
    <PageShell fluid className='space-y-6 bg-muted/20'>
      <Link to='/dashboard' className='inline-flex w-fit'>
        <Button variant='outline' size='sm' className='gap-2'>
          <ArrowLeft className='size-4' />
          Retour au tableau de bord
        </Button>
      </Link>

      {!site ? (
        <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
          <p>Site introuvable.</p>
        </div>
      ) : (
        <section className='max-w-3xl space-y-4'>
          <PageHeader title={site.siteName} description={`${site.city} — ${site.operator}`} />
          <div className='grid gap-3 sm:grid-cols-2'>
            <MiniStat label='Réserve' value={`${site.reserveKg.toLocaleString('fr-FR')} kg`} />
            <MiniStat label='Capacité' value={`${site.capacityKg.toLocaleString('fr-FR')} kg`} />
            <MiniStat label='Remplissage' value={`${site.fillPercent}%`} />
            <MiniStat label='Couverture' value={`${site.daysOfCover.toFixed(1)} jours`} />
            <MiniStat label='Inbound prévu' value={`${site.scheduledInboundKg.toLocaleString('fr-FR')} kg`} />
            <MiniStat label='Sorties' value={`${site.outboundKg.toLocaleString('fr-FR')} kg`} />
          </div>
          <Card className='rounded-2xl border-border/60 shadow-none'>
            <CardHeader>
              <CardTitle>Seuil cible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Objectif de remplissage minimal : {site.targetMinPercent}%.
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </PageShell>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='surface-sunken px-3 py-3 text-sm'>
      <p className='text-xs tracking-[0.16em] text-muted-foreground uppercase'>
        {label}
      </p>
      <p className='mt-2 font-medium'>{value}</p>
    </div>
  )
}

