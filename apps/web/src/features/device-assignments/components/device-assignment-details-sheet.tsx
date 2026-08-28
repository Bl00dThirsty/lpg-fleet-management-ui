import { Battery, RadioTower } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { DeviceAssignmentView } from '../data/device-assignments'
import { deviceStatusLabel, deviceTypeLabel } from '../data/device-assignments'

type DeviceAssignmentDetailsSheetProps = {
  assignment: DeviceAssignmentView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeviceAssignmentDetailsSheet({
  assignment,
  open,
  onOpenChange,
}: DeviceAssignmentDetailsSheetProps) {
  if (!assignment) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='text-xl'>{assignment.serialNumber}</SheetTitle>
              <SheetDescription>
                {deviceTypeLabel(assignment.deviceType)} · {assignment.orgName}
              </SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {deviceStatusLabel(assignment.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard
              label='Type'
              value={deviceTypeLabel(assignment.deviceType)}
              detail='Appareil'
            />
            <MetricCard
              label='Affecté à'
              value={assignment.assigneeName}
              detail={assignment.assignedType === 'USER' ? 'Utilisateur' : 'Véhicule'}
            />
            <MetricCard
              label='Batterie'
              value={assignment.batteryLevel !== null ? `${assignment.batteryLevel}%` : '—'}
              detail={assignment.batteryCritical ? 'Critique' : 'Niveau'}
            />
            <MetricCard
              label='Statut'
              value={deviceStatusLabel(assignment.status)}
              detail='État actuel'
            />
          </div>

          <EntityDetailTabs
            defaultValue='info'
            tabs={[
              {
                value: 'info',
                label: 'Informations',
                icon: RadioTower,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <RadioTower className='size-4 text-primary' />
                        Informations générales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine label='ID' value={assignment.id} />
                      <DetailLine label='N° série' value={assignment.serialNumber} />
                      <DetailLine label='Type' value={deviceTypeLabel(assignment.deviceType)} />
                      <DetailLine label='Organisation' value={assignment.orgName} />
                      <DetailLine label='Firmware' value={assignment.firmwareVersion} />
                    </CardContent>
                  </Card>
                ),
              },
              {
                value: 'details',
                label: 'Détails',
                icon: Battery,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Battery className='size-4 text-primary' />
                        Détails
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <DetailLine
                        label='Assignation'
                        value={assignment.assignedType === 'USER' ? 'Utilisateur' : 'Véhicule'}
                      />
                      <DetailLine label='Bénéficiaire' value={assignment.assigneeName} />
                      <DetailLine label='ID bénéficiaire' value={assignment.assigneeId} />
                      <DetailLine
                        label='Batterie'
                        value={assignment.batteryLevel !== null ? `${assignment.batteryLevel}%` : '—'}
                      />
                      <DetailLine
                        label='Batterie critique'
                        value={assignment.batteryCritical ? 'Oui' : 'Non'}
                      />
                      <DetailLine label='Dernière sync' value={assignment.lastSync ?? '—'} />
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