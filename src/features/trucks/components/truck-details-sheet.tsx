import {
  CalendarDays,
  Gauge,
  MapPin,
  Route,
  ShieldCheck,
  Thermometer,
  UserRound,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getTruckTelemetry,
  riskClasses,
  riskLabels,
  statusClasses,
  statusLabels,
  type Truck,
} from '../data/trucks'

type TruckDetailsSheetProps = {
  truck: Truck | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DOCUMENT_REFERENCE_DATE_MS = new Date(
  '2026-04-23T00:00:00+01:00'
).getTime()

export function TruckDetailsSheet({
  truck,
  open,
  onOpenChange,
}: TruckDetailsSheetProps) {
  const telemetry = truck ? getTruckTelemetry(truck.id) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {truck && telemetry ? (
        <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader className='border-b pb-4'>
            <div className='flex items-start justify-between gap-3 pe-8'>
              <div>
                <SheetTitle className='text-xl'>{truck.id}</SheetTitle>
                <SheetDescription>
                  {truck.makeModel} - {truck.plateNumber}
                </SheetDescription>
              </div>
              <Badge className={cn('font-medium', statusClasses[truck.status])}>
                {statusLabels[truck.status]}
              </Badge>
            </div>
          </SheetHeader>

          <div className='space-y-4 px-4 pb-6'>
            <div className='grid grid-cols-2 gap-3'>
              <MetricCard
                label='LPG'
                value={`${telemetry.lpgLevelPercent}%`}
                detail={`${Math.round(
                  (truck.tankCapacityLiters * telemetry.lpgLevelPercent) / 100
                ).toLocaleString()} L disponibles`}
              />
              <MetricCard
                label='Vitesse'
                value={`${telemetry.speedKmh} km/h`}
                detail={`ETA ${telemetry.etaText}`}
              />
              <MetricCard
                label='Pression'
                value={`${telemetry.pressureBar.toFixed(1)} bar`}
                detail={`${telemetry.temperatureCelsius} C reservoir`}
              />
              <MetricCard
                label='Risque'
                value={riskLabels[truck.riskLevel]}
                detail='Score operationnel'
                className={riskClasses[truck.riskLevel]}
              />
            </div>

            <Tabs defaultValue='resume'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='resume'>Resume</TabsTrigger>
                <TabsTrigger value='docs'>Documents</TabsTrigger>
                <TabsTrigger value='maintenance'>Maintenance</TabsTrigger>
              </TabsList>

              <TabsContent value='resume' className='space-y-3'>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <Route className='size-4 text-primary' />
                      Mission courante
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <DetailLine label='Entreprise' value={truck.tenantName} />
                    <DetailLine label='Site' value={truck.marketer} />
                    <DetailLine label='Route' value={truck.assignedRoute} />
                    <DetailLine
                      label='Position'
                      value={truck.currentLocation}
                    />
                    <DetailLine label='Destination' value={truck.destination} />
                    <div>
                      <div className='mb-1 flex justify-between text-xs'>
                        <span className='text-muted-foreground'>
                          Progression
                        </span>
                        <span className='font-medium'>
                          {telemetry.distanceKm} km restants
                        </span>
                      </div>
                      <div className='h-2 overflow-hidden rounded-full bg-muted'>
                        <div
                          className='h-full rounded-full bg-primary'
                          style={{ width: `${telemetry.routeProgress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <UserRound className='size-4 text-primary' />
                      Equipe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <DetailLine
                      label='Chauffeur'
                      value={truck.assignedDriver}
                    />
                    <DetailLine label='Telephone' value={truck.driverPhone} />
                    <DetailLine
                      label='Fleet manager'
                      value={truck.fleetManager}
                    />
                    <DetailLine label='Region' value={truck.operatingRegion} />
                    <DetailLine label='Depot' value={truck.homeDepot} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='docs' className='space-y-3'>
                <DocumentStatus
                  label='Permis transport GPL'
                  value={truck.permitExpiry}
                />
                <DocumentStatus
                  label='Assurance'
                  value={truck.insuranceExpiry}
                />
                <DocumentStatus
                  label='Visite technique'
                  value={truck.technicalVisitExpiry}
                />
                <Separator />
                <DetailLine label='GPS IMEI' value={truck.gpsImei} />
                <DetailLine label='Contrat' value={truck.contractTier} />
                <DetailLine
                  label='Dernier ping'
                  value={formatDateTime(truck.lastPing)}
                />
              </TabsContent>

              <TabsContent value='maintenance' className='space-y-3'>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <Wrench className='size-4 text-primary' />
                      Etat technique
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <DetailLine
                      label='Kilometrage'
                      value={`${truck.odometerKm.toLocaleString()} km`}
                    />
                    <DetailLine
                      label='Prochaine revision'
                      value={`${truck.nextServiceKm.toLocaleString()} km`}
                    />
                    <DetailLine
                      label='Dernier service'
                      value={formatDate(truck.lastServiceDate)}
                    />
                    <DetailLine
                      label='Capacite citerne'
                      value={`${truck.tankCapacityLiters.toLocaleString()} L`}
                    />
                    <DetailLine
                      label='Compartiments'
                      value={`${truck.compartments}`}
                    />
                    <DetailLine label='Carburant' value={truck.fuelType} />
                  </CardContent>
                </Card>

                <div className='grid grid-cols-2 gap-3'>
                  <MiniSignal
                    icon={<Gauge className='size-4' />}
                    label='Pression'
                    value={`${telemetry.pressureBar.toFixed(1)} bar`}
                  />
                  <MiniSignal
                    icon={<Thermometer className='size-4' />}
                    label='Temperature'
                    value={`${telemetry.temperatureCelsius} C`}
                  />
                  <MiniSignal
                    icon={<MapPin className='size-4' />}
                    label='Distance'
                    value={`${telemetry.distanceKm} km`}
                  />
                  <MiniSignal
                    icon={<CalendarDays className='size-4' />}
                    label='Ping'
                    value={formatDateTime(truck.lastPing)}
                  />
                </div>
              </TabsContent>
            </Tabs>
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
  detail: string
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border bg-muted/25 p-3', className)}>
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

function DocumentStatus({ label, value }: { label: string; value: string }) {
  const daysLeft = Math.ceil(
    (new Date(value).getTime() - DOCUMENT_REFERENCE_DATE_MS) /
      (1000 * 60 * 60 * 24)
  )
  const status =
    daysLeft < 0 ? 'Expire' : daysLeft <= 45 ? 'Expire bientot' : 'Valide'
  const className =
    daysLeft < 0
      ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300'
      : daysLeft <= 45
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'

  return (
    <div className='rounded-lg border p-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-2'>
          <ShieldCheck className='mt-0.5 size-4 text-primary' />
          <div>
            <p className='text-sm font-medium'>{label}</p>
            <p className='text-xs text-muted-foreground'>
              Expire le {formatDate(value)}
            </p>
          </div>
        </div>
        <Badge variant='outline' className={cn(className)}>
          {status}
        </Badge>
      </div>
    </div>
  )
}

function MiniSignal({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className='rounded-lg border bg-muted/20 p-3'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        {icon}
        {label}
      </div>
      <p className='mt-2 text-sm font-semibold'>{value}</p>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
