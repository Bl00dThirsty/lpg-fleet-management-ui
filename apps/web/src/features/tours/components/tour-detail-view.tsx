import { useMemo, useState, type ElementType } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPinned,
  Package,
  Smartphone,
  Truck,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  checkpointStatusLabels,
  routeSeverityClasses,
  routeSeverityLabels,
  routeStatusLabels,
  type CheckpointStatus,
  type TourActivity,
} from '../data/tour-activity'
import type { Checkpoint } from '@lpg/types'
import { useToursStore } from '@/store/tours-store'
import { tourActions } from '../data/tour-machine'
import { TourActions, isCloseAllowed } from './tour-actions'
import { TourCorridorMap } from './tour-corridor-map'
import { TourLpgVariationPanel } from './tour-lpg-variation-panel'
import { TourTelemetryChart } from './tour-telemetry-chart'
import { TourPdaSimulatorModal } from './tour-pda-simulator-modal'
import { formatTm, formatBtl } from '@/features/map/utils/format'

type TourDetailViewProps = {
  trip: TourActivity | null
}

export function TourDetailView({ trip }: TourDetailViewProps) {
  const [pdaModalOpen, setPdaModalOpen] = useState(false)
  const checkpointsByTour = useToursStore((s) => s.checkpointsByTour[trip?.id ?? ''])
  const allCheckpoints = useToursStore((s) => s.checkpoints)
  const tourCheckpoints: Checkpoint[] = useMemo(() => {
    if (!trip) return []
    if (checkpointsByTour) return checkpointsByTour
    return allCheckpoints.filter((c) => (c.tournee_id ?? c.tour_id) === trip.id)
  }, [trip, checkpointsByTour, allCheckpoints])
  const checkpointById = useMemo(
    () => new Map(tourCheckpoints.map((c) => [c.id, c])),
    [tourCheckpoints],
  )
  const [busyCheckpointId, setBusyCheckpointId] = useState<string | null>(null)
  const [skipTargetId, setSkipTargetId] = useState<string | null>(null)
  const [skipReason, setSkipReason] = useState('')

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

  const closeOfferedByMachine = tourActions({
    status: trip.tourneeStatus,
    execution_mode: trip.execution_mode,
  }).includes('close')
  const closeBlockedByCheckpoints = closeOfferedByMachine && !isCloseAllowed(tourCheckpoints)

  async function runCheckpointAction(checkpointId: string, kind: 'reach' | 'complete') {
    setBusyCheckpointId(checkpointId)
    try {
      if (kind === 'reach') {
        await useToursStore.getState().reachCheckpoint(checkpointId)
        toast.success('Arrivée enregistrée')
      } else {
        await useToursStore.getState().completeCheckpoint(checkpointId)
        toast.success('Point de contrôle terminé')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    } finally {
      setBusyCheckpointId(null)
    }
  }

  async function confirmSkip() {
    if (!skipTargetId || !skipReason.trim()) return
    setBusyCheckpointId(skipTargetId)
    try {
      await useToursStore.getState().skipCheckpoint(skipTargetId, skipReason.trim())
      toast.success('Point de contrôle sauté')
      setSkipTargetId(null)
      setSkipReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    } finally {
      setBusyCheckpointId(null)
    }
  }

  return (
    <div className='space-y-4'>
      <Card className='overflow-hidden border-transparent shadow-sm'>
        <div className='bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(15,23,42,0.96),rgba(6,78,59,0.96))] px-6 py-6 text-slate-50'>
          <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge className='border-transparent bg-white/10 text-white'>
                  {trip.reference}
                </Badge>
                <Badge className='border-transparent bg-white/10 text-white'>
                  {routeStatusLabels[trip.status]}
                </Badge>
                <Badge className='border-transparent bg-white/10 text-white'>
                  {routeSeverityLabels[trip.attentionLevel]}
                </Badge>
                <Button
                  size='sm'
                  variant='secondary'
                  className='bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-sm flex items-center gap-1.5 ml-2'
                  onClick={() => setPdaModalOpen(true)}
                >
                  <Smartphone className='size-4' />
                  Terminal PDA Livreur
                </Button>
              </div>

              <div className='space-y-2'>
                <h2 className='font-display text-2xl font-semibold tracking-tight'>
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
                value={formatQuantity(trip.loadedQuantity, trip.tourneeType)}
              />
              <HeroMetric
                label='Volume livre'
                value={formatQuantity(trip.deliveredQuantity, trip.tourneeType)}
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
                  Prochaine étape: {trip.nextStop?.site.name ?? '—'}
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
                icon={AlertTriangle}
                label='Écart non justifié'
                value={trip.unaccounted > 0 ? formatQuantity(trip.unaccounted, trip.tourneeType) : trip.tourneeType === 'VRAC' ? '0 TM' : '0 btl'}
                hint={
                  trip.unaccounted > 0
                    ? 'À expliquer avant clôture'
                    : 'Bilan de charge cohérent'
                }
              />
              <DetailSignal
                icon={MapPinned}
                label='Étapes couvertes'
                value={`${trip.completed_checkpoints}/${trip.checkpoint_count}`}
                hint={`${trip.checkpoint_count - trip.completed_checkpoints} restantes`}
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
              <DetailSignal
                icon={Package}
                label='Volume restant'
                value={formatQuantity(trip.remainingQuantity, trip.tourneeType)}
                hint={`${trip.remainingPercent}% de la charge initiale`}
              />
              <DetailSignal
                icon={CheckCircle2}
                label='Livraison comptabilisée'
                value={formatQuantity(trip.deliveredQuantity, trip.tourneeType)}
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
                value={`${trip.truck.id} - ${trip.truck.license_plate}`}
              />
              <InfoRow
                icon={UserRound}
                label='Chauffeur'
                value={trip.truck.assigned_driver ?? ''}
              />
              <InfoRow
                icon={UserRound}
                label='Responsable mission'
                value={trip.missionLead}
              />
              <InfoRow
                icon={MapPinned}
                label='Position courante'
                value={trip.truck.current_location ?? ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <CardTitle>Actions de la tournée</CardTitle>
            <CardDescription>
              Transitions validées par le serveur — un refus est affiché sans modifier le suivi.
            </CardDescription>
          </div>
          <Button
            onClick={() => setPdaModalOpen(true)}
            className='bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow flex items-center gap-2 shrink-0'
          >
            <Smartphone className='size-4' />
            Simulateur PDA Livreur (Terrain)
          </Button>
        </CardHeader>
        <CardContent className='space-y-3'>
          <TourActions tour={trip} checkpoints={tourCheckpoints} />
          {closeBlockedByCheckpoints && (
            <p className='text-sm text-amber-700 dark:text-amber-300'>
              Clôture impossible : tous les points de contrôle doivent être terminés ou sautés.
            </p>
          )}
        </CardContent>
      </Card>

       <TourLpgVariationPanel trip={trip} formatQuantity={(v) => formatQuantity(v, trip.tourneeType)} zeroUnit={trip.tourneeType === 'VRAC' ? '0 TM' : '0 btl'} />

      <section className='grid gap-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]'>
        <TourCorridorMap trip={trip} formatDateTime={formatDateTime} formatQuantity={(v) => formatQuantity(v, trip.tourneeType)} />
        <TourTelemetryChart
          trip={trip}
          formatQuantity={(v) => formatQuantity(v, trip.tourneeType)}
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
              const isCurrent = !stop.completed && stop.id === trip.nextStop?.id

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
                          stop.deliveredQuantity
                            ? formatQuantity(stop.deliveredQuantity, trip.tourneeType)
                            : '--'
                        }
                      />
                      <TripListMetric label='Rôle' value={stop.role} />
                    </div>

                    <p className='mt-3 text-sm text-muted-foreground'>
                      {stop.note}
                    </p>

                    <StopCheckpointControls
                      status={checkpointById.get(stop.id)?.status ?? stop.checkpointStatus}
                      disabled={busyCheckpointId === stop.id}
                      onReach={() => runCheckpointAction(stop.id, 'reach')}
                      onComplete={() => runCheckpointAction(stop.id, 'complete')}
                      onSkip={() => {
                        setSkipTargetId(stop.id)
                        setSkipReason('')
                      }}
                    />
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
            <div className='rounded-2xl bg-muted/25 px-4 py-4 shadow-xs'>
              <p className='text-sm font-semibold'>SLA & anomalies</p>
              {trip.sla_transporter_no_ack && (
                <p className='mt-2 flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-200'>
                  Accusé transporteur absent (SLA &gt; 4 h)
                  {trip.anomaly_ids.length > 0 && (
                    <span className='text-xs font-normal text-amber-600'>
                      {trip.anomaly_ids.join(', ')}
                    </span>
                  )}
                </p>
              )}
              {trip.sla_unassigned_too_long && (
                <p className='mt-1 flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-200'>
                  Tournée non assignée trop longtemps (SLA &gt; 12 h)
                </p>
              )}
              {!trip.sla_transporter_no_ack && !trip.sla_unassigned_too_long && (
                <p className='mt-2 text-sm text-muted-foreground'>
                  Aucun signalement SLA actif sur cette tournée.
                </p>
              )}
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

      <Dialog
        open={skipTargetId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setSkipTargetId(null)
            setSkipReason('')
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Sauter le point de contrôle</DialogTitle>
            <DialogDescription>
              Le motif du saut est obligatoire et sera transmis au serveur.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2 py-2'>
            <label htmlFor='skip-reason' className='text-sm font-medium'>
              Motif du saut
            </label>
            <Textarea
              id='skip-reason'
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder='Ex. client fermé, accès impossible…'
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setSkipTargetId(null)
                setSkipReason('')
              }}
            >
              Annuler
            </Button>
            <Button
              disabled={!skipReason.trim() || busyCheckpointId !== null}
              onClick={confirmSkip}
            >
              Confirmer le saut
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TourPdaSimulatorModal
        open={pdaModalOpen}
        onOpenChange={setPdaModalOpen}
        trip={trip}
      />
    </div>
  )
}

function StopCheckpointControls({
  status,
  disabled,
  onReach,
  onComplete,
  onSkip,
}: {
  status: CheckpointStatus | undefined
  disabled: boolean
  onReach: () => void
  onComplete: () => void
  onSkip: () => void
}) {
  if (status === undefined || status === 'COMPLETED' || status === 'SKIPPED') return null
  return (
    <div className='mt-3 flex flex-wrap items-center gap-2'>
      <Badge variant='outline' className='border-transparent bg-background/75'>
        {checkpointStatusLabels[status]}
      </Badge>
      {status === 'PENDING' && (
        <Button size='sm' onClick={onReach} disabled={disabled}>
          Marquer arrivé
        </Button>
      )}
      {status === 'REACHED' && (
        <Button size='sm' onClick={onComplete} disabled={disabled}>
          Terminer le point
        </Button>
      )}
      <Button size='sm' variant='outline' onClick={onSkip} disabled={disabled}>
        Sauter le point
      </Button>
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

function formatQuantity(value: number, type: TourActivity['tourneeType'] = 'VRAC'): string {
  if (type === 'VRAC') return formatTm(value)
  return formatBtl(value)
}

function formatShortTime(value: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDateTime(value: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(date)
}
