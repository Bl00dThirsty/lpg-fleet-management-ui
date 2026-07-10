import { type ElementType } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gauge,
  MapPinned,
  Package,
  Truck,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  routeSeverityClasses,
  routeSeverityLabels,
  routeStatusLabels,
  type RouteTripView,
} from '../data/routes'
import { RouteCorridorMap } from './route-corridor-map'
import { RouteLpgVariationPanel } from './route-lpg-variation-panel'
import { RouteTelemetryChart } from './route-telemetry-chart'

type RouteDetailsViewProps = {
  trip: RouteTripView | null
  trips: readonly RouteTripView[]
  onSelectTrip: (routeId: string) => void
}

export function RouteDetailsView({
  trip,
  trips,
  onSelectTrip,
}: RouteDetailsViewProps) {
  if (!trip) {
    return (
      <Card>
        <CardContent className='flex min-h-[420px] items-center justify-center p-6'>
          <div className='max-w-md text-center'>
            <p className='text-lg font-semibold'>Aucune tournée à afficher</p>
            <p className='mt-2 text-sm text-muted-foreground'>
              Selectionnez une tournée dans la liste pour afficher ses détails.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedIndex = trips.findIndex((candidate) => candidate.id === trip.id)
  const previousTrip = selectedIndex > 0 ? trips[selectedIndex - 1] : null
  const nextTrip =
    selectedIndex >= 0 && selectedIndex < trips.length - 1
      ? trips[selectedIndex + 1]
      : null

  return (
    <div className='space-y-4'>
      <Card className='border-transparent bg-background/80 shadow-sm'>
        <CardContent className='flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-1'>
            <p className='text-sm font-medium'>Tournée active</p>
            <p className='text-sm text-muted-foreground'>
              Change rapidement de mission sans revenir à la liste.
            </p>
          </div>

          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <Button
              type='button'
              variant='outline'
              className='h-10'
              onClick={() => previousTrip && onSelectTrip(previousTrip.id)}
              disabled={!previousTrip}
            >
              <ArrowLeft className='size-4' />
              Précédente
            </Button>

            <Select value={trip.id} onValueChange={onSelectTrip}>
              <SelectTrigger className='h-10 min-w-[260px]'>
                <SelectValue placeholder='Choisir une tournée' />
              </SelectTrigger>
              <SelectContent>
                {trips.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.reference} - {candidate.originSite.city} /{' '}
                    {candidate.destinationSite.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type='button'
              variant='outline'
              className='h-10'
              onClick={() => nextTrip && onSelectTrip(nextTrip.id)}
              disabled={!nextTrip}
            >
              Suivante
              <ArrowRight className='size-4' />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className='overflow-hidden border-transparent shadow-sm'>
        <div className='bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(15,23,42,0.96),rgba(6,78,59,0.96))] px-6 py-6 text-slate-50'>
          <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-4'>
              <div className='flex flex-wrap gap-2'>
                <Badge className='border-transparent bg-white/10 text-white'>
                  {trip.reference}
                </Badge>
                <Badge className='border-transparent bg-white/10 text-white'>
                  {routeStatusLabels[trip.status]}
                </Badge>
                <Badge className='border-transparent bg-white/10 text-white'>
                  {routeSeverityLabels[trip.attentionLevel]}
                </Badge>
              </div>

              <div className='space-y-2'>
                <h2 className='text-2xl font-semibold tracking-tight'>
                  {trip.originSite.name}
                  <ArrowRight className='mx-2 inline size-5 text-emerald-300' />
                  {trip.destinationSite.name}
                </h2>
                <p className='max-w-3xl text-sm text-slate-300'>
                  Tournée {trip.reference} pour {trip.customerName}. Le suivi
                  rassemble le camion, le niveau GPL, les étapes logistiques et
                  les alertes terrain dans un seul écran.
                </p>
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              <HeroMetric
                label='Charge initiale'
                value={formatKg(trip.loadedQuantityKg)}
              />
              <HeroMetric
                label='Volume livre'
                value={formatKg(trip.deliveredQuantityKg)}
              />
              <HeroMetric
                label='ETA'
                value={formatDateTime(trip.expectedArrivalAt)}
              />
            </div>
          </div>
        </div>

        <CardContent className='grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
          <div className='space-y-4'>
            <div>
              <div className='flex items-center justify-between text-sm'>
                <div>
                  <p className='font-medium'>Progression de la tournée</p>
                  <p className='text-muted-foreground'>
                    {trip.progressPercent}% du corridor logistique couvert
                  </p>
                </div>
                <Badge
                  variant='outline'
                  className='border-transparent bg-muted/35 text-foreground'
                >
                  Prochaine étape: {trip.nextStop.site.name}
                </Badge>
              </div>

              <div className='mt-4 h-3 rounded-full bg-muted'>
                <div
                  className={cn(
                    'h-full rounded-full',
                    trip.status === 'incident'
                      ? 'bg-rose-500'
                      : trip.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-sky-500'
                  )}
                  style={{ width: `${trip.progressPercent}%` }}
                />
              </div>
            </div>

            <div className='grid gap-3 md:grid-cols-3'>
              <DetailSignal
                icon={Gauge}
                label='Pression'
                value={`${trip.latestTelemetry.pressureBar.toFixed(1)} bar`}
                hint={`-${trip.pressureDeltaBar.toFixed(1)} bar`}
              />
              <DetailSignal
                icon={Package}
                label='Volume restant'
                value={formatKg(trip.remainingQuantityKg)}
                hint={`${trip.remainingPercent}% de la charge initiale`}
              />
              <DetailSignal
                icon={CheckCircle2}
                label='Livraison comptabilisée'
                value={formatKg(trip.deliveredQuantityKg)}
                hint={`${trip.deliveredPercent}% déjà affectés`}
              />
            </div>
          </div>

          <div className='rounded-2xl bg-muted/30 p-4 shadow-xs'>
            <p className='text-sm font-medium'>Equipe engagée</p>
            <div className='mt-4 space-y-3 text-sm'>
              <InfoRow
                icon={Truck}
                label='Camion'
                value={`${trip.truck.id} - ${trip.truck.plateNumber}`}
              />
              <InfoRow
                icon={UserRound}
                label='Chauffeur'
                value={trip.truck.assignedDriver}
              />
              <InfoRow
                icon={UserRound}
                label='Responsable mission'
                value={trip.missionLead}
              />
              <InfoRow
                icon={MapPinned}
                label='Position courante'
                value={trip.truck.currentLocation}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <RouteLpgVariationPanel trip={trip} formatKg={formatKg} />

      <section className='grid gap-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]'>
        <RouteCorridorMap trip={trip} formatDateTime={formatDateTime} />
        <RouteTelemetryChart
          trip={trip}
          formatKg={formatKg}
          formatShortTime={formatShortTime}
        />
      </section>

      <section className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <Card>
          <CardHeader>
            <CardTitle>Timeline d'exécution</CardTitle>
            <CardDescription>
              Lecture métier de la tournée, du chargement à la livraison.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {trip.stops.map((stop, index) => {
              const isCurrent = !stop.completed && stop.id === trip.nextStop.id

              return (
                <div key={stop.id} className='flex gap-4'>
                  <div className='flex flex-col items-center'>
                    <div
                      className={cn(
                        'flex size-10 items-center justify-center rounded-full text-sm font-semibold shadow-xs',
                        stop.completed
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : isCurrent
                            ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                            : 'bg-muted/45 text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </div>
                    {index < trip.stops.length - 1 ? (
                      <div className='mt-2 h-full min-h-10 w-px bg-border' />
                    ) : null}
                  </div>

                  <div className='flex-1 rounded-2xl bg-muted/20 px-4 py-4 shadow-xs'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                      <div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='text-sm font-semibold'>{stop.title}</p>
                          <Badge
                            variant='outline'
                            className='border-transparent bg-background/75'
                          >
                            {stop.site.city}
                          </Badge>
                        </div>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {stop.site.name}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          'border-transparent',
                          stop.completed
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : isCurrent
                              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {stop.completed
                          ? 'Terminé'
                          : isCurrent
                            ? 'En cours'
                            : 'À venir'}
                      </Badge>
                    </div>

                    <div className='mt-3 grid gap-3 text-sm md:grid-cols-3'>
                      <TripListMetric
                        label='Fenêtre'
                        value={stop.windowLabel}
                      />
                      <TripListMetric
                        label='Volume'
                        value={
                          stop.deliveredQuantityKg
                            ? formatKg(stop.deliveredQuantityKg)
                            : '--'
                        }
                      />
                      <TripListMetric label='Rôle' value={stop.role} />
                    </div>

                    <p className='mt-3 text-sm text-muted-foreground'>
                      {stop.note}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertes et coordination</CardTitle>
            <CardDescription>
              Points de vigilance pour le suivi operationnel.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-3'>
              <DetailSignal
                icon={AlertTriangle}
                label='Ecart non justifié'
                value={
                  trip.unaccountedKg > 0 ? formatKg(trip.unaccountedKg) : '0 kg'
                }
                hint={
                  trip.unaccountedKg > 0
                    ? 'Doit être expliqué avant clôture'
                    : 'Bilan de charge cohérent'
                }
              />
              <DetailSignal
                icon={Clock3}
                label='Dernier ping'
                value={formatDateTime(trip.lastUpdatedAt)}
                hint={
                  trip.onTime
                    ? 'Tournée dans la fenêtre attendue'
                    : 'Suivi resserré nécessaire'
                }
              />
            </div>

            <Separator />

            <div className='space-y-3'>
              {trip.events.map((event) => (
                <div
                  key={event.id}
                  className='rounded-2xl bg-muted/25 px-4 py-4 shadow-xs'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='text-sm font-semibold'>{event.title}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {event.description}
                      </p>
                    </div>
                    <Badge className={cn(routeSeverityClasses[event.severity])}>
                      {routeSeverityLabels[event.severity]}
                    </Badge>
                  </div>
                  <p className='mt-3 text-xs text-muted-foreground'>
                    {formatDateTime(event.occurredAt)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className='min-w-[130px] rounded-2xl bg-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur'>
      <p className='text-xs tracking-wide text-slate-300 uppercase'>{label}</p>
      <p className='mt-1 text-lg font-semibold text-white'>{value}</p>
    </div>
  )
}

function DetailSignal({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ElementType
  label: string
  value: string
  hint: string
}) {
  return (
    <div className='rounded-2xl bg-muted/30 px-4 py-4 shadow-xs'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className='size-3.5' />
        {label}
      </div>
      <p className='mt-2 text-lg font-semibold'>{value}</p>
      <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType
  label: string
  value: string
}) {
  return (
    <div className='flex items-start gap-3'>
      <span className='mt-0.5 flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground shadow-xs'>
        <Icon className='size-4' />
      </span>
      <div>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='text-sm font-medium'>{value}</p>
      </div>
    </div>
  )
}

function TripListMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl bg-muted/25 px-3 py-2.5'>
      <p className='text-[11px] tracking-wide text-muted-foreground uppercase'>
        {label}
      </p>
      <p className='mt-1 text-sm font-medium'>{value}</p>
    </div>
  )
}

function formatKg(value: number) {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)} kg`
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}
