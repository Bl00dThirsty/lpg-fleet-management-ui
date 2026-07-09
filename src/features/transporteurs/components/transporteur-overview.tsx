import { type Transporteur } from '../data/transporteurs'
import { getTransporteurTrucks } from '../data/transporteur-trucks'
import { getTransporteurRoutes } from '../data/transporteur-routes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, Route, Phone, Mail, MapPin } from 'lucide-react'

export function TransporteurOverview({ transporteur }: { transporteur: Transporteur }) {
  const trucks = getTransporteurTrucks(transporteur.id)
  const routes = getTransporteurRoutes(transporteur.id)
  const activeTrucks = trucks.filter((t) => t.status === 'in_transit').length
  const activeRoutes = routes.filter((r) => r.status === 'en cours').length

  return (
    <div className='grid gap-4 grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
          <CardTitle className='text-sm font-medium'>Flotte Totale</CardTitle>
          <Truck className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{trucks.length}</div>
          <p className='text-xs text-muted-foreground'>{activeTrucks} en livraison</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
          <CardTitle className='text-sm font-medium'>Tournées en cours</CardTitle>
          <Route className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{activeRoutes}</div>
          <p className='text-xs text-muted-foreground'>sur {routes.length} total</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
          <CardTitle className='text-sm font-medium'>Capacité Totale</CardTitle>
          <Truck className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{trucks.reduce((sum, t) => sum + t.tankCapacityTM, 0)} TM</div>
          <p className='text-xs text-muted-foreground'>Tous camions confondus</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
          <CardTitle className='text-sm font-medium'>Statut</CardTitle>
          <Truck className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold capitalize'>{transporteur.status === 'active' ? 'Actif' : 'Inactif'}</div>
          <p className='text-xs text-muted-foreground'>Région : {transporteur.region}</p>
        </CardContent>
      </Card>

      <Card className='col-span-2 lg:col-span-4'>
        <CardHeader>
          <CardTitle className='text-base'>Informations de Contact</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3'>
          <div className='flex items-center gap-2 min-w-0'>
            <MapPin className='w-4 h-4 shrink-0 text-muted-foreground' />
            <span className='text-sm truncate'>Région: {transporteur.region}</span>
          </div>
          <div className='flex items-center gap-2 min-w-0'>
            <Mail className='w-4 h-4 shrink-0 text-muted-foreground' />
            <span className='text-sm truncate'>{transporteur.contactEmail}</span>
          </div>
          <div className='flex items-center gap-2 min-w-0'>
            <Phone className='w-4 h-4 shrink-0 text-muted-foreground' />
            <span className='text-sm truncate'>{transporteur.contactPhone}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
