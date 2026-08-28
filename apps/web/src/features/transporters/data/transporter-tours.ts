import { curated } from '@lpg/mock-data'
import type { DeliveryTour, TransporterContract, Organization, Vehicle, Driver, Checkpoint, Site, ClientSite } from '@lpg/types'
import { format } from 'date-fns'
import { useContractsStore } from '@/store/contracts-store'
import { deriveContractStatus } from '@/features/transporter-contracts/lib/contract-status'

export type TourStatus = DeliveryTour['status']

export interface TransporterTourWithDetails extends DeliveryTour {
  marketeur?: Organization
  transporter?: Organization
  vehicle?: Vehicle
  driver?: Driver
  contract?: TransporterContract
  checkpoints?: (Checkpoint & { site?: Site; client_site?: ClientSite })[]
  progress: number
  statusLabel: string
}

function tourStatusLabel(status: DeliveryTour['status']): string {
  switch (status) {
    case 'DRAFT':
      return 'Brouillon'
    case 'PLANNED':
      return 'Planifié'
    case 'PENDINGTRANSPORTERACK':
      return 'En attente transporteur'
    case 'ACKNOWLEDGED':
      return 'Reconnu'
    case 'INPROGRESS':
      return 'En transit'
    case 'CHECKPOINTACTIVE':
      return 'En livraison'
    case 'CLOSED':
      return 'Livré'
    case 'CANCELLED':
      return 'Annulé'
    default:
      return status
  }
}

function tourProgress(status: DeliveryTour['status']): number {
  switch (status) {
    case 'DRAFT':
      return 0
    case 'PLANNED':
      return 10
    case 'PENDINGTRANSPORTERACK':
      return 20
    case 'ACKNOWLEDGED':
      return 30
    case 'INPROGRESS':
      return 50
    case 'CHECKPOINTACTIVE':
      return 80
    case 'CLOSED':
      return 100
    case 'CANCELLED':
      return 0
    default:
      return 0
  }
}

function buildTransporterTourWithDetails(tour: DeliveryTour): TransporterTourWithDetails {
  const contracts = useContractsStore.getState().all()
  const marketeur = curated.organizations.find((o) => o.id === tour.marketeur_org_id)
  const transporter = tour.transporter_org_id
    ? curated.organizations.find((o) => o.id === tour.transporter_org_id)
    : undefined
  const vehicle = tour.vehicle_id
    ? curated.vehicles.find((v) => v.id === tour.vehicle_id)
    : undefined
  const driver = tour.driver_id
    ? curated.drivers.find((d) => d.id === tour.driver_id)
    : undefined
  const contract = tour.transporter_org_id
    ? contracts.find(
        (c) =>
          c.marketeur_org_id === tour.marketeur_org_id &&
          c.transporter_org_id === tour.transporter_org_id &&
          deriveContractStatus(c) === 'ACTIVE',
      )
    : undefined

  const tourCheckpoints = curated.checkpoints
    .filter((cp) => cp.tournee_id === tour.id)
    .sort((a, b) => a.sequence - b.sequence)
    .map((checkpoint) => {
      const site = checkpoint.site_id ? curated.sites.find((s) => s.id === checkpoint.site_id) : undefined
      const client_site = checkpoint.client_site_id
        ? curated.client_sites.find((cs) => cs.id === checkpoint.client_site_id)
        : undefined
      return { ...checkpoint, site, client_site }
    })

  return {
    ...tour,
    marketeur,
    transporter,
    vehicle,
    driver,
    contract,
    checkpoints: tourCheckpoints,
    progress: tourProgress(tour.status),
    statusLabel: tourStatusLabel(tour.status),
  }
}

export function getToursForTransporter(transporterOrgId: string): TransporterTourWithDetails[] {
  return curated.delivery_tours
    .filter((t) => t.transporter_org_id === transporterOrgId)
    .map(buildTransporterTourWithDetails)
}

export function getToursForMarketer(marketerOrgId: string): TransporterTourWithDetails[] {
  return curated.delivery_tours
    .filter((t) => t.marketeur_org_id === marketerOrgId)
    .map(buildTransporterTourWithDetails)
}

export function getAllTransporterTours(): TransporterTourWithDetails[] {
  return curated.delivery_tours
    .filter((t) => t.transporter_org_id != null)
    .map(buildTransporterTourWithDetails)
}

export function getTransporterTourById(id: string): TransporterTourWithDetails | undefined {
  const tour = curated.delivery_tours.find((t) => t.id === id)
  return tour ? buildTransporterTourWithDetails(tour) : undefined
}

// Helper functions for display
export function getTourEta(tour: DeliveryTour): string {
  if (tour.started_at) {
    const start = new Date(tour.started_at)
    const eta = new Date(start.getTime() + 4 * 3600 * 1000)
    return format(eta, 'HH:mm')
  }
  return '—'
}

export function getTourCargo(tour: DeliveryTour): string {
  return tour.type === 'VRAC' ? 'GPL vrac' : 'Bouteilles 50 kg'
}

export function getTourVolume(tour: DeliveryTour): string {
  return `${tour.requested_quantity} ${tour.type === 'VRAC' ? 'TM' : 'btl'}`
}

export function getExecutionModeLabel(mode: DeliveryTour['execution_mode']): string {
  return mode === 'INTERNAL' ? 'Interne' : 'Externe'
}
