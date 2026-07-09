import { type Transporter } from '../data/transporters'
import { getTransporterTrucks, truckStatusLabels } from '../data/transporter-trucks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  available: 'default',
  in_transit: 'outline',
  maintenance: 'secondary',
}

export function TransporterTrucksList({ transporter }: { transporter: Transporter }) {
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
                  <p className='font-medium text-sm font-mono'>{truck.plateNumber}</p>
                  <p className='text-xs text-muted-foreground'>{truck.makeModel}</p>
                </div>
                <Badge variant={statusVariant[truck.status]} className='shrink-0'>
                  {truckStatusLabels[truck.status]}
                </Badge>
              </div>
              <div className='mt-2 space-y-1 text-xs'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Chauffeur</span>
                  <span>{truck.assignedDriver}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Capacité</span>
                  <span className='font-medium'>{truck.tankCapacityTM} TM</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Année</span>
                  <span>{truck.year}</span>
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
                <th className='p-3 font-medium'>Modèle</th>
                <th className='p-3 font-medium'>Année</th>
                <th className='p-3 font-medium'>Capacité</th>
                <th className='p-3 font-medium'>Chauffeur</th>
                <th className='p-3 font-medium'>Statut</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => (
                <tr key={truck.id} className='border-t'>
                  <td className='p-3 font-mono font-medium whitespace-nowrap'>{truck.plateNumber}</td>
                  <td className='p-3'>{truck.makeModel}</td>
                  <td className='p-3'>{truck.year}</td>
                  <td className='p-3 font-medium whitespace-nowrap'>{truck.tankCapacityTM} TM</td>
                  <td className='p-3'>{truck.assignedDriver}</td>
                  <td className='p-3'>
                    <Badge variant={statusVariant[truck.status]}>
                      {truckStatusLabels[truck.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
              {trucks.length === 0 && (
                <tr>
                  <td colSpan={6} className='p-4 text-center text-muted-foreground'>
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
