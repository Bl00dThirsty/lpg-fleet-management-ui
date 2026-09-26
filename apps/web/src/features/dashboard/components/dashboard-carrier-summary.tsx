import { useTranslation } from 'react-i18next'
import { formatDashboardQuantity } from '../lib/format-quantity'

import type { DashboardFleetSummary } from '../data/dashboard'
import { activeUnits } from '../data/dashboard-quantity'

export function DashboardCarrierSummary({
  fleets,
}: {
  fleets: DashboardFleetSummary[]
}) {
  const { t } = useTranslation('dashboard')

  return (
    <div className='space-y-3 rounded-xl border border-border/60 p-4'>
      <div>
        <p className='text-sm font-medium'>{t('flow.carrierTitle')}</p>
        <p className='text-xs text-muted-foreground'>
          {t('flow.carrierDescription')}
        </p>
      </div>

      <div className='space-y-3'>
        {fleets.map((fleet) => (
          <div key={fleet.fleetName} className='space-y-2'>
            <div className='flex min-w-0 items-center gap-2 text-sm'>
              <span
                className='size-2.5 shrink-0 rounded-full'
                style={{ backgroundColor: fleet.color }}
              />
              <span className='truncate font-medium'>{fleet.fleetName}</span>
            </div>
            {activeUnits(fleet.transported).map((unit) => (
              <div key={unit} className='space-y-1'>
                <div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
                  <span>
                    {t('flow.share', { value: fleet.sharePercent[unit] })}
                  </span>
                  <span>{t(`units.${unit}`)}</span>
                </div>
                <div className='h-2 rounded-full bg-muted/40'>
                  <div
                    className='h-full rounded-full'
                    style={{
                      width: `${fleet.sharePercent[unit]}%`,
                      backgroundColor: fleet.color,
                    }}
                  />
                </div>
                <div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
                  <span>
                    {t('flow.loaded', {
                      value: formatDashboardQuantity(
                        fleet.transported[unit].value,
                        unit,
                      ),
                    })}
                  </span>
                  <span className='text-right'>
                    {t('flow.delivered', {
                      value: formatDashboardQuantity(
                        fleet.delivered[unit].value,
                        unit,
                      ),
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
