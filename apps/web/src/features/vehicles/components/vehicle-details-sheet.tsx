import { Gauge, ShieldAlert, Truck } from 'lucide-react'
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
import { EntityDetailTabs } from '@/components/entity-table'
import {
  tenantLabel,
  vehicleRiskClasses,
  vehicleRiskLabels,
  vehicleStatusClasses,
  vehicleStatusLabels,
  vehicleTypeLabels,
  type VehicleView,
} from '../data/vehicles'

type VehicleDetailsSheetProps = {
  vehicle: VehicleView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VehicleDetailsSheet({
  vehicle,
  open,
  onOpenChange,
}: VehicleDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {vehicle ? (
        <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader className='pb-4'>
            <div className='flex items-start justify-between gap-3 pe-8'>
              <div>
                <SheetTitle className='text-xl'>
                  {vehicle.license_plate}
                </SheetTitle>
                <SheetDescription>
                  {vehicleTypeLabels[vehicle.type]} · {vehicle.tenant_name} —{' '}
                  {tenantLabel(vehicle.tenant_type)}
                </SheetDescription>
              </div>
              <Badge className={cn('font-medium', vehicleStatusClasses[vehicle.status])}>
                {vehicleStatusLabels[vehicle.status]}
              </Badge>
            </div>
          </SheetHeader>

          <div className='space-y-4 px-4 pb-6'>
            <div className='grid grid-cols-2 gap-3'>
              <MetricCard
                label='Capacite chargement'
                value={
                  vehicle.type === 'VRAC'
                    ? `${vehicle.max_volume ?? '—'} TM`
                    : `${vehicle.max_bottle_count ?? '—'} bouteilles`
                }
                detail='Capacite maximale'
              />
              <MetricCard
                label='Tare'
                 value={vehicle.tare_weight ? `${(vehicle.tare_weight / 1000).toLocaleString('fr-FR')} t` : '—'}
                detail='Poids a vide'
              />
              <MetricCard
                label='Risque'
                value={vehicleRiskLabels[vehicle.risk_level]}
                detail='Score operationnel'
                className={vehicleRiskClasses[vehicle.risk_level]}
              />
              <MetricCard
                label='Vitrage'
                value={vehicle.is_active ? 'Actif' : 'Inactif'}
                detail='Etat du vehicule'
              />
            </div>

          <EntityDetailTabs
            defaultValue='resume'
            tabs={[
              {
                value: 'resume',
                label: 'Résumé',
                icon: Truck,
                content: (
                <div className='space-y-3'>
                  <Card className='border-transparent bg-muted/20 shadow-xs'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Truck className='size-4 text-primary' />
                        Identification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='Plaque' value={vehicle.license_plate} />
                      <DetailLine label='ID interne' value={vehicle.id} />
                      <DetailLine
                        label='Type'
                        value={vehicleTypeLabels[vehicle.type]}
                      />
                      <DetailLine
                        label='Entreprise'
                        value={vehicle.tenant_name}
                      />
                      <DetailLine
                        label='Tenant'
                        value={tenantLabel(vehicle.tenant_type)}
                      />
                      <DetailLine label='Region' value={vehicle.region} />
                    </CardContent>
                  </Card>

                  <Card className='border-transparent bg-muted/20 shadow-xs'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Gauge className='size-4 text-primary' />
                        Mission courante
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine
                        label='Chauffeur'
                        value={vehicle.assigned_driver ?? '—'}
                      />
                       <DetailLine
                         label='Quantite demandee'
                         value={`${Math.round(vehicle.requested_quantity)} ${vehicle.type === 'VRAC' ? 'TM' : 'btl'}`}
                       />
                       <DetailLine
                         label='Quantite chargee'
                         value={
                           vehicle.loaded_quantity != null
                             ? `${Math.round(vehicle.loaded_quantity)} ${vehicle.type === 'VRAC' ? 'TM' : 'btl'}`
                             : '—'
                         }
                       />
                       <DetailLine
                         label='Quantite livree'
                         value={
                           vehicle.delivered_quantity != null
                             ? `${Math.round(vehicle.delivered_quantity)} ${vehicle.type === 'VRAC' ? 'TM' : 'btl'}`
                             : '—'
                         }
                       />
                    </CardContent>
                  </Card>
                </div>
                ),
              },
              {
                value: 'docs',
                label: 'Documents',
                icon: Gauge,
                content: (
                <div className='space-y-3'>
                  {vehicle.type === 'VRAC' &&
                    (vehicle.certificate_status === 'expired' ||
                      vehicle.certificate_status === 'missing') && (
                      <div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'>
                        <p className='font-medium'>
                          {vehicle.certificate_status === 'expired'
                            ? 'Certificat de jaugement expiré'
                            : 'Certificat de jaugement manquant'}
                        </p>
                        <p className='mt-1 text-xs'>
                          Le jaugement ministériel est obligatoire pour les
                          véhicules VRAC. Cette citerne ne peut pas être affectée
                          à une tournée tant que le certificat n'est pas renouvelé.
                        </p>
                      </div>
                    )}
                  <Separator />
                  <DetailLine
                    label='Certificat'
                    value={vehicle.certificate_number ?? '—'}
                  />
                  <DetailLine
                    label='Expiration'
                    value={
                      vehicle.certificate_expiry_at
                        ? new Date(
                            vehicle.certificate_expiry_at,
                          ).toLocaleDateString('fr-FR')
                        : '—'
                    }
                  />
                </div>
                ),
              },
            ]}
          />

            <Card className='border-transparent bg-muted/20 shadow-xs'>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-sm'>
                  <ShieldAlert className='size-4 text-primary' />
                  Surveillance
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <DetailLine
                  label='Risque'
                  value={vehicleRiskLabels[vehicle.risk_level]}
                />
              </CardContent>
            </Card>
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
    <div className={cn('rounded-lg bg-muted/25 p-3 shadow-xs', className)}>
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