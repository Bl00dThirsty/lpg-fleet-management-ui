import { Battery, Cpu, MapPin, Radio, Signal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntityDetailTabs } from '@/components/entity-table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  deviceStatusClasses,
  deviceStatusLabels,
  deviceTypeClasses,
  deviceTypeLabels,
  type DeviceView,
} from '../data/devices'

type DeviceDetailsSheetProps = {
  device: DeviceView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeviceDetailsSheet({
  device,
  open,
  onOpenChange,
}: DeviceDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {device ? (
        <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader className='pb-4'>
            <div className='flex items-start justify-between gap-3 pe-8'>
              <div>
                <SheetTitle className='font-mono text-xl'>
                  {device.serial}
                </SheetTitle>
                <SheetDescription>
                  {deviceTypeLabels[device.type]} · {device.orgName}
                </SheetDescription>
              </div>
              <Badge
                className={cn(
                  'font-medium',
                  deviceStatusClasses[device.status]
                )}
              >
                {deviceStatusLabels[device.status]}
              </Badge>
            </div>
          </SheetHeader>

          <div className='space-y-4 px-4 pb-6'>
            <div className='grid grid-cols-2 gap-3'>
              <MetricCard
                label='Type'
                value={deviceTypeLabels[device.type]}
                className={deviceTypeClasses[device.type]}
              />
              <BatteryCard
                level={device.batteryLevel}
                critical={device.batteryCritical}
              />
              <MetricCard
                label='Firmware'
                value={device.firmware ?? '—'}
                detail='Version embarquée'
              />
              <MetricCard
                label='Dernière synchro'
                value={
                  device.lastSync
                    ? formatDateTime(device.lastSync)
                    : '—'
                }
                detail='Dernier contact'
              />
            </div>

            <EntityDetailTabs
              defaultValue='details'
              tabs={[
                {
                  value: 'details',
                  label: 'Détails',
                  content: (
                    <div className='space-y-3'>
                      <Card className='border-transparent bg-muted/20 shadow-xs'>
                        <CardHeader className='pb-2'>
                          <CardTitle className='flex items-center gap-2 text-sm'>
                            <MapPin className='size-4 text-primary' />
                            Position connue
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          {device.position ? (
                            <>
                              <DetailLine
                                label='Latitude'
                                value={device.position[0].toFixed(5)}
                              />
                              <DetailLine
                                label='Longitude'
                                value={device.position[1].toFixed(5)}
                              />
                            </>
                          ) : (
                            <DetailLine label='Position' value='Non connue' />
                          )}
                          <DetailLine
                            label='Modèle'
                            value={device.model ?? '—'}
                          />
                        </CardContent>
                      </Card>

                      <Card className='border-transparent bg-muted/20 shadow-xs'>
                        <CardHeader className='pb-2'>
                          <CardTitle className='flex items-center gap-2 text-sm'>
                            <Cpu className='size-4 text-primary' />
                            Configuration
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          <ConfigList config={device.config} />
                        </CardContent>
                      </Card>
                    </div>
                  ),
                },
                {
                  value: 'affectation',
                  label: 'Affectation',
                  content: (
                    <div className='space-y-3'>
                      <Card className='border-transparent bg-muted/20 shadow-xs'>
                        <CardContent className='space-y-3 pt-4'>
                          <DetailLine
                            label='Organisation'
                            value={device.orgName}
                          />
                          <DetailLine
                            label='Véhicule'
                            value={device.vehiclePlate ?? '—'}
                          />
                          <DetailLine
                            label='Chauffeur'
                            value={device.driverName ?? '—'}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ),
                },
                {
                  value: 'telecom',
                  label: 'Télécom',
                  content: (
                    <div className='space-y-3'>
                      <Card className='border-transparent bg-muted/20 shadow-xs'>
                        <CardHeader className='pb-2'>
                          <CardTitle className='flex items-center gap-2 text-sm'>
                            <Signal className='size-4 text-primary' />
                            Télécom
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          <DetailLine label='IMEI' value={device.imei ?? '—'} />
                          <DetailLine
                            label='Opérateur'
                            value={device.operator ?? '—'}
                          />
                          <DetailLine
                            label='SIM'
                            value={device.simNumber ?? '—'}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  )
}

function MetricCard({
  label,
  value,
  detail,
  className,
}: {
  label: string
  value: string
  detail?: string
  className?: string
}) {
  return (
    <div className={cn('rounded-lg bg-muted/25 p-3 shadow-xs', className)}>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='mt-1 text-lg leading-none font-semibold'>{value}</p>
      {detail ? (
        <p className='mt-1 text-xs text-muted-foreground'>{detail}</p>
      ) : null}
    </div>
  )
}

function BatteryCard({
  level,
  critical,
}: {
  level: number | null
  critical: boolean
}) {
  return (
    <div className='rounded-lg bg-muted/25 p-3 shadow-xs'>
      <p className='flex items-center gap-1 text-xs text-muted-foreground'>
        <Battery className='size-3.5' />
        Batterie
      </p>
      <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-muted'>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            critical
              ? 'bg-rose-500'
              : (level ?? 0) < 30
                ? 'bg-amber-500'
                : 'bg-emerald-500'
          )}
          style={{ width: `${Math.max(level ?? 0, 0)}%` }}
        />
      </div>
      <p className='mt-1 text-sm font-semibold'>
        {level == null
          ? critical
            ? 'Critique'
            : '—'
          : `${level}%${critical ? ' (critique)' : ''}`}
      </p>
    </div>
  )
}

function ConfigList({
  config,
}: {
  config: Record<string, unknown> | null
}) {
  const entries = config ? Object.entries(config) : []
  if (entries.length === 0) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Radio className='size-4' />
        Aucune configuration
      </div>
    )
  }
  return (
    <div className='space-y-2'>
      {entries.map(([key, value]) => (
        <div
          key={key}
          className='flex items-start justify-between gap-3 text-sm'
        >
          <span className='text-muted-foreground'>{labelKey(key)}</span>
          <span className='max-w-56 text-right font-medium'>
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function labelKey(key: string): string {
  const labels: Record<string, string> = {
    update_interval_sec: 'Intervalle (s)',
    alert_speed_kmh: 'Alerte vitesse (km/h)',
    geofence_radius_m: 'Géofence (m)',
  }
  return labels[key] ?? key
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='max-w-72 text-right font-medium'>{value}</span>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}