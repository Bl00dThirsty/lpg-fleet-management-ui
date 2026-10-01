import { type Organization } from '@lpg/types'
import { getToursForTransporter, type TransporterTourWithDetails } from '../data/transporter-tours'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  PLANNED: 'secondary',
  PENDINGTRANSPORTERACK: 'outline',
  ACKNOWLEDGED: 'default',
  INPROGRESS: 'default',
  CHECKPOINTACTIVE: 'default',
  CLOSED: 'secondary',
  CANCELLED: 'destructive',
}

const executionModeBadge: Record<string, 'default' | 'secondary' | 'outline'> = {
  INTERNAL: 'default',
  EXTERNAL: 'secondary',
}

function getDriverName(tour: TransporterTourWithDetails): string {
  if (!tour.driver) return '—'
  const firstName = tour.driver.first_name?.trim() ?? ''
  const lastName = tour.driver.last_name?.trim() ?? ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || '—'
}

export function TransporterHistory({ transporter }: { transporter: Organization }) {
  const tours = getToursForTransporter(transporter.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>Historique des Tournées</CardTitle>
      </CardHeader>
      <CardContent className='px-0 sm:px-6'>
        {/* Mobile: card list */}
        <div className='flex flex-col gap-3 sm:hidden'>
          {tours.map((tour) => (
            <div key={tour.id} className='border rounded-lg p-3 mx-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='font-medium text-sm'>{tour.marketeur?.name ?? '—'}</p>
                  <p className='text-xs text-muted-foreground font-mono'>{tour.id}</p>
                </div>
                <Badge variant={statusVariant[tour.status] ?? 'outline'} className='shrink-0'>
                  {tour.statusLabel}
                </Badge>
              </div>
              <div className='mt-2 space-y-1 text-xs'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Marketeur</span>
                  <span className='text-right font-medium'>{tour.marketeur?.name ?? '—'}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Volume</span>
                  <span className='text-right'>{tour.requested_quantity} {tour.type === 'VRAC' ? 'TM' : 'btl'}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Mode</span>
                  <Badge variant={executionModeBadge[tour.execution_mode] ?? 'outline'} className='text-[10px]'>
                    {tour.execution_mode === 'INTERNAL' ? 'Interne' : 'Externe'}
                  </Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Camion</span>
                  <span className='text-right'>{tour.vehicle?.license_plate ?? '—'}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Chauffeur</span>
                  <span className='text-right font-medium'>{getDriverName(tour)}</span>
                </div>
              </div>
            </div>
          ))}
          {tours.length === 0 && (
            <p className='p-4 text-center text-muted-foreground'>
              Aucune tournée enregistrée pour ce transporteur.
            </p>
          )}
        </div>

        {/* Desktop: table */}
        <div className='hidden sm:block overflow-x-auto rounded-md border'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/50 text-muted-foreground'>
              <tr>
                <th className='p-3 font-medium whitespace-nowrap'>Marketeur</th>
                <th className='p-3 font-medium'>ID Tournée</th>
                <th className='p-3 font-medium'>Volume</th>
                <th className='p-3 font-medium'>Mode</th>
                <th className='p-3 font-medium'>Camion</th>
                <th className='p-3 font-medium'>Chauffeur</th>
                <th className='p-3 font-medium'>Statut</th>
                <th className='p-3 font-medium'>Démarré le</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((tour) => (
                <tr key={tour.id} className='border-t'>
                  <td className='p-3 font-medium whitespace-nowrap'>{tour.marketeur?.name ?? '—'}</td>
                  <td className='p-3 font-mono whitespace-nowrap'>{tour.id}</td>
                  <td className='p-3 whitespace-nowrap'>
                    {tour.requested_quantity} {tour.type === 'VRAC' ? 'TM' : 'btl'}
                  </td>
                  <td className='p-3 whitespace-nowrap'>
                    <Badge variant={executionModeBadge[tour.execution_mode] ?? 'outline'} className='text-[10px]'>
                      {tour.execution_mode === 'INTERNAL' ? 'Interne' : 'Externe'}
                    </Badge>
                  </td>
                  <td className='p-3 whitespace-nowrap'>{tour.vehicle?.license_plate ?? '—'}</td>
                  <td className='p-3 whitespace-nowrap'>{getDriverName(tour)}</td>
                  <td className='p-3'>
                    <Badge variant={statusVariant[tour.status] ?? 'outline'}>
                      {tour.statusLabel}
                    </Badge>
                  </td>
                  <td className='p-3 whitespace-nowrap'>
                    {tour.started_at ? format(new Date(tour.started_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </td>
                </tr>
              ))}
              {tours.length === 0 && (
                <tr>
                  <td colSpan={8} className='p-4 text-center text-muted-foreground'>
                    Aucune tournée enregistrée pour ce transporteur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}