import { Wrench } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { MaintenanceView } from '../data/maintenance'
import {
  itemTypeLabel,
  maintenanceStatusLabel,
} from '../data/maintenance'

type MaintenanceDetailsSheetProps = {
  item: MaintenanceView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MaintenanceDetailsSheet({
  item,
  open,
  onOpenChange,
}: MaintenanceDetailsSheetProps) {
  if (!item) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>{item.itemName}</SheetTitle>
              <SheetDescription>
                {itemTypeLabel(item.itemType)} · {item.orgName}
              </SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {maintenanceStatusLabel(item.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard
              label='Type'
              value={itemTypeLabel(item.itemType)}
              detail='Type of asset'
            />
            <MetricCard
              label='Motif'
              value={item.reason}
              detail='Raison de maintenance'
            />
            <MetricCard
              label='Batterie'
              value={item.balLevel !== undefined ? `${item.balLevel}%` : '—'}
              detail='Niveau de batterie'
            />
            <MetricCard
              label='État'
              value={maintenanceStatusLabel(item.status)}
              detail='Statut de maintenance'
            />
          </div>

          <EntityDetailTabs
            defaultValue='info'
            tabs={[
              {
                value: 'info',
                label: 'Informations',
                icon: Wrench,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Wrench className='size-4 text-primary' />
                        Informations générales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='ID' value={item.id} />
                      <DetailLine label='Appareil' value={item.itemName} />
                      <DetailLine label='Type' value={itemTypeLabel(item.itemType)} />
                      <DetailLine label='Organisation' value={item.orgName} />
                      <DetailLine label='Motif' value={item.reason} />
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'details',
                label: 'Détails',
                icon: Wrench,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Wrench className='size-4 text-primary' />
                        Détails
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine
                        label='Batterie'
                        value={item.balLevel !== undefined ? `${item.balLevel}%` : '—'}
                      />
                      <DetailLine label='Dernière synchro' value={item.lastSync ?? '—'} />
                      <DetailLine label='Mis à jour' value={item.updatedAt} />
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