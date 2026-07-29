import { useMemo, useState } from 'react'
import { RadioTower, BatteryLow, WifiOff, ScanLine, CheckCircle2, Plus } from 'lucide-react'
import { faker } from '@faker-js/faker'
import { PageHeader } from '@/components/layout/page-header'
import { Badge, Button, Card, CardContent, ScrollArea } from '@lpg/ui'

faker.seed(5150)

type Device = {
  id: string
  serial: string
  model: 'PDA-UHF' | 'GPS-T' | 'RFID-R'
  state: 'ok' | 'lowbattery' | 'failure' | 'offline'
  enrolled: boolean
  lastSeen: Date
}

const MODELS: Device['model'][] = ['PDA-UHF', 'GPS-T', 'RFID-R']

function buildDevices(): Device[] {
  return Array.from({ length: 18 }, () => {
    const r = faker.number.int({ min: 0, max: 10 })
    const state: Device['state'] =
      r < 4 ? 'ok' : r < 6 ? 'lowbattery' : r < 8 ? 'offline' : 'failure'
    return {
      id: faker.string.uuid(),
      serial: `SN-${faker.string.alphanumeric(7).toUpperCase()}`,
      model: faker.helpers.arrayElement(MODELS),
      state,
      enrolled: state !== 'failure',
      lastSeen: faker.date.recent({ days: state === 'offline' ? 3 : 0 }),
    }
  })
}

const STATE_CLS: Record<Device['state'], { label: string; cls: string }> = {
  ok: { label: 'Opérationnel', cls: 'bg-emerald-600 text-white' },
  lowbattery: { label: 'Batterie faible', cls: 'bg-amber-500 text-white' },
  offline: { label: 'Hors-ligne', cls: 'bg-slate-500 text-white' },
  failure: { label: 'Défaillance', cls: 'bg-rose-600 text-white' },
}

export function IntegrateurPdaScreen() {
  const [devices, setDevices] = useState<Device[]>(buildDevices)
  const [filter, setFilter] = useState<Device['model'] | 'all'>('all')
  const filtered = useMemo(
    () => (filter === 'all' ? devices : devices.filter((d) => d.model === filter)),
    [devices, filter]
  )

  const counts = useMemo(() => {
    const c = { ok: 0, lowbattery: 0, offline: 0, failure: 0 }
    for (const d of devices) c[d.state] += 1
    return c
  }, [devices])

  const enroll = (id: string) =>
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, enrolled: true } : d)))

  return (
    <PageShell>
      <PageHeader
        title='PDA + GPS + RFID'
        description='Activation, authentification et maintenance du matériel IoT.'
        actions={
          <Button size='sm' className='gap-2'>
            <Plus className='size-4' /> Enrôler un appareil
          </Button>
        }
      />

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <Counter icon={CheckCircle2} label='Opérationnels' value={counts.ok} cls='text-emerald-600' />
        <Counter icon={BatteryLow} label='Batterie faible' value={counts.lowbattery} cls='text-amber-600' />
        <Counter icon={WifiOff} label='Hors-ligne' value={counts.offline} cls='text-slate-500' />
        <Counter icon={RadioTower} label='Défaillance' value={counts.failure} cls='text-rose-600' />
      </div>

      <div className='flex flex-wrap gap-2'>
        {(['all', ...MODELS] as (Device['model'] | 'all')[]).map((m) => (
          <Button
            key={m}
            size='sm'
            variant={filter === m ? 'default' : 'outline'}
            onClick={() => setFilter(m)}
          >
            {m === 'all' ? 'Tous' : m}
          </Button>
        ))}
      </div>

      <ScrollArea className='surface-card p-2'>
        <div className='space-y-2'>
          {filtered.map((d) => (
            <div
              key={d.id}
              className='flex items-center justify-between rounded-xl border p-3'
            >
              <div className='flex items-center gap-3'>
                <span className='grid size-9 place-items-center rounded-lg bg-muted/60'>
                  <ScanLine className='size-4 text-primary' />
                </span>
                <div>
                  <p className='text-sm font-medium'>{d.serial}</p>
                  <p className='text-xs text-muted-foreground'>
                    {d.model} · vu {d.lastSeen.toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Badge className={STATE_CLS[d.state].cls}>{STATE_CLS[d.state].label}</Badge>
                {!d.enrolled && (
                  <Button size='sm' variant='secondary' onClick={() => enroll(d.id)}>
                    Enrôler
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </PageShell>
  )
}

function Counter({
  icon: Icon,
  label,
  value,
  cls,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  cls: string
}) {
  return (
    <Card>
      <CardContent className='flex items-center gap-3 py-3'>
        <span className={`grid size-9 place-items-center rounded-lg bg-muted/60 ${cls}`}>
          <Icon className='size-4' />
        </span>
        <div>
          <p className='text-xs text-muted-foreground'>{label}</p>
          <p className='text-lg font-bold'>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

