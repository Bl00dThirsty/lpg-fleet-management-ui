import { MapPin, Satellite } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { GpsConfigView } from '../data/gps-config'
import { deviceStatusLabel, displayNumber } from '../data/gps-config'

type GpsConfigDetailsSheetProps = {
  config: GpsConfigView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GpsConfigDetailsSheet({
  config,
  open,
  onOpenChange,
}: GpsConfigDetailsSheetProps) {
  if (!config) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>{config.serialNumber}</SheetTitle>
              <SheetDescription>
                {config.model ?? 'Appareil'} · {config.orgName}
              </SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {deviceStatusLabel(config.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard
              label='Intervalle'
              value={config.updateIntervalSec === null ? '—' : `${config.updateIntervalSec} s`}
              detail='Updated interval'
            />
            <MetricCard
              label='Vitesse alerte'
              value={config.alertSpeedKmh === null ? '—' : `${config.alertSpeedKmh} km/h`}
              detail='Alert speed threshold'
            />
            <MetricCard
              label='Rayon geofence'
              value={config.geofenceRadiusM === null ? '—' : `${config.geofenceRadiusM} m`}
              detail='Geofence radius'
            />
            <MetricCard
              label='Statut'
              value={deviceStatusLabel(config.status)}
              detail='Current status'
            />
          </div>

          <EntityDetailTabs
            defaultValue='info'
            tabs={[
              {
                value: 'info',
                label: 'Informations',
                icon: Satellite,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Satellite className='size-4 text-primary' />
                        Informations générales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='ID' value={config.id} />
                      <DetailLine label='N° série' value={config.serialNumber} />
                      <DetailLine label='Véhicule' value={config.vehiclePlate} />
                      <DetailLine label='Firmware' value={config.firmwareVersion} />
                      <DetailLine label='Organisation' value={config.orgName} />
                      <DetailLine label='Dernière sync' value={config.lastSync} />
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'config',
                label: 'Configuration',
                icon: MapPin,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <MapPin className='size-4 text-primary' />
                        Paramètres
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='Intervalle (s)' value={displayNumber(config.updateIntervalSec)} />
                      <DetailLine label='Vitesse alerte (km/h)' value={displayNumber(config.alertSpeedKmh)} />
                      <DetailLine label='Rayon geofence (m)' value={displayNumber(config.geofenceRadiusM)} />
                      <DetailLine label='IMEI' value={config.imei ?? '—'} />
                      <DetailLine label='Opérateur' value={config.operator ?? '—'} />
                      <DetailLine label='Modèle' value={config.model ?? '—'} />
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