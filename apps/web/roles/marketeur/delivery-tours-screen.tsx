import { useMemo, useState } from 'react'
import { Route, Truck, CheckCircle2, Circle, PackageCheck, PackageX, XCircle } from 'lucide-react'
import { faker } from '@faker-js/faker'
import { PageHeader } from '@/components/layout/page-header'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ScrollArea } from '@lpg/ui'
import { getRouteTripsView, routeStatusLabels, type RouteTripView } from '@/features/routes/routes'

faker.seed(915)

const STATUS_CLS: Record<string, string> = {
  planned: 'bg-slate-500 text-white',
  'in-progress': 'bg-sky-500 text-white',
  completed: 'bg-emerald-600 text-white',
  incident: 'bg-rose-600 text-white',
}

function rfidSummary(_tripId: string) {
  const out = faker.number.int({ min: 8, max: 40 })
  const inn = faker.number.int({ min: 6, max: out })
  return { out, inn }
}

export function MarketeurDeliveryToursScreen() {
  const trips = useMemo<RouteTripView[]>(() => getRouteTripsView(), [])
  const [selectedId, setSelectedId] = useState(trips[0]?.id)
  const selected = trips.find((t) => t.id === selectedId) ?? trips[0]
  const rfid = useMemo(() => (selected ? rfidSummary(selected.id) : { out: 0, inn: 0 }), [selected])

  return (
    <main
      id='main-content'
      className='flex h-[calc(100vh-3.5rem)] flex-col space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <PageHeader
        title='Tournées de livraison'
        description='Tournées de bouteilles 50 kg et vrac vers clients — checkpoints & scans RFID.'
      />

      <div className='grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[22rem_1fr]'>
        <ScrollArea className='surface-card p-2'>
          <div className='space-y-2'>
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={
                  'w-full rounded-xl border p-3 text-left transition-colors ' +
                  (t.id === selected?.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/60')
                }
              >
                <div className='flex items-center justify-between'>
                  <span className='flex items-center gap-2 text-sm font-medium'>
                    <Route className='size-4 text-muted-foreground' />
                    {t.reference}
                  </span>
                  <Badge className={STATUS_CLS[t.status]}>{routeStatusLabels[t.status]}</Badge>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {t.truck.plateNumber} · {t.stops.length} checkpoints · {t.progressPercent}%
                </p>
                <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full bg-primary'
                    style={{ width: `${t.progressPercent}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {selected && (
          <Card className='flex flex-col overflow-hidden'>
            <CardHeader className='flex-row items-center justify-between space-y-0'>
              <div>
                <CardTitle className='text-base'>{selected.reference}</CardTitle>
                <p className='text-xs text-muted-foreground'>
                  {selected.customerName} · {selected.missionLead}
                </p>
              </div>
              <Badge className={STATUS_CLS[selected.status]}>
                {routeStatusLabels[selected.status]}
              </Badge>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col gap-4 overflow-auto'>
              <div className='grid grid-cols-3 gap-3'>
                <Stat icon={Truck} label='Camion' value={selected.truck.plateNumber} />
                <Stat icon={PackageCheck} label='Bouteilles OUT' value={String(rfid.out)} />
                <Stat icon={PackageX} label='Bouteilles IN' value={String(rfid.inn)} />
              </div>

              <div>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Checkpoints ({selected.stops.length})
                </p>
                <ol className='space-y-2'>
                  {selected.stops.map((stop, i) => (
                    <li key={stop.id} className='flex items-start gap-3'>
                      <span className='mt-0.5'>
                        {stop.completed ? (
                          <CheckCircle2 className='size-5 text-emerald-600' />
                        ) : stop.role === 'loading' ? (
                          <Circle className='size-5 text-sky-500' />
                        ) : (
                          <XCircle className='size-5 text-muted-foreground' />
                        )}
                      </span>
                      <div className='flex-1'>
                        <p className='text-sm font-medium'>
                          {i + 1}. {stop.title}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {stop.windowLabel}
                          {stop.deliveredQuantityKg
                            ? ` · ${stop.deliveredQuantityKg} kg livrés`
                            : ''}
                          {stop.note ? ` · ${stop.note}` : ''}
                        </p>
                      </div>
                      <Badge variant='outline' className='capitalize'>
                        {stop.role === 'loading'
                          ? 'Chargement'
                          : stop.role === 'checkpoint'
                            ? 'Étape'
                            : 'Livraison'}
                      </Badge>
                    </li>
                  ))}
                </ol>
              </div>

              <div className='mt-auto flex items-center justify-between border-t pt-3'>
                <span className='text-xs text-muted-foreground'>
                  {selected.onTime ? 'À l’heure' : 'En retard'} ·{' '}
                  {selected.remainingQuantityKg} kg restants
                </span>
                {selected.status !== 'completed' ? (
                  <Button size='sm' className='gap-2'>
                    <CheckCircle2 className='size-4' /> Clôturer la tournée
                  </Button>
                ) : (
                  <Badge variant='outline'>Tournée clôturée</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className='surface-sunken p-3'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className='size-4' />
        {label}
      </div>
      <p className='mt-1 text-sm font-bold'>{value}</p>
    </div>
  )
}
