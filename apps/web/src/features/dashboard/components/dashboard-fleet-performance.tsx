import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDashboardQuantity } from '../lib/format-quantity'

import type { DashboardFleetSummary } from '../data/dashboard'
import { activeUnits } from '../data/dashboard-quantity'

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl bg-muted/25 px-3 py-3 text-sm'>
      <p className='text-xs tracking-[0.16em] text-muted-foreground uppercase'>
        {label}
      </p>
      <p className='mt-2 font-medium'>{value}</p>
    </div>
  )
}

export function DashboardFleetPerformance({
  fleets,
  onSelectFleet,
}: {
  fleets: DashboardFleetSummary[]
  onSelectFleet: (fleetName: string) => void
}) {
  const { t } = useTranslation('dashboard')

  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader>
        <CardTitle>{t('fleetPerformance.title')}</CardTitle>
        <CardDescription>{t('fleetPerformance.description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {fleets.map((fleet) => (
          <div
            key={fleet.fleetName}
            className='rounded-2xl border border-border/60 bg-background px-4 py-4'
          >
            <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
              <div className='space-y-1.5'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span
                    className='size-2.5 rounded-full'
                    style={{ backgroundColor: fleet.color }}
                  />
                  <button
                    type='button'
                    className='font-medium underline-offset-4 hover:underline'
                    onClick={() => onSelectFleet(fleet.fleetName)}
                  >
                    {fleet.fleetName}
                  </button>
                  {activeUnits(fleet.transported).map((unit) => (
                    <span
                      key={unit}
                      className='rounded-md border border-transparent bg-muted/40 px-2 py-0.5 text-xs text-foreground'
                    >
                      {t('fleetPerformance.share', {
                        value: fleet.sharePercent[unit],
                      })}{' '}
                      {t(`units.${unit}`)}
                    </span>
                  ))}
                </div>
                <p className='text-sm text-muted-foreground'>
                  {t('fleetPerformance.activeTrucks', {
                    active: fleet.activeTruckCount,
                    total: fleet.truckCount,
                  })}
                  {' - '}
                  {t('fleetPerformance.activeMissions', {
                    count: fleet.activeTripCount,
                  })}
                </p>
              </div>
              <div className='text-right'>
                {activeUnits(fleet.transported).map((unit) => (
                  <p key={unit} className='text-lg font-semibold'>
                    {formatDashboardQuantity(fleet.transported[unit].value, unit)}
                  </p>
                ))}
                <p className='text-xs text-muted-foreground'>
                  {t('fleetPerformance.serviceRate', {
                    value: fleet.onTimeRate,
                  })}
                </p>
              </div>
            </div>

            <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              {activeUnits(fleet.transported).map((unit) => (
                <MiniStat
                  key={`delivered-${unit}`}
                  label={`${t('fleetPerformance.delivered')} · ${t(`units.${unit}`)}`}
                  value={formatDashboardQuantity(
                    fleet.delivered[unit].value,
                    unit,
                  )}
                />
              ))}
              {activeUnits(fleet.transported).map((unit) => (
                <MiniStat
                  key={`remaining-${unit}`}
                  label={`${t('fleetPerformance.pending')} · ${t(`units.${unit}`)}`}
                  value={formatDashboardQuantity(
                    fleet.remaining[unit].value,
                    unit,
                  )}
                />
              ))}
              <MiniStat
                label={t('fleetPerformance.mobilization')}
                value={`${fleet.utilizationPercent} %`}
              />
              <MiniStat
                label={t('fleetPerformance.risk')}
                value={t('fleetPerformance.truckCount', {
                  count: fleet.riskTruckCount,
                })}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
