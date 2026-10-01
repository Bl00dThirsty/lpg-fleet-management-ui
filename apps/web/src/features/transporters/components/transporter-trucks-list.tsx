import { type Organization } from '@lpg/types'
import { getTransporterTrucks } from '@/features/transporters/data/transporter-trucks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function TransporterTrucksList({ transporter }: { transporter: Organization }) {
  const trucks = getTransporterTrucks(transporter.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base sm:text-lg'>Camions de {transporter.name}</CardTitle>
      </CardHeader>
      <CardContent className='px-0 sm:px-6'>
        {/* Mobile: card list */}
        <div className='flex flex-col gap-3 sm:hidden'>
          {trucks.map((truck) => (
            <div key={truck.id} className='border rounded-lg p-3 mx-3'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='font-medium text-sm font-mono'>{truck.license_plate}</p>
                  <p className='text-xs text-muted-foreground'>{truck.type}</p>
                </div>
                <Badge variant={truck.is_active ? 'default' : 'secondary'} className='shrink-0'>
                  {truck.is_active ? 'Disponible' : 'Inactif'}
                </Badge>
              </div>
              <div className='mt-2 space-y-1 text-xs'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Capacité</span>
                  <span className='font-medium'>{truck.max_volume ?? 0} TM</span>
                </div>
              </div>
            </div>
          ))}
          {trucks.length === 0 && (
            <p className='p-4 text-center text-muted-foreground'>
              Aucun camion enregistré pour ce transporter.
            </p>
          )}
        </div>

        {/* Desktop: table */}
        <div className='hidden sm:block overflow-x-auto rounded-md border'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/50 text-muted-foreground'>
              <tr>
                <th className='p-3 font-medium'>Plaque</th>
                <th className='p-3 font-medium'>Type</th>
                <th className='p-3 font-medium'>Capacité</th>
                <th className='p-3 font-medium'>Statut</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => (
                <tr key={truck.id} className='border-t'>
                  <td className='p-3 font-mono font-medium whitespace-nowrap'>{truck.license_plate}</td>
                  <td className='p-3'>{truck.type}</td>
                  <td className='p-3 font-medium whitespace-nowrap'>{truck.max_volume ?? 0} TM</td>
                  <td className='p-3'>
                    <Badge variant={truck.is_active ? 'default' : 'secondary'}>
                      {truck.is_active ? 'Disponible' : 'Inactif'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {trucks.length === 0 && (
                <tr>
                  <td colSpan={4} className='p-4 text-center text-muted-foreground'>
                    Aucun camion enregistré pour ce transporter.
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