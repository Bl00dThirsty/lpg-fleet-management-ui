import { deviceStatusLabels } from '@/features/devices/data/devices'
import type { DeviceStatus } from '@lpg/types'
import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { StatusSlice } from '../data/integrateur-dashboard'

export function StatusBreakdown({ slices }: { slices: StatusSlice[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const total = useMemo(
    () => slices.reduce((sum, s) => sum + s.count, 0),
    [slices]
  )
  const active = useMemo(
    () => slices.find((s) => s.status === hovered) ?? null,
    [slices, hovered]
  )

  return (
    <Card className='h-full border border-border shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle className='font-manrope text-base font-semibold'>
          Répartition par statut
        </CardTitle>
        <CardDescription className='text-xs text-muted-foreground'>
          {total} appareils — répartis selon leur état actuel
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-2'>
        <div className='grid grid-cols-1 items-center gap-6 lg:grid-cols-12'>
          <div className='relative mx-auto flex size-[190px] items-center justify-center lg:col-span-5'>
            <ResponsiveContainer width='100%' height={190}>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey='count'
                  nameKey='status'
                  innerRadius={60}
                  outerRadius={86}
                  paddingAngle={3}
                  cornerRadius={4}
                  strokeWidth={0}
                  onMouseEnter={(_, index) =>
                    setHovered(slices[index]?.status ?? null)
                  }
                  onMouseLeave={() => setHovered(null)}
                >
                  {slices.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={entry.color}
                      opacity={
                        hovered !== null && hovered !== entry.status ? 0.35 : 1
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value ?? 0} appareil${Number(value ?? 0) > 1 ? 's' : ''}`,
                    deviceStatusLabels[String(name) as DeviceStatus] ??
                      String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
              <span className='text-2xl font-bold'>
                {active ? active.count : total}
              </span>
              <span className='text-[11px] text-muted-foreground'>
                {active
                  ? deviceStatusLabels[active.status as DeviceStatus]
                  : 'appareils'}
              </span>
            </div>
          </div>
          <ul className='space-y-2 lg:col-span-7'>
            {slices.map((slice) => (
              <li
                key={slice.status}
                className={`flex items-center gap-2.5 rounded-md px-2 py-1 text-sm transition-colors ${hovered === slice.status ? 'bg-muted' : ''}`}
                onMouseEnter={() => setHovered(slice.status)}
                onMouseLeave={() => setHovered(null)}
              >
                <span
                  className='size-2.5 shrink-0 rounded-full'
                  style={{ backgroundColor: slice.color }}
                />
                <span className='font-medium'>
                  {deviceStatusLabels[slice.status as DeviceStatus]}
                </span>
                <span className='ml-auto text-muted-foreground'>
                  {slice.count} ·{' '}
                  {total > 0 ? Math.round((slice.count / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
