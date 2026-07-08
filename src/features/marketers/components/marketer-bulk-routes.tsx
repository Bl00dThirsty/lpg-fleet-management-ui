import { type Marketer } from '../data/marketers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function MarketerBulkRoutes({ marketer: _marketer }: { marketer: Marketer }) {
  // Données simulées pour les tournées vrac
  const bulkRoutes = [
    { id: 'RT-V-01', truck: 'LT 1234 AB', origin: 'Dépôt Bonaberi', destination: 'Station Akwa', status: 'en cours', volume: '18 000 L' },
    { id: 'RT-V-02', truck: 'CE 9876 XY', origin: 'SCDP Yaounde', destination: 'Station Nsam', status: 'terminé', volume: '22 000 L' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>Tournées Vrac (GPL Liquide)</CardTitle>
      </CardHeader>
      <CardContent className='px-0 sm:px-6'>
        {/* Mobile: card list */}
        <div className='flex flex-col gap-3 sm:hidden'>
          {bulkRoutes.map((route) => (
            <div key={route.id} className='border rounded-lg p-3 mx-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='font-medium text-sm'>{route.id}</p>
                  <p className='text-xs text-muted-foreground font-mono'>{route.truck}</p>
                </div>
                <Badge variant={route.status === 'en cours' ? 'default' : 'secondary'} className='shrink-0'>
                  {route.status}
                </Badge>
              </div>
              <div className='mt-2 space-y-1 text-xs'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Origine</span>
                  <span>{route.origin}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Destination</span>
                  <span>{route.destination}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Volume</span>
                  <span className='font-medium text-emerald-600 dark:text-emerald-400'>{route.volume}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: table */}
        <div className='hidden sm:block overflow-x-auto rounded-md border'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/50 text-muted-foreground'>
              <tr>
                <th className='p-3 font-medium whitespace-nowrap'>ID Tournée</th>
                <th className='p-3 font-medium'>Camion</th>
                <th className='p-3 font-medium'>Origine</th>
                <th className='p-3 font-medium'>Destination</th>
                <th className='p-3 font-medium'>Volume</th>
                <th className='p-3 font-medium'>Statut</th>
              </tr>
            </thead>
            <tbody>
              {bulkRoutes.map((route) => (
                <tr key={route.id} className='border-t'>
                  <td className='p-3 font-medium whitespace-nowrap'>{route.id}</td>
                  <td className='p-3 font-mono whitespace-nowrap'>{route.truck}</td>
                  <td className='p-3'>{route.origin}</td>
                  <td className='p-3'>{route.destination}</td>
                  <td className='p-3 font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap'>{route.volume}</td>
                  <td className='p-3'>
                    <Badge variant={route.status === 'en cours' ? 'default' : 'secondary'}>
                      {route.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
