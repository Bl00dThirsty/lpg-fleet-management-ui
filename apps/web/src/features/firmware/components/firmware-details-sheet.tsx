import { Cpu } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lpg/ui'
import { EntityDetailTabs } from '@/components/entity-table'
import type { FirmwareView } from '../data/firmware'
import { firmwareStatusLabel, getFirmwareDevices } from '../data/firmware'

type FirmwareDetailsSheetProps = {
  firmware: FirmwareView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FirmwareDetailsSheet({
  firmware,
  open,
  onOpenChange,
}: FirmwareDetailsSheetProps) {
  if (!firmware) return null

  const devices = getFirmwareDevices(firmware.version)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='pb-4'>
          <div className='flex items-start justify-between gap-3 pe-8'>
            <div>
              <SheetTitle className='font-mono text-xl'>{firmware.version}</SheetTitle>
              <SheetDescription>{firmware.trim} · {firmware.deviceCount} appareil(s)</SheetDescription>
            </div>
            <Badge variant='outline' className='font-medium'>
              {firmwareStatusLabel(firmware.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className='space-y-4 px-4 pb-6'>
          <div className='grid grid-cols-2 gap-3'>
            <MetricCard label='Version' value={firmware.version} detail='Firmware version' />
            <MetricCard label='Affichage' value={firmware.trim} detail='Version display' />
            <MetricCard label='Appareils' value={`${firmware.deviceCount}`} detail='Devices running this version' />
            <MetricCard label='État' value={firmwareStatusLabel(firmware.status)} detail='Rollout status' />
          </div>

          <EntityDetailTabs
            defaultValue='devices'
            tabs={[
              {
                value: 'devices',
                label: 'Appareils',
                icon: Cpu,
                content: (
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <Cpu className='size-4 text-primary' />
                        Appareils sur cette version
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {devices.length ? (
                        <ul className='space-y-2'>
                          {devices.map((serial) => (
                            <li key={serial} className='flex items-center justify-between rounded-md border p-2 text-sm'>
                              <span className='font-mono text-xs'>{serial}</span>
                              <Badge variant='outline'>{firmware.trim}</Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className='py-4 text-center text-sm text-muted-foreground'>
                          Aucun appareil.
                        </p>
                      )}
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