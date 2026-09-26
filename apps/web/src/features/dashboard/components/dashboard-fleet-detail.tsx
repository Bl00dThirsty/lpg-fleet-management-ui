import { useMemo } from 'react'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { PageShell } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'
import { buildDashboardView } from '../data/dashboard'
import type { DashboardFleetSummary } from '../data/dashboard'
import { activeUnits } from '../data/dashboard-quantity'
import {
  parseDashboardSearch,
  type DashboardSearch,
} from '../data/dashboard-query'
import { formatDashboardQuantity } from '../lib/format-quantity'

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

export function DashboardFleetDetail() {
  const { fleetName } = useParams({
    from: '/_authenticated/dashboard/fleets/$fleetName',
  })
  const { t, i18n } = useTranslation('dashboard')
  const search = useSearch({ strict: false }) as DashboardSearch
  const user = useAuthStore((state) => state.user)
  const storeTours = useToursStore((state) => state.tours)
  const storeCheckpoints = useToursStore((state) => state.checkpoints)

  // The period, range and fleet of the dashboard that opened this page travel in
  // the URL, so the detail view aggregates exactly the same rows.
  const query = useMemo(
    () =>
      parseDashboardSearch({
        period: search.period,
        fleet: search.fleet,
        from: search.from,
        to: search.to,
      }),
    [search.period, search.fleet, search.from, search.to],
  )
  const scope = useMemo(() => getScope(user), [user])
  const dashboard = useMemo(
    () => buildDashboardView(undefined, scope, query, t),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope, storeTours, storeCheckpoints, query, i18n.language],
  )
  const fleet: DashboardFleetSummary | undefined = dashboard.fleets.find(
    (candidate) => candidate.fleetName === fleetName,
  )

  return (
    <PageShell fluid className='space-y-6 bg-muted/20'>
      <Link to='/dashboard' search={search} className='inline-flex w-fit'>
        <Button variant='outline' size='sm' className='gap-2'>
          <ArrowLeft className='size-4' />
          {t('fleetDetails.back')}
        </Button>
      </Link>

      {!fleet ? (
        <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
          <p>{t('fleetDetails.notFound')}</p>
        </div>
      ) : (
        <section className='max-w-3xl space-y-4'>
          <PageHeader
            title={fleet.fleetName}
            description={t('fleetDetails.description')}
          />
          <div className='grid gap-3 sm:grid-cols-2'>
            <MiniStat
              label={t('fleetDetails.activeTrucks')}
              value={`${fleet.activeTruckCount}/${fleet.truckCount}`}
            />
            <MiniStat
              label={t('fleetDetails.volumeShare')}
              value={
                activeUnits(fleet.transported)
                  .map((unit) => `${fleet.sharePercent[unit]} % · ${t(`units.${unit}`)}`)
                  .join(' · ') || '—'
              }
            />
            {activeUnits(fleet.transported).map((unit) => (
              <MiniStat
                key={`transported-${unit}`}
                label={`${t('fleetDetails.transported')} · ${t(`units.${unit}`)}`}
                value={formatDashboardQuantity(
                  fleet.transported[unit].value,
                  unit,
                )}
              />
            ))}
            {activeUnits(fleet.transported).map((unit) => (
              <MiniStat
                key={`delivered-${unit}`}
                label={`${t('fleetDetails.delivered')} · ${t(`units.${unit}`)}`}
                value={formatDashboardQuantity(
                  fleet.delivered[unit].value,
                  unit,
                )}
              />
            ))}
            {activeUnits(fleet.transported).map((unit) => (
              <MiniStat
                key={`remaining-${unit}`}
                label={`${t('fleetDetails.pending')} · ${t(`units.${unit}`)}`}
                value={formatDashboardQuantity(
                  fleet.remaining[unit].value,
                  unit,
                )}
              />
            ))}
            <MiniStat
              label={t('fleetDetails.mobilization')}
              value={`${fleet.utilizationPercent} %`}
            />
            <MiniStat
              label={t('fleetDetails.service')}
              value={`${fleet.onTimeRate} %`}
            />
            <MiniStat
              label={t('fleetDetails.risk')}
              value={t('fleetPerformance.truckCount', {
                count: fleet.riskTruckCount,
              })}
            />
          </div>
          <Card className='rounded-2xl border-border/60 shadow-none'>
            <CardHeader>
              <CardTitle>{t('fleetDetails.missions')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {dashboard.routeContributions
                .filter(
                  (contribution) => contribution.carrierName === fleet.fleetName,
                )
                .map((contribution) => (
                  <div
                    key={contribution.id}
                    className='flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm'
                  >
                    <div>
                      <p className='font-medium'>{contribution.reference}</p>
                      <p className='text-xs text-muted-foreground'>
                        {contribution.originLabel} →{' '}
                        {contribution.destinationLabel}
                      </p>
                    </div>
                    <Badge
                      variant='outline'
                      className='border-transparent bg-muted/40 text-foreground'
                    >
                      {formatDashboardQuantity(
                        contribution.loaded.value,
                        contribution.unit,
                      )}
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
