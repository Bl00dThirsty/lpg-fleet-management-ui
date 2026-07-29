import { useMemo } from 'react'
import { Activity, Cpu, MemoryStick, Network, ServerCog, TriangleAlert } from 'lucide-react'
import { faker } from '@faker-js/faker'
import { PageHeader } from '@/components/layout/page-header'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@lpg/ui'

faker.seed(771)

type Health = 'ok' | 'degraded' | 'critical'
const HEALTH: Record<Health, { label: string; cls: string }> = {
  ok: { label: 'OK', cls: 'bg-emerald-600 text-white' },
  degraded: { label: 'Dégradé', cls: 'bg-amber-500 text-white' },
  critical: { label: 'Critique', cls: 'bg-rose-600 text-white' },
}

function spark(values: number[], stroke: string) {
  const w = 100
  const h = 28
  const max = Math.max(...values)
  const min = Math.min(...values)
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / (max - min || 1)) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className='h-7 w-full' preserveAspectRatio='none'>
      <polyline points={pts} fill='none' stroke={stroke} strokeWidth='1.5' />
    </svg>
  )
}

function randSeries(n: number, base: number, spread: number) {
  return Array.from({ length: n }, () =>
    Math.max(0, Math.round(base + faker.number.float({ min: -spread, max: spread })))
  )
}

const DASHBOARDS = [
  { id: 'cpu', title: 'CPU global', unit: '%', base: 42, spread: 20, stroke: '#22c55e' },
  { id: 'mem', title: 'Mémoire', unit: '%', base: 61, spread: 15, stroke: '#3b82f6' },
  { id: 'net', title: 'Réseau I/O', unit: 'Mb/s', base: 320, spread: 120, stroke: '#a855f7' },
  { id: 'kafka', title: 'Kafka lag', unit: 'msg', base: 1200, spread: 900, stroke: '#f59e0b' },
  { id: 'pda', title: 'PDA connectés', unit: '', base: 211, spread: 18, stroke: '#14a8a6' },
  { id: 'gps', title: 'Précision GPS', unit: 'm', base: 6, spread: 4, stroke: '#ec4899' },
  { id: 'rfid', title: 'Scans RFID/h', unit: '', base: 8400, spread: 2200, stroke: '#0ea5e9' },
  { id: 'err', title: 'Taux d’erreur', unit: '%', base: 0.4, spread: 0.6, stroke: '#ef4444' },
]

export function SupervisorInfraScreen() {
  const series = useMemo(
    () => DASHBOARDS.map((d) => ({ ...d, data: randSeries(24, d.base, d.spread) })),
    []
  )
  const [summary] = useMemo(() => {
    const cpu = faker.number.int({ min: 38, max: 55 })
    const mem = faker.number.int({ min: 55, max: 70 })
    const net = faker.number.int({ min: 250, max: 420 })
    const uptime = '99,52%'
    return [{ cpu, mem, net, uptime }]
  }, [])

  return (
    <PageShell>
      <PageHeader
        title='Dashboards infra (Grafana)'
        description='8 dashboards dédiés — Prometheus, CPU, mémoire, réseau, Kafka, PDA, GPS, RFID.'
        actions={
          <Badge variant='outline' className='gap-1'>
            <ServerCog className='size-3.5' /> 99,5% dispo.
          </Badge>
        }
      />

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4'>
        <MiniMetric icon={Cpu} label='CPU' value={`${summary.cpu}%`} />
        <MiniMetric icon={MemoryStick} label='Mémoire' value={`${summary.mem}%`} />
        <MiniMetric icon={Network} label='Réseau' value={`${summary.net} Mb/s`} />
        <MiniMetric icon={Activity} label='Uptime' value={summary.uptime} />
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {series.map((d) => {
          const last = d.data[d.data.length - 1]
          const health: Health =
            d.id === 'err'
              ? last > 1
                ? 'critical'
                : 'ok'
              : d.id === 'kafka'
                ? last > 1800
                  ? 'degraded'
                  : 'ok'
                : 'ok'
          return (
            <Card key={d.id}>
              <CardHeader className='flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  {d.title}
                </CardTitle>
                <Badge className={HEALTH[health].cls}>{HEALTH[health].label}</Badge>
              </CardHeader>
              <CardContent className='space-y-1'>
                <div className='text-xl font-bold'>
                  {last.toLocaleString('fr-FR')}
                  {d.unit && <span className='ml-1 text-sm font-normal text-muted-foreground'>{d.unit}</span>}
                </div>
                {spark(d.data, d.stroke)}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <TriangleAlert className='size-4 text-rose-500' /> Alertes infrastructure actives
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {[
            { s: 'critical' as Health, t: 'Défaillance de connexion GPS — PDA #PDA-2291' },
            { s: 'degraded' as Health, t: 'Kafka lag > 1800 msg sur le topic tracking' },
            { s: 'degraded' as Health, t: 'Batterie faible — 11 équipements IoT' },
          ].map((a, i) => (
            <div key={i} className='flex items-center gap-2 rounded-lg border px-3 py-2'>
              <Badge className={HEALTH[a.s].cls}>{HEALTH[a.s].label}</Badge>
              <span>{a.t}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  )
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className='flex items-center gap-3 py-3'>
        <span className='grid size-9 place-items-center rounded-lg bg-muted/60'>
          <Icon className='size-4 text-primary' />
        </span>
        <div>
          <p className='text-xs text-muted-foreground'>{label}</p>
          <p className='text-lg font-bold'>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

