import { Badge } from '@lpg/ui'
import type { Device, DeviceStatus } from '@lpg/types'
import { DEVICE_STATUS_COLORS } from '../lib/integrateur-dashboard'

export type DeviceRow = Pick<
  Device,
  'id' | 'serial_number' | 'device_type' | 'status' | 'assigned_to_user_id' | 'assigned_to_vehicle_id' | 'last_sync'
>

const STATUS_BADGE_CLASSES: Record<DeviceStatus, string> = {
  DEPLOYED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  INMISSION: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  SYNCED: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  SYNCING: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  PENDINGSYNC: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  SYNCFAILED: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  MAINTENANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  OFFLINE: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  UNASSIGNED: 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400',
  ASSIGNED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
  REMOVED: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  LOST: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

function assignedLabel(device: DeviceRow): string {
  if (device.assigned_to_vehicle_id) return device.assigned_to_vehicle_id
  if (device.assigned_to_user_id) return device.assigned_to_user_id
  return '—'
}

export function DevicesTable({ devices }: { devices: DeviceRow[] }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b text-left text-xs uppercase tracking-wider text-muted-foreground'>
            <th className='px-3 py-2 font-medium'>N° de série</th>
            <th className='px-3 py-2 font-medium'>Type</th>
            <th className='px-3 py-2 font-medium'>Statut</th>
            <th className='px-3 py-2 font-medium'>Affecté à</th>
            <th className='px-3 py-2 font-medium'>Dernier sync</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id} className='border-b last:border-0 hover:bg-muted/40'>
              <td className='px-3 py-2.5 font-medium'>{device.serial_number}</td>
              <td className='px-3 py-2.5 text-muted-foreground'>{device.device_type}</td>
              <td className='px-3 py-2.5'>
                <Badge
                  variant='outline'
                  className={`border-transparent font-medium ${STATUS_BADGE_CLASSES[device.status] ?? ''}`}
                  style={{ borderLeft: `3px solid ${DEVICE_STATUS_COLORS[device.status] ?? '#94a3b8'}` }}
                >
                  {device.status}
                </Badge>
              </td>
              <td className='max-w-48 truncate px-3 py-2.5 text-muted-foreground'>
                {assignedLabel(device)}
              </td>
              <td className='px-3 py-2.5 text-muted-foreground'>
                {device.last_sync ? new Date(device.last_sync).toLocaleString('fr-FR') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
