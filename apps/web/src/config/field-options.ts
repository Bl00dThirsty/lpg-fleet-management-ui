/**
 * Field option lists — derived from the canonical `@lpg/types` schema enums.
 *
 * Each `*Options` constant is generated from a schema enum so a new enum
 * value added to the schema automatically appears as an option for badges
 * and faceted filters.
 *
 * i18n: use `get*Options(t)` with `t` from `useTranslation('fields')` for
 * translated labels. Deprecated `*Options` constants remain as fallback via
 * the i18n singleton (French by default) for non-hook contexts.
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
import i18n from '@/lib/i18n'

export interface OptionDef<T extends string = string> {
  label: string
  value: T
}

export type TranslateFn = (key: string) => string

function build<T extends string>(map: Record<T, string>): readonly OptionDef<T>[] {
  return (Object.entries(map) as [T, string][]).map(([value, label]) => ({ label, value }))
}

function fallbackT(key: string): string {
  try {
    const v = (i18n as unknown as { t: TranslateFn }).t(key)
    return v !== key ? v : key
  } catch {
    return key
  }
}

// ---------------------------------------------------------------------------
// Translated getters — preferred API
// ---------------------------------------------------------------------------

export function getSiteStatusOptions(t: TranslateFn): readonly OptionDef<SiteStatus>[] {
  return build<SiteStatus>({
    UNASSIGNED: t('fields:site.UNASSIGNED'),
    ASSIGNED: t('fields:site.ASSIGNED'),
    ACTIVE: t('fields:site.ACTIVE'),
    VERIFIED: t('fields:site.VERIFIED'),
    SUSPENDED: t('fields:site.SUSPENDED'),
    REJECTED: t('fields:site.REJECTED'),
  })
}

export function getTourneeStatusOptions(t: TranslateFn): readonly OptionDef<TourneeStatus>[] {
  return build<TourneeStatus>({
    DRAFT: t('fields:tour.DRAFT'),
    PLANNED: t('fields:tour.PLANNED'),
    PENDINGTRANSPORTERACK: t('fields:tour.PENDINGTRANSPORTERACK'),
    ACKNOWLEDGED: t('fields:tour.ACKNOWLEDGED'),
    INPROGRESS: t('fields:tour.INPROGRESS'),
    CHECKPOINTACTIVE: t('fields:tour.CHECKPOINTACTIVE'),
    CLOSED: t('fields:tour.CLOSED'),
    CANCELLED: t('fields:tour.CANCELLED'),
  })
}

export function getPickupStatusOptions(t: TranslateFn): readonly OptionDef<PickupStatus>[] {
  return build<PickupStatus>({
    DRAFT: t('fields:pickup.DRAFT'),
    VALIDATED: t('fields:pickup.VALIDATED'),
    INPROGRESS: t('fields:pickup.INPROGRESS'),
    COMPLETED: t('fields:pickup.COMPLETED'),
    CANCELLED: t('fields:pickup.CANCELLED'),
  })
}

export function getDeclarationStatusOptions(t: TranslateFn): readonly OptionDef<DeclarationStatus>[] {
  return build<DeclarationStatus>({
    DRAFT: t('fields:declaration.DRAFT'),
    SUBMITTED: t('fields:declaration.SUBMITTED'),
    RECONCILED: t('fields:declaration.RECONCILED'),
    DISPUTED: t('fields:declaration.DISPUTED'),
  })
}

export function getReconciliationStatusOptions(t: TranslateFn): readonly OptionDef<ReconciliationStatus>[] {
  return build<ReconciliationStatus>({
    PENDING: t('fields:reconciliation.PENDING'),
    VERIFIED: t('fields:reconciliation.VERIFIED'),
    REDRESSEMENTAPPLIED: t('fields:reconciliation.REDRESSEMENTAPPLIED'),
  })
}

export function getRedressementStatusOptions(t: TranslateFn): readonly OptionDef<RedressementStatus>[] {
  return build<RedressementStatus>({
    ISSUED: t('fields:redressement.ISSUED'),
    PAID: t('fields:redressement.PAID'),
    WAIVED: t('fields:redressement.WAIVED'),
  })
}

export function getRiskLevelOptions(t: TranslateFn): readonly OptionDef<RiskLevel>[] {
  return build<RiskLevel>({
    FAIBLE: t('fields:risk.FAIBLE'),
    MODERE: t('fields:risk.MODERE'),
    ELEVE: t('fields:risk.ELEVE'),
    CRITIQUE: t('fields:risk.CRITIQUE'),
    CRITIQUEEXTREME: t('fields:risk.CRITIQUEEXTREME'),
  })
}

export function getVehicleTypeOptions(t: TranslateFn): readonly OptionDef<VehicleType>[] {
  return build<VehicleType>({
    VRAC: t('fields:vehicle.VRAC'),
    BOUTEILLES50KG: t('fields:vehicle.BOUTEILLES50KG'),
  })
}

export function getOrgTypeOptions(t: TranslateFn): readonly OptionDef<OrgType>[] {
  return build<OrgType>({
    REGULATEUR: t('fields:org.REGULATEUR'),
    DEPOT: t('fields:org.DEPOT'),
    MARKETEUR: t('fields:org.MARKETEUR'),
    TRANSPORTEUR: t('fields:org.TRANSPORTEUR'),
    CLIENT: t('fields:org.CLIENT'),
  })
}

export function getDeviceTypeOptions(t: TranslateFn): readonly OptionDef<DeviceType>[] {
  return build<DeviceType>({
    GPS: t('fields:device.GPS'),
    PDA: t('fields:device.PDA'),
    RFIDREADER: t('fields:device.RFIDREADER'),
  })
}

export function getDeviceStatusOptions(t: TranslateFn): readonly OptionDef<DeviceStatus>[] {
  return build<DeviceStatus>({
    UNASSIGNED: t('fields:deviceStatus.UNASSIGNED'),
    ASSIGNED: t('fields:deviceStatus.ASSIGNED'),
    INMISSION: t('fields:deviceStatus.INMISSION'),
    OFFLINE: t('fields:deviceStatus.OFFLINE'),
    PENDINGSYNC: t('fields:deviceStatus.PENDINGSYNC'),
    SYNCING: t('fields:deviceStatus.SYNCING'),
    SYNCED: t('fields:deviceStatus.SYNCED'),
    SYNCFAILED: t('fields:deviceStatus.SYNCFAILED'),
    MAINTENANCE: t('fields:deviceStatus.MAINTENANCE'),
    DEPLOYED: t('fields:deviceStatus.DEPLOYED'),
    REMOVED: t('fields:deviceStatus.REMOVED'),
    LOST: t('fields:deviceStatus.LOST'),
  })
}

export function getCheckpointStatusOptions(t: TranslateFn): readonly OptionDef<CheckpointStatus>[] {
  return build<CheckpointStatus>({
    PENDING: t('fields:checkpoint.PENDING'),
    REACHED: t('fields:checkpoint.REACHED'),
    COMPLETED: t('fields:checkpoint.COMPLETED'),
    SKIPPED: t('fields:checkpoint.SKIPPED'),
  })
}

export function getScanDirectionOptions(t: TranslateFn): readonly OptionDef<ScanDirection>[] {
  return build<ScanDirection>({
    IN: t('fields:scan.IN'),
    OUT: t('fields:scan.OUT'),
  })
}

export function getAnomalyStatusOptions(t: TranslateFn): readonly OptionDef<AnomalyStatus>[] {
  return build<AnomalyStatus>({
    NOUVEAU: t('fields:anomaly.NOUVEAU'),
    ENCOURS: t('fields:anomaly.ENCOURS'),
    RESOLU: t('fields:anomaly.RESOLU'),
    FERME: t('fields:anomaly.FERME'),
  })
}

export function getAnomalyCategoryOptions(t: TranslateFn): readonly OptionDef<AnomalyCategory>[] {
  return build<AnomalyCategory>({
    INVESTIGATION: t('fields:anomalyCategory.INVESTIGATION'),
    TECHNICAL: t('fields:anomalyCategory.TECHNICAL'),
  })
}

export function getGenericStatusOptions(t: TranslateFn): readonly OptionDef<'active' | 'inactive' | 'pending' | 'on_tour' | 'maintenance'>[] {
  return build<'active' | 'inactive' | 'pending' | 'on_tour' | 'maintenance'>({
    active: t('fields:generic.active'),
    inactive: t('fields:generic.inactive'),
    pending: t('fields:generic.pending'),
    on_tour: t('fields:generic.on_tour'),
    maintenance: t('fields:generic.maintenance'),
  })
}

export function getBooleanOptions(t: TranslateFn): readonly OptionDef<'true' | 'false'>[] {
  return build<'true' | 'false'>({
    true: t('fields:boolean.true'),
    false: t('fields:boolean.false'),
  })
}

export function getSyncStatusOptions(t: TranslateFn): readonly OptionDef<'synced' | 'pending' | 'offline' | 'maintenance'>[] {
  return build<'synced' | 'pending' | 'offline' | 'maintenance'>({
    synced: t('fields:syncStatus.synced'),
    pending: t('fields:syncStatus.pending'),
    offline: t('fields:syncStatus.offline'),
    maintenance: t('fields:syncStatus.maintenance'),
  })
}

export function getTruckStatusOptions(t: TranslateFn): readonly OptionDef<'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'INACTIVE'>[] {
  return [
    { label: t('fields:truck.AVAILABLE'), value: 'AVAILABLE' },
    { label: t('fields:truck.IN_TRANSIT'), value: 'IN_TRANSIT' },
    { label: t('fields:truck.MAINTENANCE'), value: 'MAINTENANCE' },
    { label: t('fields:truck.INACTIVE'), value: 'INACTIVE' },
  ]
}

// ---------------------------------------------------------------------------
// Deprecated constant wrappers — keep for backward compat during rollout
// ---------------------------------------------------------------------------

/** @deprecated use getSiteStatusOptions(t) */
export const siteStatusOptions: readonly OptionDef<SiteStatus>[] = getSiteStatusOptions(fallbackT)
/** @deprecated use getTourneeStatusOptions(t) */
export const tourneeStatusOptions: readonly OptionDef<TourneeStatus>[] = getTourneeStatusOptions(fallbackT)
/** @deprecated use getPickupStatusOptions(t) */
export const pickupStatusOptions: readonly OptionDef<PickupStatus>[] = getPickupStatusOptions(fallbackT)
/** @deprecated use getPickupStatusOptions(t) — pickups ARE shipment ops */
export const shipmentStatusOptions: readonly OptionDef<PickupStatus>[] = getPickupStatusOptions(fallbackT)
/** @deprecated use getDeclarationStatusOptions(t) */
export const declarationStatusOptions: readonly OptionDef<DeclarationStatus>[] = getDeclarationStatusOptions(fallbackT)
/** @deprecated use getReconciliationStatusOptions(t) */
export const reconciliationStatusOptions: readonly OptionDef<ReconciliationStatus>[] = getReconciliationStatusOptions(fallbackT)
/** @deprecated use getRedressementStatusOptions(t) */
export const redressementStatusOptions: readonly OptionDef<RedressementStatus>[] = getRedressementStatusOptions(fallbackT)
/** @deprecated use getRiskLevelOptions(t) */
export const riskLevelOptions: readonly OptionDef<RiskLevel>[] = getRiskLevelOptions(fallbackT)
/** @deprecated use getRiskLevelOptions(t) */
export const violationStatusOptions: readonly OptionDef<RiskLevel>[] = getRiskLevelOptions(fallbackT)
/** @deprecated use getVehicleTypeOptions(t) */
export const vehicleTypeOptions: readonly OptionDef<VehicleType>[] = getVehicleTypeOptions(fallbackT)
/** @deprecated use getOrgTypeOptions(t) */
export const orgTypeOptions: readonly OptionDef<OrgType>[] = getOrgTypeOptions(fallbackT)
/** @deprecated use getDeviceTypeOptions(t) */
export const deviceTypeOptions: readonly OptionDef<DeviceType>[] = getDeviceTypeOptions(fallbackT)
/** @deprecated use getDeviceStatusOptions(t) */
export const deviceStatusOptions: readonly OptionDef<DeviceStatus>[] = getDeviceStatusOptions(fallbackT)
/** @deprecated use getCheckpointStatusOptions(t) */
export const checkStatusOptions: readonly OptionDef<CheckpointStatus>[] = getCheckpointStatusOptions(fallbackT)
/** @deprecated use getScanDirectionOptions(t) */
export const scanDirectionOptions: readonly OptionDef<ScanDirection>[] = getScanDirectionOptions(fallbackT)
/** @deprecated use getAnomalyStatusOptions(t) */
export const anomalyStatusOptions: readonly OptionDef<AnomalyStatus>[] = getAnomalyStatusOptions(fallbackT)
/** @deprecated use getAnomalyCategoryOptions(t) */
export const anomalyCategoryOptions: readonly OptionDef<AnomalyCategory>[] = getAnomalyCategoryOptions(fallbackT)
/** @deprecated use getTruckStatusOptions(t) */
export const truckStatusOptions: readonly OptionDef<'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'INACTIVE'>[] = getTruckStatusOptions(fallbackT)
/** @deprecated use getGenericStatusOptions(t) */
export const genericStatusOptions: readonly OptionDef<'active' | 'inactive' | 'pending' | 'on_tour' | 'maintenance'>[] = getGenericStatusOptions(fallbackT)
/** @deprecated use getBooleanOptions(t) */
export const booleanOptions: readonly OptionDef<'true' | 'false'>[] = getBooleanOptions(fallbackT)
/** @deprecated use getSyncStatusOptions(t) */
export const syncStatusOptions: readonly OptionDef<'synced' | 'pending' | 'offline' | 'maintenance'>[] = getSyncStatusOptions(fallbackT)
