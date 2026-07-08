import { type Marketer } from '../data/marketers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Truck, Route, Users, Phone, Mail, MapPin } from 'lucide-react'

export function MarketerOverview({ marketer }: { marketer: Marketer }) {
  return (
    <div className='grid gap-4 grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
          <CardTitle className='text-sm font-medium'>Sites Associés</CardTitle>
          <Building2 className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>8</div>
          <p className='text-xs text-muted-foreground'>3 Dépôts, 5 Points de Vente</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
          <CardTitle className='text-sm font-medium'>Camions Actifs</CardTitle>
          <Truck className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>12</div>
          <p className='text-xs text-muted-foreground'>En circulation aujourd'hui</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
          <CardTitle className='text-sm font-medium'>Tournées Vrac</CardTitle>
          <Route className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>4</div>
          <p className='text-xs text-muted-foreground'>En cours d'exécution</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
          <CardTitle className='text-sm font-medium'>Tournées 50 kg</CardTitle>
          <Users className='w-4 h-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>15</div>
          <p className='text-xs text-muted-foreground'>Vers les clients industriels</p>
        </CardContent>
      </Card>

      <Card className='col-span-2 lg:col-span-4'>
        <CardHeader>
          <CardTitle className='text-base'>Informations de Contact</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3'>
          <div className='flex items-center gap-2 min-w-0'>
            <MapPin className='w-4 h-4 shrink-0 text-muted-foreground' />
            <span className='text-sm truncate'>Région: {marketer.region}</span>
          </div>
          <div className='flex items-center gap-2 min-w-0'>
            <Mail className='w-4 h-4 shrink-0 text-muted-foreground' />
            <span className='text-sm truncate'>{marketer.contactEmail}</span>
          </div>
          <div className='flex items-center gap-2 min-w-0'>
            <Phone className='w-4 h-4 shrink-0 text-muted-foreground' />
            <span className='text-sm truncate'>{marketer.contactPhone}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
