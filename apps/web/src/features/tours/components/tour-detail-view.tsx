import { useMemo, useState } from 'react'
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
import { formatTm, formatBtl } from '@/features/map/utils/format'

type TourDetailViewProps = {
  trip: TourActivity | null
}

export function TourDetailView({ trip }: TourDetailViewProps) {
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
        const updatedCheckpoints = trip
          ? useToursStore.getState().checkpoints.filter(
              (c) => (c.tournee_id ?? c.tour_id) === trip.id,
            )
          : []
        const allDone =
          updatedCheckpoints.length > 0 &&
          updatedCheckpoints.every((c) => c.status === 'COMPLETED' || c.status === 'SKIPPED')
        if (allDone) {
          toast.success('Tous les points sont livrés — Tournée terminée avec succès !')
        }
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
      <Card className='overflow-hidden border border-border shadow-sm'>
        <div className='border-b border-border bg-card px-6 py-5 text-card-foreground'>
          <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline'>
                  {trip.reference}
                </Badge>
                <Badge variant='secondary'>
                  {routeStatusLabels[trip.status]}
                </Badge>
                <Badge variant='outline'>
                  {routeSeverityLabels[trip.attentionLevel]}
                </Badge>
              </div>

              <div className='space-y-1'>
                <h2 className='text-2xl font-bold tracking-tight text-foreground flex items-center gap-2'>
                  {trip.originSite.name}
                  <span className='text-muted-foreground font-normal'>→</span>
                  {trip.destinationSite.name}
                </h2>
                <p className='max-w-3xl text-xs text-muted-foreground'>
                  Tournée {trip.reference} pour {trip.customerName}. Suivi logistique et étapes terrain.
                </p>
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              <HeroMetric
                label='Charge initiale'
                value={formatQuantity(trip.loadedQuantity, trip.tourneeType)}
              />
              <HeroMetric
                label='Volume livré'
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
                label='Écart non justifié'
                value={trip.unaccounted > 0 ? formatQuantity(trip.unaccounted, trip.tourneeType) : trip.tourneeType === 'VRAC' ? '0 TM' : '0 btl'}
                hint={
                  trip.unaccounted > 0
                    ? 'À expliquer avant clôture'
                    : 'Bilan de charge cohérent'
                }
              />
              <DetailSignal
                label='Étapes couvertes'
                value={`${trip.completed_checkpoints}/${trip.checkpoint_count}`}
                hint={`${trip.checkpoint_count - trip.completed_checkpoints} restantes`}
              />
              <DetailSignal
                label='Dernier ping'
                value={formatDateTime(trip.lastUpdatedAt)}
                hint={
                  trip.onTime
                    ? 'Tournée dans la fenêtre attendue'
                    : 'Suivi resserré nécessaire'
                }
              />
              <DetailSignal
                label='Volume restant'
                value={formatQuantity(trip.remainingQuantity, trip.tourneeType)}
                hint={`${trip.remainingPercent}% de la charge initiale`}
              />
              <DetailSignal
                label='Livraison comptabilisée'
                value={formatQuantity(trip.deliveredQuantity, trip.tourneeType)}
                hint={`${trip.deliveredPercent}% déjà affectés`}
              />
            </div>
          </div>

          <div className='rounded-lg border border-border bg-card p-4 shadow-xs'>
            <p className='text-sm font-semibold mb-3'>Équipe engagée</p>
            <div className='space-y-2 text-sm'>
              <InfoRow
                label='Camion'
                value={`${trip.truck.id} - ${trip.truck.license_plate}`}
              />
              <InfoRow
                label='Chauffeur'
                value={trip.truck.assigned_driver ?? ''}
              />
              <InfoRow
                label='Responsable mission'
                value={trip.missionLead}
              />
              <InfoRow
                label='Position courante'
                value={trip.truck.current_location ?? ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Actions de la tournée</CardTitle>
            <CardDescription>
              Transitions validées par le serveur — un refus est affiché sans modifier le suivi.
            </CardDescription>
          </div>
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

      <section className='w-full'>
        <TourCorridorMap trip={trip} formatDateTime={formatDateTime} formatQuantity={(v) => formatQuantity(v, trip.tourneeType)} />
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
              const liveCp = checkpointById.get(stop.id)
              const currentStatus = liveCp?.status ?? stop.checkpointStatus ?? (stop.completed ? 'COMPLETED' : 'PENDING')
              const isCompleted = currentStatus === 'COMPLETED' || currentStatus === 'SKIPPED'
              const isCurrent = !isCompleted && stop.id === trip.nextStop?.id

              return (
                <div key={stop.id} className='flex gap-4'>
                  <div className='flex flex-col items-center'>
                    <div
                      className={cn(
                        'flex size-10 items-center justify-center rounded-full text-sm font-semibold shadow-xs',
                        isCompleted
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

                  <div className='flex-1 rounded-lg border border-border bg-card px-4 py-4 shadow-xs'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                      <div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='text-sm font-semibold'>{stop.title}</p>
                          <Badge
                            variant='outline'
                            className='border-transparent bg-background/75'
                          >
                            {stop.city || stop.site.city}
                          </Badge>
                        </div>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {stop.role === 'loading' ? (
                            <span>Dépôt source : <strong className='font-medium text-foreground'>{stop.pointName || stop.site.name}</strong></span>
                          ) : (
                            <span>
                              Client destinataire : <strong className='font-medium text-foreground'>{stop.clientName || stop.pointName || stop.site.name}</strong>
                              {stop.pointName && stop.pointName !== stop.clientName ? ` (${stop.pointName})` : ''}
                            </span>
                          )}
                          {stop.contactName ? (
                            <span className='ml-2 text-xs text-muted-foreground'>• Contact : {stop.contactName} {stop.contactPhone ? `(${stop.contactPhone})` : ''}</span>
                          ) : null}
                          {stop.address ? (
                            <span className='block text-xs text-muted-foreground mt-0.5'>{stop.address}</span>
                          ) : null}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          'border-transparent',
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : currentStatus === 'REACHED'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                              : isCurrent
                                ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                                : 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {isCompleted
                          ? (currentStatus === 'SKIPPED' ? 'Sauté' : 'Terminé')
                          : currentStatus === 'REACHED'
                            ? 'Arrivé sur site'
                            : isCurrent
                              ? 'En cours'
                              : 'À venir'}
                      </Badge>
                    </div>

                    <div className='mt-3 grid gap-3 text-sm md:grid-cols-3'>
                      <TripListMetric
                        label='Client / Point de livraison'
                        value={stop.clientName || stop.pointName || stop.site.name}
                      />
                      <TripListMetric
                        label='Volume / Quantité'
                        value={
                          isCompleted
                            ? `${formatQuantity(stop.deliveredQuantity ?? stop.expectedQuantity ?? 0, trip.tourneeType)} livrées`
                            : stop.role === 'loading'
                              ? `${formatQuantity(trip.loadedQuantity || trip.requested_quantity || 0, trip.tourneeType)} à charger`
                              : `${formatQuantity(stop.expectedQuantity ?? 0, trip.tourneeType)} à livrer`
                        }
                      />
                      <TripListMetric
                        label='Statut de livraison'
                        value={
                          currentStatus === 'COMPLETED'
                            ? 'Terminé (Livré)'
                            : currentStatus === 'REACHED'
                              ? 'Arrivé sur site'
                              : currentStatus === 'SKIPPED'
                                ? 'Sauté (non livré)'
                                : 'En attente'
                        }
                      />
                    </div>

                    <p className='mt-3 text-sm text-muted-foreground'>
                      {stop.note}
                    </p>

                    <StopCheckpointControls
                      status={currentStatus}
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
            <div className='rounded-lg border border-border bg-card px-4 py-4 shadow-xs'>
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
                  className='rounded-lg border border-border bg-card px-4 py-4 shadow-xs'
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
    <div className='min-w-[130px] rounded-lg border border-border bg-muted/40 px-4 py-2.5 shadow-xs'>
      <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>{label}</p>
      <p className='mt-1 text-lg font-bold text-foreground'>{value}</p>
    </div>
  )
}

function DetailSignal({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className='rounded-lg border border-border bg-card p-4 shadow-xs'>
      <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        {label}
      </div>
      <p className='mt-2 text-xl font-bold tracking-tight text-foreground'>{value}</p>
      <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className='flex items-baseline justify-between gap-2 border-b border-border/40 pb-2.5 last:border-0 last:pb-0'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className='text-xs font-semibold text-foreground text-right truncate max-w-[190px]'>{value || '—'}</span>
    </div>
  )
}

function TripListMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-lg border border-border/60 bg-muted/30 px-3 py-2'>
      <p className='text-[11px] font-medium tracking-wide text-muted-foreground uppercase'>
        {label}
      </p>
      <p className='mt-1 text-sm font-semibold text-foreground'>{value}</p>
    </div>
  )
}

function formatQuantity(value: number, type: TourActivity['tourneeType'] = 'VRAC'): string {
  if (type === 'VRAC') return formatTm(value)
  return formatBtl(value)
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
