import { UserRound, Wrench } from 'lucide-react'
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
  getTruckTelemetry,
  riskClasses,
  riskLabels,
  statusClasses,
  statusLabels,
  type Truck,
  type TruckTelemetry,
} from '../data/trucks'
import { quantityInfo, type TruckQuantityInfo } from '../lib/quantity'

type TruckDetailsSheetProps = {
  truck: Truck | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface TruckDetailsBodyProps {
  truck: Truck
  telemetry: TruckTelemetry
  info?: TruckQuantityInfo
}

export function TruckDetailsBody({
  truck,
  telemetry,
  info: providedInfo,
}: TruckDetailsBodyProps) {
  const info = providedInfo ?? quantityInfo(truck)
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <MetricCard
          label='LPG'
          value={
            truck.type === 'VRAC'
              ? `${Math.round(info.loaded)}/${truck.max_volume ?? '—'} TM`
              : `${Math.round(info.loaded)}/${truck.max_bottle_count ?? '—'} bouteilles`
          }
          detail={`${info.percent}% remplis`}
        />
        <MetricCard
          label='ETA'
          value={
            telemetry.expected_arrival
              ? new Date(telemetry.expected_arrival).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'
          }
          detail='Prochaine etape'
        />
        <MetricCard
          label='Risque'
          value={riskLabels[truck.risk_level]}
          detail='Score operationnel'
          className={riskClasses[truck.risk_level]}
        />
      </div>

      <EntityDetailTabs
        defaultValue='resume'
        tabs={[
          {
            value: 'resume',
            label: 'Résumé',
            icon: UserRound,
            content: (
            <div className='space-y-3'>
              <Card className='border-transparent bg-muted/20 shadow-xs'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-sm'>
                    Mission courante
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <DetailLine label='Entreprise' value={truck.tenant_name} />
                  <DetailLine label='Region' value={truck.region} />
                  <DetailLine
                    label='Position'
                    value={truck.current_location ?? '—'}
                  />
                  <DetailLine label='Chauffeur' value={truck.assigned_driver ?? '—'} />
                  <DetailLine
                    label='Type'
                    value={truck.type === 'VRAC' ? 'Vrac (TM)' : 'Bouteilles 50kg'}
                  />
                </CardContent>
              </Card>

              <Card className='border-transparent bg-muted/20 shadow-xs'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-sm'>
                    <UserRound className='size-4 text-primary' />
                    Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <DetailLine
                    label='Chauffeur'
                    value={truck.assigned_driver ?? '—'}
                  />
                </CardContent>
              </Card>
            </div>
            ),
          },
          {
            value: 'docs',
            label: 'Documents',
            icon: Wrench,
            content: (
            <div className='space-y-3'>
              <Separator />
              <DetailLine
                label='Certificat'
                value={truck.certificate_number ?? '—'}
              />
              <DetailLine
                label='Validite'
                value={
                  truck.certificate_expiry_at
                    ? new Date(truck.certificate_expiry_at).toLocaleDateString('fr-FR')
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
            <Wrench className='size-4 text-primary' />
            Etat technique
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <DetailLine
            label='Type vehicule'
            value={truck.type === 'VRAC' ? 'Vrac' : 'Bouteilles 50kg'}
          />
          <DetailLine
            label='Capacite max'
            value={
              truck.type === 'VRAC'
                ? `${truck.max_volume ?? '—'} TM`
                : `${truck.max_bottle_count ?? '—'} bouteilles`
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function TruckDetailsSheet({
  truck,
  open,
  onOpenChange,
}: TruckDetailsSheetProps) {
  const telemetry = truck ? getTruckTelemetry(truck.id) : null
  const info = truck ? quantityInfo(truck) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {truck && telemetry && info ? (
        <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader className='pb-4'>
            <div className='flex items-start justify-between gap-3 pe-8'>
              <div>
                <SheetTitle className='text-xl'>{truck.id}</SheetTitle>
                <SheetDescription>
                  {truck.type} · {truck.license_plate} — {truck.tenant_name}
                </SheetDescription>
              </div>
              <Badge className={cn('font-medium', statusClasses[truck.tournee_status])}>
                {statusLabels[truck.tournee_status]}
              </Badge>
            </div>
          </SheetHeader>

          <div className='space-y-4 px-4 pb-6'>
            <TruckDetailsBody truck={truck} telemetry={telemetry} info={info} />
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
