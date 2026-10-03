import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  Smartphone,
  CheckCircle2,
  Scan,
  Truck,
  MapPin,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  FileText,
  Radio,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { DeliveryEvent, ScanEvent } from '@lpg/types'
import { useToursStore } from '@/store/tours-store'
import type { TourActivity } from '../data/tour-activity'

interface TourPdaSimulatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip: TourActivity
}

export function TourPdaSimulatorModal({
  open,
  onOpenChange,
  trip,
}: TourPdaSimulatorModalProps) {
  const navigate = useNavigate()
  const storeCheckpoints = useToursStore((s) => s.checkpoints)
  const checkpointsByTour = useToursStore((s) => s.checkpointsByTour[trip.id])
  const recordDeliveryEvent = useToursStore((s) => s.recordDeliveryEvent)
  const recordBulkScanEvents = useToursStore((s) => s.recordBulkScanEvents)

  const tourCheckpoints = useMemo(() => {
    if (checkpointsByTour && checkpointsByTour.length > 0) return checkpointsByTour
    return storeCheckpoints.filter((c) => (c.tournee_id ?? c.tour_id) === trip.id)
  }, [checkpointsByTour, storeCheckpoints, trip.id])

  // Active step calculation
  const depotCheckpoint = tourCheckpoints[0]
  const clientCheckpoints = tourCheckpoints.slice(1)

  // Simulation local interactive state
  const [scannedOutCount, setScannedOutCount] = useState<number>(0)
  const [scannedInCount, setScannedInCount] = useState<number>(0)
  const [isScanning, setIsScanning] = useState(false)
  const [activeClientIndex, setActiveClientIndex] = useState(0)
  const [isClosingTour, setIsClosingTour] = useState(false)

  // Identify current phase
  const isDepotCompleted = depotCheckpoint?.status === 'COMPLETED'
  const isDepotReached = depotCheckpoint?.status === 'REACHED'
  const isTourStarted = trip.tourneeStatus === 'INPROGRESS' || trip.tourneeStatus === 'CHECKPOINTACTIVE'
  const isTourClosed = trip.tourneeStatus === 'CLOSED'

  const activeClientCp = clientCheckpoints[activeClientIndex] || clientCheckpoints[0]
  const allClientsCompleted = clientCheckpoints.length > 0 && clientCheckpoints.every(
    (c) => c.status === 'COMPLETED' || c.status === 'SKIPPED',
  )

  const isVrac = trip.tourneeType === 'VRAC'
  const unit = isVrac ? 'TM' : 'btl'
  const targetQuantity = trip.requested_quantity || 50

  // 1. ARRIVEE DEPOT
  async function handleReachDepot() {
    if (!depotCheckpoint) return
    try {
      await useToursStore.getState().reachCheckpoint(depotCheckpoint.id)
      toast.success('Point Dépôt atteint — GPS géolocalisé [4.0722, 9.6844]')
    } catch {
      toast.error('Erreur confirmation arrivée dépôt')
    }
  }

  // 2. SCAN CHARGEMENT DEPOT (50 OUT)
  function handleScanDepot() {
    setIsScanning(true)
    let current = 0
    const interval = setInterval(() => {
      current += 10
      if (current >= targetQuantity) {
        current = targetQuantity
        clearInterval(interval)
        setIsScanning(false)
        setScannedOutCount(targetQuantity)
        toast.success(`${targetQuantity} ${unit} scannées avec succès (Direction: OUT)`)

        // Generate scan events
        const events: ScanEvent[] = Array.from({ length: 5 }, (_, i) => ({
          id: `scan-depot-${trip.id}-${Date.now()}-${i}`,
          checkpoint_id: depotCheckpoint?.id || 'depot-cp',
          direction: 'OUT',
          rfid_tag_id: `TAG-LPG-CMR-B50-${1000 + i}`,
          livreur_user_id: (trip as { livreur_user_id?: string }).livreur_user_id || trip.livreur_name || 'user-livreur',
          geo_point: [9.5625, 4.0475],
          timestamp: new Date().toISOString(),
        }))
        recordBulkScanEvents(events)
      } else {
        setScannedOutCount(current)
      }
    }, 120)
  }

  // 3. VALIDER CHARGEMENT DEPOT
  async function handleValidateDepot() {
    if (!depotCheckpoint) return
    try {
      await useToursStore.getState().completeCheckpoint(depotCheckpoint.id)
      // Record DeliveryEvent #1
      const deliveryEv: DeliveryEvent = {
        id: `de-depot-${trip.id}-1`,
        tour_id: trip.id,
        checkpoint_id: depotCheckpoint.id,
        sequence: 1,
        site_id: depotCheckpoint.site_id || depotCheckpoint.client_site_id || 'site-depot',
        site_name: trip.stops[0]?.site.name || 'Dépôt Régional',
        delivered: targetQuantity,
        returned: 0,
        geo: [9.5625, 4.0475],
        client_validated: true,
        validated_at: new Date().toISOString(),
      }
      recordDeliveryEvent(deliveryEv)

      // Update loaded quantity in tour
      useToursStore.getState().performAction(trip.id, 'plan', {
        loadedQuantity: targetQuantity,
      })

      toast.success(`Chargement de ${targetQuantity} ${unit} validé au Dépôt ! loaded_quantity = ${targetQuantity}`)
    } catch {
      toast.error('Erreur validation chargement')
    }
  }

  // 4. DEMARRER LA TOURNEE (DEPART)
  async function handleStartTour() {
    try {
      await useToursStore.getState().performActionAsync(trip.id, 'start')
      toast.success(`Tournée ${trip.reference} démarrée ! Statut : INPROGRESS`)
    } catch {
      useToursStore.getState().performAction(trip.id, 'start')
      toast.success(`Tournée ${trip.reference} démarrée ! Statut : INPROGRESS`)
    }
  }

  // 5. ARRIVEE CLIENT
  async function handleReachClient(cpId: string) {
    try {
      await useToursStore.getState().reachCheckpoint(cpId)
      toast.success('Client atteint — Géofence validée')
    } catch {
      toast.error('Erreur confirmation arrivée client')
    }
  }

  // 6. SCAN CLIENT (50 OUT, 45 IN)
  function handleScanClient() {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      setScannedOutCount(targetQuantity)
      setScannedInCount(Math.max(targetQuantity - 5, 0)) // 50 livrées, 45 reprises
      toast.success(`Scans effectués : ${targetQuantity} livrées (OUT) + ${Math.max(targetQuantity - 5, 0)} consignes reprises (IN)`)
    }, 600)
  }

  // 7. VALIDER LIVRAISON CLIENT
  async function handleValidateClient(cpId: string) {
    try {
      await useToursStore.getState().completeCheckpoint(cpId)

      const returnedCount = Math.max(targetQuantity - 5, 0)
      const deliveryEv: DeliveryEvent = {
        id: `de-client-${trip.id}-${cpId}`,
        tour_id: trip.id,
        checkpoint_id: cpId,
        sequence: activeClientIndex + 2,
        site_id: activeClientCp?.client_site_id || activeClientCp?.site_id || 'site-client',
        site_name: trip.stops[activeClientIndex + 1]?.site.name || 'Site Client',
        delivered: targetQuantity,
        returned: returnedCount,
        geo: [11.514, 3.879],
        proof_url: `https://minio.lpg.cm/proofs/bl-${trip.id}-${activeClientIndex + 2}.pdf`,
        client_validated: true,
        validated_at: new Date().toISOString(),
      }
      recordDeliveryEvent(deliveryEv)

      // Update delivered quantity in tour
      useToursStore.getState().performAction(trip.id, 'plan', {
        deliveredQuantity: targetQuantity,
      })

      toast.success(`Livraison client validée avec succès ! BL archivé sur MinIO.`)

      // Move to next client if any
      if (activeClientIndex < clientCheckpoints.length - 1) {
        setActiveClientIndex((prev) => prev + 1)
        setScannedOutCount(0)
        setScannedInCount(0)
      }
    } catch {
      toast.error('Erreur validation livraison client')
    }
  }

  // 8. CLOTURE DE LA TOURNEE
  async function handleCloseTour() {
    setIsClosingTour(true)
    try {
      await useToursStore.getState().performActionAsync(trip.id, 'close', {
        loadedQuantity: targetQuantity,
        deliveredQuantity: targetQuantity,
      })
      toast.success(`Tournée ${trip.reference} clôturée avec succès ! Statut : CLOSED`)
    } catch {
      useToursStore.getState().performAction(trip.id, 'close', {
        loadedQuantity: targetQuantity,
        deliveredQuantity: targetQuantity,
      })
      toast.success(`Tournée ${trip.reference} clôturée avec succès ! Statut : CLOSED`)
    } finally {
      setIsClosingTour(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md p-0 overflow-hidden rounded-3xl border-4 border-slate-800 bg-slate-950 text-slate-100 shadow-2xl'>
        {/* PDA Status Bar */}
        <div className='bg-slate-900 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800'>
          <div className='flex items-center gap-2'>
            <Smartphone className='size-3.5 text-sky-400' />
            <span className='font-mono font-semibold text-slate-200'>CSPH PDA-MOBILE v2.4</span>
          </div>
          <div className='flex items-center gap-2.5 font-mono text-[10px]'>
            <span className='text-emerald-400 font-bold'>4G LTE</span>
            <span className='flex items-center gap-1 text-slate-300'>
              <Radio className='size-3 text-emerald-400 animate-pulse' /> GPS OK
            </span>
            <span className='text-slate-300'>🔋 98%</span>
          </div>
        </div>

        {/* PDA Header */}
        <div className='p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800'>
          <div className='flex items-start justify-between'>
            <div>
              <span className='text-[10px] uppercase tracking-wider text-sky-400 font-bold'>
                Mission en cours
              </span>
              <h3 className='text-base font-bold font-mono text-white flex items-center gap-2'>
                {trip.reference}
                <Badge
                  variant='outline'
                  className='text-[10px] font-mono border-sky-500/40 text-sky-300 bg-sky-500/10'
                >
                  {trip.tourneeStatus}
                </Badge>
              </h3>
            </div>
            <div className='text-right text-xs'>
              <p className='font-medium text-slate-300'>{trip.driver_name || 'Chauffeur titulaire'}</p>
              <p className='text-[11px] text-slate-400'>{trip.vehicle_plate || 'Immatriculation'}</p>
            </div>
          </div>

          <div className='mt-3 flex items-center justify-between text-xs text-slate-400'>
            <span>Progression du flux :</span>
            <span className='font-mono font-semibold text-white'>
              {isTourClosed
                ? 'Terminé 100%'
                : allClientsCompleted
                  ? 'Prêt pour clôture'
                  : isTourStarted
                    ? 'Transport & Livraisons'
                    : isDepotCompleted
                      ? 'Chargé au Dépôt'
                      : 'Chargement Dépôt'}
            </span>
          </div>
          <Progress
            value={
              isTourClosed
                ? 100
                : allClientsCompleted
                  ? 90
                  : isTourStarted
                    ? 60
                    : isDepotCompleted
                      ? 35
                      : 15
            }
            className='h-1.5 mt-1 bg-slate-800'
          />
        </div>

        {/* PDA Screen Content */}
        <div className='p-4 space-y-4 max-h-[60vh] overflow-y-auto'>
          {/* STEP 1: CHARGEMENT AU DEPOT */}
          {!isDepotCompleted && (
            <div className='rounded-2xl border border-sky-500/40 bg-sky-950/20 p-4 space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='flex size-6 items-center justify-center rounded-full bg-sky-500 text-slate-950 font-bold text-xs'>
                    1
                  </span>
                  <div>
                    <h4 className='text-sm font-bold text-white'>Étape 1 : Dépôt de Chargement</h4>
                    <p className='text-xs text-sky-300'>{trip.stops[0]?.site.name || 'Centre Emplisseur'}</p>
                  </div>
                </div>
                <Badge className={isDepotReached ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}>
                  {depotCheckpoint?.status || 'PENDING'}
                </Badge>
              </div>

              {!isDepotReached ? (
                <div className='space-y-2 pt-2'>
                  <p className='text-xs text-slate-300'>
                    Le camion est en approche du centre emplisseur. Confirmez l'arrivée sur site.
                  </p>
                  <Button
                    onClick={handleReachDepot}
                    className='w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center gap-2'
                  >
                    <MapPin className='size-4' />
                    1. Arrivée au Dépôt (Marquer REACHED)
                  </Button>
                </div>
              ) : (
                <div className='space-y-3 pt-2'>
                  <div className='rounded-xl bg-slate-900/80 p-3 border border-slate-800 space-y-2'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-slate-400'>Cargaison à charger :</span>
                      <span className='font-mono font-bold text-sky-400'>
                        {scannedOutCount} / {targetQuantity} {unit} (OUT)
                      </span>
                    </div>
                    <Progress value={(scannedOutCount / targetQuantity) * 100} className='h-2 bg-slate-800' />
                  </div>

                  {scannedOutCount < targetQuantity ? (
                    <Button
                      onClick={handleScanDepot}
                      disabled={isScanning}
                      className='w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2'
                    >
                      <Scan className='size-4 animate-spin' />
                      {isScanning ? 'Scan RFID en cours...' : `2. Scanner ${targetQuantity} ${unit} (OUT)`}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleValidateDepot}
                      className='w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2'
                    >
                      <CheckCircle2 className='size-4' />
                      3. Valider le chargement (COMPLETED)
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DEPART DU CONVOI */}
          {isDepotCompleted && !isTourStarted && (
            <div className='rounded-2xl border border-blue-500/40 bg-blue-950/20 p-4 space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='flex size-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs'>
                  ✓
                </span>
                <div>
                  <h4 className='text-sm font-bold text-white'>Chargement Dépôt Validé</h4>
                  <p className='text-xs text-emerald-400'>50 {unit} chargées et scellées dans le camion</p>
                </div>
              </div>

              <p className='text-xs text-slate-300'>
                Le convoi est prêt. Lancez la tournée pour activer le suivi télémétrique GPS sur le corridor RN3.
              </p>

              <Button
                onClick={handleStartTour}
                className='w-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2'
              >
                <Truck className='size-4' />
                Démarrer la Tournée (Départ → INPROGRESS)
              </Button>
            </div>
          )}

          {/* STEP 3: LIVRAISONS CLIENTS */}
          {isTourStarted && !allClientsCompleted && activeClientCp && (
            <div className='rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-4 space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='flex size-6 items-center justify-center rounded-full bg-indigo-500 text-white font-bold text-xs'>
                    {activeClientIndex + 2}
                  </span>
                  <div>
                    <h4 className='text-sm font-bold text-white'>
                      Livraison : {trip.stops[activeClientIndex + 1]?.site.name || 'Site Client'}
                    </h4>
                    <p className='text-xs text-indigo-300'>
                      Arrêt {activeClientIndex + 1} / {clientCheckpoints.length}
                    </p>
                  </div>
                </div>
                <Badge className={activeClientCp.status === 'REACHED' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700'}>
                  {activeClientCp.status}
                </Badge>
              </div>

              {activeClientCp.status !== 'REACHED' ? (
                <div className='space-y-2 pt-2'>
                  <p className='text-xs text-slate-300'>
                    Arrivée chez le client. Activez la géolocalisation pour valider la présence sur site.
                  </p>
                  <Button
                    onClick={() => handleReachClient(activeClientCp.id)}
                    className='w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2'
                  >
                    <MapPin className='size-4' />
                    Arrivée chez le Client (REACHED)
                  </Button>
                </div>
              ) : (
                <div className='space-y-3 pt-2'>
                  <div className='rounded-xl bg-slate-900/80 p-3 border border-slate-800 space-y-2 text-xs'>
                    <div className='flex justify-between items-center'>
                      <span className='text-slate-300'>Bouteilles livrées (OUT) :</span>
                      <span className='font-mono font-bold text-emerald-400'>{scannedOutCount} {unit}</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-slate-300'>Consignes reprises (IN) :</span>
                      <span className='font-mono font-bold text-sky-400'>{scannedInCount} {unit}</span>
                    </div>
                  </div>

                  {scannedOutCount === 0 ? (
                    <Button
                      onClick={handleScanClient}
                      disabled={isScanning}
                      className='w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2'
                    >
                      <Scan className='size-4' />
                      Scanner 50 Livrées (OUT) & 45 Reprises (IN)
                    </Button>
                  ) : (
                    <div className='space-y-2'>
                      <div className='rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-2.5 text-xs space-y-1.5'>
                        <div className='flex items-center gap-1.5 text-emerald-400 font-semibold'>
                          <FileCheck className='size-3.5' /> BL signé & Emargement client
                        </div>
                        <p className='text-[11px] text-slate-400'>
                          Preuve électronique : <span className='font-mono text-sky-300'>BL-{trip.reference}-S{activeClientIndex + 2}.pdf</span>
                        </p>
                      </div>

                      <Button
                        onClick={() => handleValidateClient(activeClientCp.id)}
                        className='w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2'
                      >
                        <CheckCircle2 className='size-4' />
                        Valider la livraison client (COMPLETED)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: DERNIER POINT & CLOTURE */}
          {allClientsCompleted && !isTourClosed && (
            <div className='rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='flex size-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs'>
                  ✓
                </span>
                <div>
                  <h4 className='text-sm font-bold text-white'>Tous les arrêts sont complétés !</h4>
                  <p className='text-xs text-emerald-400'>Dépôt + {clientCheckpoints.length} livraison(s) validée(s)</p>
                </div>
              </div>

              <p className='text-xs text-slate-300'>
                Clôturez la tournée pour consolider les événements de livraison et générer le dossier de rapprochement.
              </p>

              <Button
                onClick={handleCloseTour}
                disabled={isClosingTour}
                className='w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2'
              >
                <ShieldCheck className='size-4' />
                {isClosingTour ? 'Clôture en cours...' : 'Terminer la Tournée (POST /close → CLOSED)'}
              </Button>
            </div>
          )}

          {/* STEP 5: TOURNEE CLOTUREE & LIEN RAPPROCHEMENT */}
          {isTourClosed && (
            <div className='rounded-2xl border border-emerald-500 bg-emerald-950/40 p-4 space-y-3 text-center'>
              <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400'>
                <CheckCircle2 className='size-7' />
              </div>
              <div>
                <h4 className='text-base font-bold text-white'>Tournée Clôturée avec Succès !</h4>
                <p className='text-xs text-emerald-300 mt-1'>
                  Données consolidées : 50 unités livrées, 45 consignes réintégrées.
                </p>
              </div>

              <div className='rounded-xl bg-slate-900/90 p-3 text-xs border border-slate-800 text-left space-y-1 font-mono'>
                <div className='flex justify-between text-slate-400'>
                  <span>Volume suivi (livré) :</span>
                  <span className='text-white font-bold'>50 btl</span>
                </div>
                <div className='flex justify-between text-slate-400'>
                  <span>Consignes reprises :</span>
                  <span className='text-sky-400 font-bold'>45 btl</span>
                </div>
                <div className='flex justify-between text-slate-400'>
                  <span>Taux de retour :</span>
                  <span className='text-emerald-400 font-bold'>90.0%</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  onOpenChange(false)
                  navigate({ to: '/reconciliations' })
                }}
                className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg'
              >
                <FileText className='size-4' />
                Voir le Rapprochement Mensuel (/reconciliations)
                <ArrowRight className='size-4' />
              </Button>
            </div>
          )}
        </div>

        {/* PDA Footer */}
        <div className='p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400'>
          <span>Terminal ID : <span className='font-mono text-slate-200'>PDA-HONEYWELL-04</span></span>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onOpenChange(false)}
            className='text-slate-400 hover:text-white h-7 text-xs'
          >
            Fermer le simulateur
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
