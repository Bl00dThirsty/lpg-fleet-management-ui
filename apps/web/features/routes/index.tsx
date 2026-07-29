import { type ElementType, startTransition, useMemo, useState } from 'react'
import { Clock3, Package, ShieldAlert, Truck } from 'lucide-react'
import { Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '@lpg/ui'
import { PageShell } from '@/components/layout/page'
import { RouteDetailsView } from './route-details-view'
import { RoutesTable } from './routes-table'
import {
  buildRouteSummary,
  getRouteCustomerOptions,
  getRouteTripsView,
} from './routes'

type RoutesTab = 'trips' | 'details'

export function RoutesPage() {
  const trips = useMemo(() => getRouteTripsView(), [])
  const summary = useMemo(() => buildRouteSummary(trips), [trips])
  const customerOptions = useMemo(() => getRouteCustomerOptions(trips), [trips])
  const [activeTab, setActiveTab] = useState<RoutesTab>('trips')
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id ?? '')

  const selectedTrip =
    trips.find((trip) => trip.id === selectedTripId) ?? trips[0] ?? null

  const handleOpenDetails = (routeId: string) => {
    startTransition(() => {
      setSelectedTripId(routeId)
      setActiveTab('details')
    })
  }

  const handleSelectTrip = (routeId: string) => {
    startTransition(() => {
      setSelectedTripId(routeId)
    })
  }

  return (
    <PageShell fluid>
      <section className='surface-card p-4'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <HeaderPill
              icon={Truck}
              label='Tournées actives'
              value={summary.activeTrips}
            />
            <HeaderPill
              icon={Package}
              label='Volume engagé'
              value={formatKg(summary.activeVolumeKg)}
            />
            <HeaderPill
              icon={Clock3}
              label='Respect ETA'
              value={`${summary.onTimeRate}%`}
            />
            <HeaderPill
              icon={ShieldAlert}
              label='Trajets a surveiller'
              value={summary.attentionCount}
            />
          </div>

          <div className='space-y-3'>
            <div className='space-y-1'>
              <h1 className='text-3xl font-semibold tracking-tight'>
                Tournées GPL
              </h1>
              <p className='max-w-3xl text-sm text-muted-foreground sm:text-base'>
                Suivi des tournées GPL, du chargement en dépôt jusqu'à la
                livraison, avec lecture du niveau embarque, des étapes
                logistiques et des écarts terrain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as RoutesTab)}
        className='space-y-4'
      >
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <TabsList className='h-10'>
            <TabsTrigger value='trips'>Tournées</TabsTrigger>
            <TabsTrigger value='details'>Détails</TabsTrigger>
          </TabsList>

          <Card className='surface-sunken'>
            <CardContent className='flex items-center gap-3 p-3 text-sm'>
              <span className='font-medium'>
                Sélection courante: {selectedTrip?.reference ?? '--'}
              </span>
              <span className='text-muted-foreground'>
                {selectedTrip
                  ? `${selectedTrip.originSite.city} -> ${selectedTrip.destinationSite.city}`
                  : 'Aucune tournée'}
              </span>
            </CardContent>
          </Card>
        </div>

        <TabsContent value='trips'>
          <RoutesTable
            data={trips}
            customerOptions={customerOptions}
            selectedTripId={selectedTrip?.id ?? null}
            onOpenDetails={handleOpenDetails}
          />
        </TabsContent>

        <TabsContent value='details'>
          <RouteDetailsView
            trip={selectedTrip}
            trips={trips}
            onSelectTrip={handleSelectTrip}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}

function HeaderPill({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType
  label: string
  value: string | number
}) {
  return (
    <div className='inline-flex items-center gap-2 rounded-full border-transparent bg-background/90 px-3 py-1.5 text-xs shadow-xs'>
      <Icon className='size-3.5 text-primary' />
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-semibold'>{value}</span>
    </div>
  )
}

function formatKg(value: number) {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)} kg`
}
