import { useTranslation } from 'react-i18next'
import { formatDashboardQuantity } from '../lib/format-quantity'
import type { DashboardRouteContribution } from '../data/dashboard'

export function DashboardRouteTable({
  contributions,
  mode,
}: {
  contributions: DashboardRouteContribution[]
  mode: 'transported' | 'delivered'
}) {
  const { t } = useTranslation('dashboard')
  const rows = [...contributions]
    .filter((contribution) =>
      mode === 'delivered' ? contribution.delivered.value > 0 : true,
    )
    .sort((left, right) =>
      mode === 'delivered'
        ? right.delivered.value - left.delivered.value
        : right.loaded.value - left.loaded.value,
    )

  return (
    <div className='overflow-x-auto rounded-xl border border-border/60'>
      <table className='w-full min-w-[760px] text-sm'>
        <thead className='bg-muted/30 text-xs text-muted-foreground'>
          <tr>
            <th scope='col' className='px-4 py-3 text-left font-medium'>
              {t('table.mission')}
            </th>
            <th scope='col' className='px-4 py-3 text-left font-medium'>
              {t('table.transporter')}
            </th>
            <th scope='col' className='px-4 py-3 text-left font-medium'>
              {t('table.truck')}
            </th>
            <th scope='col' className='px-4 py-3 text-right font-medium'>
              {mode === 'delivered' ? t('table.delivered') : t('table.loaded')}
            </th>
            <th scope='col' className='px-4 py-3 text-right font-medium'>
              {t('table.remaining')}
            </th>
            <th scope='col' className='px-4 py-3 text-left font-medium'>
              {t('table.responsible')}
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border/60'>
          {rows.map((contribution) => {
            const volume =
              mode === 'delivered' ? contribution.delivered : contribution.loaded
            const share =
              mode === 'delivered'
                ? contribution.deliveredSharePercent
                : contribution.transportedSharePercent

            return (
              <tr key={contribution.id} className='bg-background'>
                <td className='px-4 py-3 align-top'>
                  <p className='font-medium'>{contribution.reference}</p>
                  <p className='text-xs text-muted-foreground'>
                    {contribution.originLabel} - {contribution.destinationLabel}
                  </p>
                </td>
                <td className='px-4 py-3 align-top'>
                  <p className='font-medium'>{contribution.carrierName}</p>
                  <p className='text-xs text-muted-foreground'>
                    {contribution.customerName}
                  </p>
                </td>
                <td className='px-4 py-3 align-top'>
                  <p className='font-medium'>{contribution.plateNumber}</p>
                  <p className='text-xs text-muted-foreground'>
                    {contribution.driverName}
                  </p>
                </td>
                <td className='px-4 py-3 text-right align-top'>
                  <p className='font-medium'>
                    {formatDashboardQuantity(volume.value, volume.unit)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {share} % {t('table.shareOfTotal')}
                  </p>
                </td>
                <td className='px-4 py-3 text-right align-top'>
                  <p className='font-medium'>
                    {formatDashboardQuantity(
                      contribution.remaining.value,
                      contribution.remaining.unit,
                    )}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t(`status.${contribution.status}`)}
                  </p>
                </td>
                <td className='px-4 py-3 align-top'>
                  <p className='font-medium'>{contribution.missionLead}</p>
                  <p className='text-xs text-muted-foreground'>
                    {contribution.onTime
                      ? t('table.etaOnTime')
                      : t('table.etaToFollow')}
                  </p>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
