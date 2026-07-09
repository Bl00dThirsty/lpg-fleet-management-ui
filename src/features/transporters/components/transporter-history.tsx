import { type Transporter } from '../data/transporters'
import { getTransporterRoutes } from '../data/transporter-routes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  'en cours': 'default',
  'terminé': 'secondary',
  'planifié': 'outline',
}

export function TransporterHistory({ transporter }: { transporter: Transporter }) {
  const routes = getTransporterRoutes(transporter.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>Historique des Tournées</CardTitle>
      </CardHeader>
      <CardContent className='px-0 sm:px-6'>
        {/* Mobile: card list */}
        <div className='flex flex-col gap-3 sm:hidden'>
          {routes.map((route) => (
            <div key={route.id} className='border rounded-lg p-3 mx-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='font-medium text-sm'>{route.id}</p>
                  <p className='text-xs text-muted-foreground font-mono'>{route.truckPlate}</p>
                </div>
                <Badge variant={statusVariant[route.status]} className='shrink-0'>
                  {route.status}
                </Badge>
              </div>
              <div className='mt-2 space-y-1 text-xs'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Date</span>
                  <span>{route.date}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Origine</span>
                  <span className='text-right'>{route.origin}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Destination</span>
                  <span className='text-right'>{route.destination}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Volume</span>
                  <span className='font-medium text-emerald-600 dark:text-emerald-400'>{route.volume}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Marketer</span>
                  <span className='font-medium'>{route.marketer}</span>
                </div>
              </div>
            </div>
          ))}
          {routes.length === 0 && (
            <p className='p-4 text-center text-muted-foreground'>
              Aucune tournée enregistrée pour ce transporter.
            </p>
          )}
        </div>

        {/* Desktop: table */}
        <div className='hidden sm:block overflow-x-auto rounded-md border'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/50 text-muted-foreground'>
              <tr>
                <th className='p-3 font-medium whitespace-nowrap'>ID</th>
                <th className='p-3 font-medium'>Date</th>
                <th className='p-3 font-medium'>Camion</th>
                <th className='p-3 font-medium'>Origine</th>
                <th className='p-3 font-medium'>Destination</th>
                <th className='p-3 font-medium'>Volume</th>
                <th className='p-3 font-medium'>Marketer</th>
                <th className='p-3 font-medium'>Statut</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} className='border-t'>
                  <td className='p-3 font-medium whitespace-nowrap'>{route.id}</td>
                  <td className='p-3 whitespace-nowrap'>{route.date}</td>
                  <td className='p-3 font-mono whitespace-nowrap'>{route.truckPlate}</td>
                  <td className='p-3'>{route.origin}</td>
                  <td className='p-3'>{route.destination}</td>
                  <td className='p-3 font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap'>{route.volume}</td>
                  <td className='p-3 font-medium'>{route.marketer}</td>
                  <td className='p-3'>
                    <Badge variant={statusVariant[route.status]}>
                      {route.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={8} className='p-4 text-center text-muted-foreground'>
                    Aucune tournée enregistrée pour ce transporter.
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
