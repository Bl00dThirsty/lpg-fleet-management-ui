import { MapPin, Users, Warehouse } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import { OrgPersonnel } from '@/features/users/components/org-personnel'
import type { DepotView } from '../data/depots'
import { depotStatusLabel } from '../data/depots'

type DepotDetailsSheetProps = {
  depot: DepotView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepotDetailsSheet({
  depot,
  open,
  onOpenChange,
}: DepotDetailsSheetProps) {
  if (!depot) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>{depot.name}</SheetTitle>
              <SheetDescription>
                Dépôt · {depot.region}
              </SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {depotStatusLabel(depot.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard
              label='Région'
              value={depot.region}
              detail='Region code'
            />
            <MetricCard
              label='Ville'
              value={depot.city ?? '—'}
              detail='Main city'
            />
            <MetricCard
              label='Sites'
              value={`${depot.sites}`}
              detail='Operational sites'
            />
            <MetricCard
              label='Statut'
              value={depotStatusLabel(depot.status)}
              detail='Current status'
            />
          </div>

          <EntityDetailTabs
            defaultValue='info'
            tabs={[
              {
                value: 'info',
                label: 'Informations',
                icon: Warehouse,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Warehouse className='size-4 text-primary' />
                        Informations générales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='ID' value={depot.id} />
                      <DetailLine label='Nom' value={depot.name} />
                      <DetailLine label='Type' value='Dépôt' />
                      <DetailLine label='Région' value={depot.region} />
                      <DetailLine label='Ville' value={depot.city ?? '—'} />
                      <DetailLine label='Sites' value={`${depot.sites}`} />
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'details',
                label: 'Détails',
                icon: MapPin,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <MapPin className='size-4 text-primary' />
                        Détails
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='Statut' value={depotStatusLabel(depot.status)} />
                      <DetailLine label='Créé le' value={depot.created_at} />
                      <DetailLine label='Mis à jour' value={depot.updated_at} />
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'personnel',
                label: 'Personnel',
                icon: Users,
                content: <OrgPersonnel orgId={depot.id} orgName={depot.name} />,
              },
            ]}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className='surface-sunken p-3'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='mt-1 text-lg leading-none font-semibold'>{value}</p>
      <p className='mt-1 text-xs text-muted-foreground'>{detail}</p>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='max-w-72 text-right font-medium'>{value}</span>
    </div>
  )
}