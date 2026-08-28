import { Building2, MapPin } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { Organization } from '../data/organizations'
import { orgStatusLabel, orgTypeLabel } from '../data/organizations'

type OrganizationDetailsSheetProps = {
  org: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrganizationDetailsSheet({
  org,
  open,
  onOpenChange,
}: OrganizationDetailsSheetProps) {
  if (!org) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>{org.name}</SheetTitle>
              <SheetDescription>
                {orgTypeLabel(org.type)} · {org.region}
              </SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {orgStatusLabel(org.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard
              label='Type'
              value={orgTypeLabel(org.type)}
              detail='Organisation type'
            />
            <MetricCard
              label='Région'
              value={org.region}
              detail='Region code'
            />
            <MetricCard
              label='Sites'
              value={`${org.sites}`}
              detail='Operational sites'
            />
            <MetricCard
              label='Statut'
              value={orgStatusLabel(org.status)}
              detail='Current status'
            />
          </div>

          <EntityDetailTabs
            defaultValue='info'
            tabs={[
              {
                value: 'info',
                label: 'Informations',
                icon: Building2,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Building2 className='size-4 text-primary' />
                        Informations générales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {/*<DetailLine label='ID' value={org.id} />*/}
                      <DetailLine label='Nom' value={org.name} />
                      <DetailLine label='Type' value={orgTypeLabel(org.type)} />
                      <DetailLine label='Région' value={org.region} />
                      <DetailLine label='Ville' value={org.city ?? '—'} />
                      <DetailLine label='Sites' value={`${org.sites}`} />
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
                      <DetailLine label='Statut' value={orgStatusLabel(org.status)} />
                      <DetailLine label='Créé le' value={org.created_at} />
                      <DetailLine label='Mis à jour' value={org.updated_at} />
                    </CardContent>
                  </Card>
                ),
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