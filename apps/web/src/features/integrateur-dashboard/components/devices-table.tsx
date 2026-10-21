import { Badge } from '@/components/ui/badge'
import {
  deviceStatusClasses,
  deviceStatusLabels,
  deviceTypeLabels,
} from '@/features/devices/data/devices'
import type { Device } from '@lpg/types'
import { DEVICE_STATUS_COLORS } from '../lib/dashboard-metrics'

function assignedLabel(device: Device): string {
  if (device.assigned_to_vehicle_id) return 'Véhicule'
  if (device.assigned_to_user_id) return 'Utilisateur'
  return 'Non affecté'
}

export function DevicesTable({ devices }: { devices: Device[] }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b text-left text-xs uppercase tracking-wider text-muted-foreground'>
            <th className='px-3 py-2 font-medium'>N° de série</th>
            <th className='px-3 py-2 font-medium'>Type</th>
            <th className='px-3 py-2 font-medium'>Statut</th>
            <th className='px-3 py-2 font-medium'>Affectation</th>
            <th className='px-3 py-2 font-medium'>Dernière synchronisation</th>
          </tr>
        </thead>
        <tbody>
          {devices.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className='px-3 py-6 text-center text-muted-foreground'
              >
                Aucun appareil synchronisé.
              </td>
            </tr>
          )}
          {devices.map((device) => (
            <tr
              key={device.id}
              className='border-b last:border-0 hover:bg-muted/40'
            >
              <td className='px-3 py-2.5 font-medium'>
                {device.serial_number}
              </td>
              <td className='px-3 py-2.5 text-muted-foreground'>
                {deviceTypeLabels[device.device_type]}
              </td>
              <td className='px-3 py-2.5'>
                <Badge
                  variant='outline'
                  className={`border-transparent font-medium ${deviceStatusClasses[device.status] ?? ''}`}
                  style={{
                    borderLeft: `3px solid ${DEVICE_STATUS_COLORS[device.status] ?? '#94a3b8'}`,
                  }}
                >
                  {deviceStatusLabels[device.status]}
                </Badge>
              </td>
              <td className='max-w-48 truncate px-3 py-2.5 text-muted-foreground'>
                {assignedLabel(device)}
              </td>
              <td className='px-3 py-2.5 text-muted-foreground'>
                {device.last_sync
                  ? new Date(device.last_sync).toLocaleString('fr-FR')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
