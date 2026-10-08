import { MissionWorkflow } from './mission-workflow'
import { MissionQuantityEditor } from './mission-quantity-editor'
import { MissionDocuments } from './mission-documents'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/data-table'
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
  type CheckpointStatus,
  type TourActivity,
} from '../data/tour-activity'
import type { Checkpoint } from '@lpg/types'
import { useToursStore } from '@/store/tours-store'
import { tourActions } from '../data/tour-machine'
import { TourActions, isCloseAllowed } from './tour-actions'
import { TourCorridorMap } from './tour-corridor-map'
import { TourPdaSimulatorModal } from './tour-pda-simulator-modal'
import { formatTm, formatBtl } from '@/features/map/utils/format'

type TourDetailViewProps = {
  trip: TourActivity | null
}

export function TourDetailView({ trip }: TourDetailViewProps) {
  const checkpointsByTour = useToursStore(
    (s) => s.checkpointsByTour[trip?.id ?? '']
  )
  const allCheckpoints = useToursStore((s) => s.checkpoints)
  const tourCheckpoints: Checkpoint[] = useMemo(() => {
    if (!trip) return []
    if (checkpointsByTour) return checkpointsByTour
    return allCheckpoints.filter((c) => (c.tournee_id ?? c.tour_id) === trip.id)
  }, [trip, checkpointsByTour, allCheckpoints])
  const checkpointById = useMemo(
    () => new Map(tourCheckpoints.map((c) => [c.id, c])),
    [tourCheckpoints]
  )
  const [busyCheckpointId, setBusyCheckpointId] = useState<string | null>(null)
  const [skipTargetId, setSkipTargetId] = useState<string | null>(null)
  const [skipReason, setSkipReason] = useState('')
  const [pdaModalOpen, setPdaModalOpen] = useState(false)

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
  const closeBlockedByCheckpoints =
    closeOfferedByMachine && !isCloseAllowed(tourCheckpoints)

  async function runCheckpointAction(
    checkpointId: string,
    kind: 'reach' | 'complete'
  ) {
    setBusyCheckpointId(checkpointId)
    try {
      if (kind === 'reach') {
        await useToursStore.getState().reachCheckpoint(checkpointId)
        toast.success('Arrivée enregistrée')
      } else {
        await useToursStore.getState().completeCheckpoint(checkpointId)
        toast.success('Point de contrôle terminé')
        const updatedCheckpoints = trip
          ? useToursStore
              .getState()
              .checkpoints.filter(
                (c) => (c.tournee_id ?? c.tour_id) === trip.id
              )
          : []
        const allDone =
          updatedCheckpoints.length > 0 &&
          updatedCheckpoints.every(
            (c) => c.status === 'COMPLETED' || c.status === 'SKIPPED'
          )
        if (allDone) {
          toast.success(
            'Tous les points sont livrés — Tournée terminée avec succès !'
          )
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
      await useToursStore
        .getState()
        .skipCheckpoint(skipTargetId, skipReason.trim())
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
      <Card>
        <CardHeader className='space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <Badge variant='outline'>{trip.reference}</Badge>
              <StatusBadge
                activity={trip.mission_kind === 'PICKUP' ? 'PICKUP' : 'TOUR'}
                value={
                  trip.mission_kind === 'PICKUP'
                    ? (trip.pickup_status ?? trip.tourneeStatus)
                    : trip.tourneeStatus
                }
              />
            </div>
            <TourActions tour={trip} checkpoints={tourCheckpoints} />
          </div>
          <CardTitle>
            {trip.originSite.name} → {trip.destinationSite.name}
          </CardTitle>
          <CardDescription>
            {trip.customerName} · {trip.transporter_name ?? 'Flotte interne'}
          </CardDescription>
          <MissionWorkflow trip={trip} />
          {closeBlockedByCheckpoints && (
            <p className='text-sm text-destructive'>
              Terminez ou justifiez chaque étape avant de clôturer la mission.
            </p>
          )}
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div>
            <p className='text-xs text-muted-foreground'>Quantité prévue</p>
            {trip.mission_kind === 'PICKUP' ? (
              <MissionQuantityEditor
                tourId={trip.id}
                value={trip.requested_quantity}
              />
            ) : (
              <p className='mt-2 font-semibold'>
                {formatQuantity(trip.requested_quantity, trip.tourneeType)}
              </p>
            )}
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Créneau prévu</p>
            <p className='mt-2 font-semibold'>
              {formatDateTime(trip.scheduled_at ?? '')}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>
              Véhicule · Chauffeur
            </p>
            <p className='mt-2 font-semibold'>
              {trip.vehicle_plate ?? 'À affecter'} ·{' '}
              {trip.driver_name ?? 'À affecter'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Livreur</p>
            <p className='mt-2 font-semibold'>
              {trip.livreur_name ?? 'À affecter'}
            </p>
          </div>
        </CardContent>
      </Card>
      <details className='rounded-lg border bg-card p-4'>
        <summary className='cursor-pointer text-sm font-medium'>
          Itinéraire et suivi cartographique
        </summary>
        <div className='mt-4'>
          <TourCorridorMap
            trip={trip}
            formatDateTime={formatDateTime}
            formatQuantity={(v) => formatQuantity(v, trip.tourneeType)}
          />
        </div>
      </details>
      <details className='rounded-lg border bg-card p-4'>
        <summary className='cursor-pointer text-sm font-medium'>
          Bilan et informations de suivi
        </summary>
        <div className='mt-4 grid gap-3 sm:grid-cols-3'>
          <TripListMetric
            label='Quantité livrée'
            value={formatQuantity(trip.deliveredQuantity, trip.tourneeType)}
          />
          <TripListMetric
            label='Dernière actualisation'
            value={formatDateTime(trip.lastUpdatedAt)}
          />
          <TripListMetric
            label='Étapes terminées'
            value={`${trip.completed_checkpoints}/${trip.checkpoint_count}`}
          />
        </div>
      </details>
      <section className='space-y-4'>
        <Card>
          <CardHeader>
            <CardTitle>Étapes et justificatifs</CardTitle>
            <CardDescription>
              Lecture métier de la tournée, du chargement à la livraison.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {trip.stops.map((stop, index) => {
              const liveCp = checkpointById.get(stop.id)
              const currentStatus =
                liveCp?.status ??
                stop.checkpointStatus ??
                (stop.completed ? 'COMPLETED' : 'PENDING')
              const isCompleted =
                currentStatus === 'COMPLETED' || currentStatus === 'SKIPPED'
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
                            <span>
                              Dépôt source :{' '}
                              <strong className='font-medium text-foreground'>
                                {stop.pointName || stop.site.name}
                              </strong>
                            </span>
                          ) : (
                            <span>
                              Client destinataire :{' '}
                              <strong className='font-medium text-foreground'>
                                {stop.clientName ||
                                  stop.pointName ||
                                  stop.site.name}
                              </strong>
                              {stop.pointName &&
                              stop.pointName !== stop.clientName
                                ? ` (${stop.pointName})`
                                : ''}
                            </span>
                          )}
                          {stop.contactName ? (
                            <span className='ml-2 text-xs text-muted-foreground'>
                              • Contact : {stop.contactName}{' '}
                              {stop.contactPhone
                                ? `(${stop.contactPhone})`
                                : ''}
                            </span>
                          ) : null}
                          {stop.address ? (
                            <span className='block text-xs text-muted-foreground mt-0.5'>
                              {stop.address}
                            </span>
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
                          ? currentStatus === 'SKIPPED'
                            ? 'Sauté'
                            : 'Terminé'
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
                        value={
                          stop.clientName || stop.pointName || stop.site.name
                        }
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

                    {stop.role !== 'loading' &&
                      trip.mission_kind !== 'PICKUP' &&
                      liveCp?.client_site_id && (
                        <div className='mt-3'>
                          <span className='text-xs text-muted-foreground'>
                            Quantité prévue ·{' '}
                          </span>
                          <MissionQuantityEditor
                            tourId={trip.id}
                            checkpointId={stop.id}
                            value={liveCp.expected_quantity ?? 0}
                          />
                        </div>
                      )}
                    <p className='mt-3 text-sm text-muted-foreground'>
                      {stop.note}
                    </p>

                    <MissionDocuments
                      missionId={trip.id}
                      stops={trip.stops}
                      checkpointId={stop.id}
                      missionKind={trip.mission_kind ?? 'DELIVERY'}
                    />

                    {import.meta.env.VITE_API_MODE !== 'http' && (
                      <StopCheckpointControls
                        status={currentStatus}
                        disabled={busyCheckpointId === stop.id}
                        onReach={() => runCheckpointAction(stop.id, 'reach')}
                        onComplete={() =>
                          runCheckpointAction(stop.id, 'complete')
                        }
                        onSkip={() => {
                          setSkipTargetId(stop.id)
                          setSkipReason('')
                        }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <details className='rounded-lg border bg-card p-4'>
          <summary className='cursor-pointer text-sm font-medium'>
            Alertes et journal d’activité
          </summary>
          <Card className='mt-4 border-0 shadow-none'>
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
                    Délai d’accusé transporteur dépassé
                    {trip.anomaly_ids.length > 0 && (
                      <span className='text-xs font-normal text-amber-600'>
                        {trip.anomaly_ids.join(', ')}
                      </span>
                    )}
                  </p>
                )}
                {trip.sla_unassigned_too_long && (
                  <p className='mt-1 flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-200'>
                    Délai d’affectation dépassé
                  </p>
                )}
                {!trip.sla_transporter_no_ack &&
                  !trip.sla_unassigned_too_long && (
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
                      <Badge
                        className={cn(routeSeverityClasses[event.severity])}
                      >
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
        </details>
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
  if (status === undefined || status === 'COMPLETED' || status === 'SKIPPED')
    return null
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

function formatQuantity(
  value: number,
  type: TourActivity['tourneeType'] = 'VRAC'
): string {
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
