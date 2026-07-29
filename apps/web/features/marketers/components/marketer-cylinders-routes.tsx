import { type Marketer } from '../marketers'
import { Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import { Badge } from '@lpg/ui'

export function MarketerCylindersRoutes({ marketer: _marketer }: { marketer: Marketer }) {
  const cylinderRoutes = [
    { id: 'RT-C-01', truck: 'LT 5555 ZZ', origin: 'Centre Emplisseur Bonaberi', destination: 'Boulangerie Saker', status: 'en cours', quantity: '45 Bouteilles' },
    { id: 'RT-C-02', truck: 'CE 1111 AA', origin: 'Centre Emplisseur Bafoussam', destination: 'Hotel Zingana', status: 'planifie', quantity: '20 Bouteilles' },
    { id: 'RT-C-03', truck: 'SU 4444 BB', origin: 'Depot Yaounde', destination: 'Brasserie', status: 'termine', quantity: '120 Bouteilles' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>Tournees 50 kg (B2B)</CardTitle>
      </CardHeader>
      <CardContent className='px-0 sm:px-6'>
        <div className='flex flex-col gap-3 sm:hidden'>
          {cylinderRoutes.map((route) => (
            <div key={route.id} className='border rounded-lg p-3 mx-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='font-medium text-sm'>{route.id}</p>
                  <p className='text-xs text-muted-foreground font-mono'>{route.truck}</p>
                </div>
                <Badge
                  variant={route.status === 'en cours' ? 'default' : route.status === 'planifie' ? 'outline' : 'secondary'}
                  className='shrink-0'
                >
                  {route.status}
                </Badge>
              </div>
              <div className='mt-2 space-y-1 text-xs'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Origine</span>
                  <span className='text-right'>{route.origin}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Destination</span>
                  <span className='text-right'>{route.destination}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Quantite</span>
                  <span className='font-medium text-blue-600 dark:text-blue-400'>{route.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='hidden sm:block overflow-x-auto rounded-md border'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/50 text-muted-foreground'>
              <tr>
                <th className='p-3 font-medium whitespace-nowrap'>ID Tournee</th>
                <th className='p-3 font-medium'>Camion</th>
                <th className='p-3 font-medium'>Origine</th>
                <th className='p-3 font-medium whitespace-nowrap'>Client / Destination</th>
                <th className='p-3 font-medium'>Quantite</th>
                <th className='p-3 font-medium'>Statut</th>
              </tr>
            </thead>
            <tbody>
              {cylinderRoutes.map((route) => (
                <tr key={route.id} className='border-t'>
                  <td className='p-3 font-medium whitespace-nowrap'>{route.id}</td>
                  <td className='p-3 font-mono whitespace-nowrap'>{route.truck}</td>
                  <td className='p-3'>{route.origin}</td>
                  <td className='p-3'>{route.destination}</td>
                  <td className='p-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap'>{route.quantity}</td>
                  <td className='p-3'>
                    <Badge variant={route.status === 'en cours' ? 'default' : route.status === 'planifie' ? 'outline' : 'secondary'}>
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
