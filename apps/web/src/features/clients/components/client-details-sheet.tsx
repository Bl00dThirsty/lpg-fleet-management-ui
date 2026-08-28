import { Building2, MapPin, Users, Mail } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { ClientView, ClientSiteView } from '../data/clients'
import { clientStatusLabel, getClientSites } from '../data/clients'

type ClientDetailsSheetProps = {
  client: ClientView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDetailsSheet({
  client,
  open,
  onOpenChange,
}: ClientDetailsSheetProps) {
  if (!client) return null

  const sites = getClientSites(client.orgId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>{client.name}</SheetTitle>
              <SheetDescription>
                {client.region} · {client.contactEmail}
              </SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {clientStatusLabel(client.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard
              label='Sites'
              value={`${client.clientSiteCount}`}
              detail='Client sites'
            />
            <MetricCard
              label='Region'
              value={client.region}
              detail='Region code'
            />
            <MetricCard
              label='Contact'
              value={client.contactName}
              detail={client.contactPhone}
            />
            <MetricCard
              label='Statut'
              value={clientStatusLabel(client.status)}
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
                  <div className='space-y-3'>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-sm'>
                          <Building2 className='size-4 text-primary' />
                          Informations générales
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                       {/* <DetailLine label='ID' value={client.id} /> */}
                        <DetailLine label='Nom' value={client.name} />
                        <DetailLine label='Region' value={client.region} />
                        <DetailLine label='Sites' value={`${client.clientSiteCount}`} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-sm'>
                          <Users className='size-4 text-primary' />
                          Contact principal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <DetailLine label='Nom' value={client.contactName} />
                        <DetailLine label='Téléphone' value={client.contactPhone} />
                        <DetailLine label='Email' value={client.contactEmail} />
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                value: 'sites',
                label: `Sites (${sites.length})`,
                icon: MapPin,
                content: (
                  <div className='space-y-3'>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-sm'>
                          <MapPin className='size-4 text-primary' />
                          Sites de livraison
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        {sites.length === 0 ? (
                          <p className='text-sm text-muted-foreground'>Aucun site.</p>
                        ) : (
                          sites.map((site) => (
                            <ClientSiteRow key={site.id} site={site} />
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
            ]}
          />

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-sm'>
                <Mail className='size-4 text-primary' />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <DetailLine label='Créé le' value={client.created_at} />
              <DetailLine label='Mis à jour' value={client.updated_at} />
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ClientSiteRow({ site }: { site: ClientSiteView }) {
  return (
    <div className='rounded-md border p-3'>
      <div className='flex items-center justify-between gap-3'>
        <div className='space-y-0.5'>
          <span className='block text-sm font-medium'>{site.name}</span>
          <span className='block text-xs text-muted-foreground'>
            {site.region}
          </span>
        </div>
        <div className='flex flex-col items-end gap-1'>
          <Badge variant='outline'>{clientStatusLabel(site.status)}</Badge>
          <span className='text-xs text-muted-foreground'>
            {site.verified ? 'Vérifié' : 'Non vérifié'}
          </span>
        </div>
      </div>
    </div>
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