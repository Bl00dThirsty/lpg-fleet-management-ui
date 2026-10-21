import { deviceTypeLabels } from '@/features/devices/data/devices'
import type { DeviceType } from '@lpg/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { TypeSlice } from '../data/integrateur-dashboard'

const TYPE_COLORS: Record<string, string> = {
  GPS: '#2563eb',
  PDA: '#16a34a',
  RFIDREADER: '#0ea5e9',
}

export function TypeBreakdown({ slices }: { slices: TypeSlice[] }) {
  const max = slices.reduce((m, s) => Math.max(m, s.count), 0)

  return (
    <Card className='h-full border border-border shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle className='font-manrope text-base font-semibold'>
          Par type d'appareil
        </CardTitle>
        <CardDescription className='text-xs text-muted-foreground'>
          GPS · PDA · Lecteurs RFID
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 pt-2'>
        {slices.map((slice) => (
          <div key={slice.type} className='space-y-1.5'>
            <div className='flex items-baseline justify-between text-sm'>
              <span className='font-medium'>
                {deviceTypeLabels[slice.type as DeviceType] ?? slice.type}
              </span>
              <span className='text-muted-foreground'>{slice.count}</span>
            </div>
            <div className='h-2 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full'
                style={{
                  width: `${max > 0 ? (slice.count / max) * 100 : 0}%`,
                  backgroundColor: TYPE_COLORS[slice.type] ?? '#94a3b8',
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
