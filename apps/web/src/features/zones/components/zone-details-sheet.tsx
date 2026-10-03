import { MapPinned } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { ZoneView } from '../data/zones'

type ZoneDetailsSheetProps = {
  zone: ZoneView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ZoneDetailsSheet({
  zone,
  open,
  onOpenChange,
}: ZoneDetailsSheetProps) {
  if (!zone) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>{zone.name}</SheetTitle>
              <SheetDescription>{zone.code}</SheetDescription>
            </div>
            <Badge variant='outline' className='font-mono'>
              {zone.code}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard label='Code' value={zone.code} detail='Region code' />
            <MetricCard label='Sites' value={`${zone.siteCount}`} detail='Sites opérationnels' />
            <MetricCard label='Sites clients' value={`${zone.clientSiteCount}`} detail='Sites clients' />
            <MetricCard label='Région' value={zone.region} detail='Zone géographique' />
          </div>

<EntityDetailTabs
            defaultValue='info'
            tabs={[
              {
                value: 'info',
                label: 'Informations',
                content: (
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <MapPinned className='size-4 text-primary' />
                      Informations générales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <DetailLine label='ID' value={zone.id} />
                    <DetailLine label='Nom' value={zone.name} />
                    <DetailLine label='Code' value={zone.code} />
                    <DetailLine label='Région' value={zone.region} />
                    <DetailLine label='Sites' value={`${zone.siteCount}`} />
                    <DetailLine label='Sites clients' value={`${zone.clientSiteCount}`} />
                  </CardContent>
                </Card>
                ),
              },
              {
                value: 'details',
                label: 'Détails',
                icon: MapPinned,
                content: (
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <MapPinned className='size-4 text-primary' />
                      Détails
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <DetailLine label='Statut' value='Lecture seule' />
                    <DetailLine label='Périmètre' value='Entrée intégralité du territoire' />
                    <DetailLine label='Édition' value='Reportée (polygones non édités)' />
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