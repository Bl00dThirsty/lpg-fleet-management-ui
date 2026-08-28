/**
 * Field option lists — derived from the canonical `@lpg/types` schema enums.
 *
 * Each `*Options` constant is generated from a schema enum so a new enum
 * value added to the schema automatically appears as an option for badges
 * and faceted filters. No translation/label is hardcoded twice.
 */

import {
  SiteStatus,
  TourneeStatus,
  PickupStatus,
  DeclarationStatus,
  ReconciliationStatus,
  RedressementStatus,
  RiskLevel,
  VehicleType,
  OrgType,
  DeviceType,
  DeviceStatus,
  CheckpointStatus,
  ScanDirection,
  AnomalyStatus,
  AnomalyCategory,
} from '@lpg/types'

export interface OptionDef<T extends string = string> {
  label: string
  value: T
}

const SITE: Record<SiteStatus, string> = {
  UNASSIGNED: 'Non assigné',
  ASSIGNED: 'Assigné',
  ACTIVE: 'Actif',
  VERIFIED: 'Vérifié',
  SUSPENDED: 'Suspendu',
  REJECTED: 'Rejeté',
}

const TOUR: Record<TourneeStatus, string> = {
  DRAFT: 'Brouillon',
  PLANNED: 'Planifiée',
  PENDINGTRANSPORTERACK: 'En attente d\'accusé',
  ACKNOWLEDGED: 'Accusée',
  INPROGRESS: 'En cours',
  CHECKPOINTACTIVE: 'Checkpoint actif',
  CLOSED: 'Clôturée',
  CANCELLED: 'Annulée',
}

const PICKUP: Record<PickupStatus, string> = {
  DRAFT: 'Brouillon',
  VALIDATED: 'Validée',
  INPROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
}

const DECLARATION: Record<DeclarationStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  RECONCILED: 'Réconciliée',
  DISPUTED: 'Contestée',
}

const RECON: Record<ReconciliationStatus, string> = {
  PENDING: 'En attente',
  VERIFIED: 'Vérifiée',
  REDRESSEMENTAPPLIED: 'Redressement appliqué',
}

const REDRESS: Record<RedressementStatus, string> = {
  ISSUED: 'Émise',
  PAID: 'Payée',
  WAIVED: 'Annulée',
}

const RISK: Record<RiskLevel, string> = {
  FAIBLE: 'Faible',
  MODERE: 'Modéré',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique',
  CRITIQUEEXTREME: 'Critique extrême',
}

const VEHICLE: Record<VehicleType, string> = {
  VRAC: 'VRAC',
  BOUTEILLES50KG: 'Bouteilles 50 kg',
}

const ORG: Record<OrgType, string> = {
  REGULATEUR: 'Régulateur',
  DEPOT: 'Dépôt',
  MARKETEUR: 'Marketeur',
  TRANSPORTEUR: 'Transporteur',
  CLIENT: 'Client',
}

const DEVICE: Record<DeviceType, string> = {
  GPS: 'GPS',
  PDA: 'PDA',
  RFIDREADER: 'RFID Reader',
}

const DEVICE_STATUS: Record<DeviceStatus, string> = {
  UNASSIGNED: 'Non assigné',
  ASSIGNED: 'Assigné',
  INMISSION: 'En mission',
  OFFLINE: 'Hors-ligne',
  PENDINGSYNC: 'Sync en attente',
  SYNCING: 'Synchronisation',
  SYNCED: 'Synchronisé',
  SYNCFAILED: 'Échec sync',
  MAINTENANCE: 'Maintenance',
  DEPLOYED: 'Déployé',
  REMOVED: 'Retiré',
  LOST: 'Perdu',
}

const CHECK: Record<CheckpointStatus, string> = {
  PENDING: 'En attente',
  REACHED: 'Atteint',
  COMPLETED: 'Complété',
  SKIPPED: 'Sauté',
}

const SCAN: Record<ScanDirection, string> = {
  IN: 'Entrée',
  OUT: 'Sortie',
}

const ANOMALY: Record<AnomalyStatus, string> = {
  NOUVEAU: 'Nouveau',
  ENCOURS: 'En cours',
  RESOLU: 'Résolu',
  FERME: 'Fermé',
}

const ANOMALY_CAT: Record<AnomalyCategory, string> = {
  INVESTIGATION: 'Investigation',
  TECHNICAL: 'Technique',
}

const GENRES: Record<'active' | 'inactive' | 'pending' | 'on_tour' | 'maintenance', string> = {
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente',
  on_tour: 'En tournée',
  maintenance: 'Maintenance',
}

const BOOL: Record<'true' | 'false', string> = {
  true: 'Oui',
  false: 'Non',
}

const SYNC_STATUS: Record<'synced' | 'pending' | 'offline' | 'maintenance', string> = {
  synced: 'Synchronisé',
  pending: 'En attente',
  offline: 'Hors-ligne',
  maintenance: 'Maintenance',
}

function build<T extends string>(map: Record<T, string>): readonly OptionDef<T>[] {
  return (Object.entries(map) as [T, string][]).map(([value, label]) => ({ label, value }))
}

export const siteStatusOptions = build(SITE)
export const tourneeStatusOptions = build(TOUR)
export const pickupStatusOptions = build(PICKUP)
export const declarationStatusOptions = build(DECLARATION)
export const shipmentStatusOptions = build(PICKUP) // pickups ARE the shipment ops in this domain
export const reconciliationStatusOptions = build(RECON)
export const redressementStatusOptions = build(REDRESS)
export const riskLevelOptions = build(RISK)
export const violationStatusOptions = build(RISK) // anomaly severity is risk level
export const vehicleTypeOptions = build(VEHICLE)
export const orgTypeOptions = build(ORG)
export const deviceTypeOptions = build(DEVICE)
export const deviceStatusOptions = build(DEVICE_STATUS)
export const checkStatusOptions = build(CHECK)
export const scanDirectionOptions = build(SCAN)
export const anomalyStatusOptions = build(ANOMALY)
export const anomalyCategoryOptions = build(ANOMALY_CAT)
export const truckStatusOptions = [
  { label: 'Disponible', value: 'AVAILABLE' },
  { label: 'En livraison', value: 'IN_TRANSIT' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Inactif', value: 'INACTIVE' },
]
export const genericStatusOptions = build(GENRES)
export const booleanOptions: readonly OptionDef<'true' | 'false'>[] = build(BOOL)
export const syncStatusOptions = build(SYNC_STATUS)