/**
 * Live entity collections — pre-hydration state.
 *
 * Every collection below is EMPTY, and must stay that way. This module is the
 * single import seam replacing `@lpg/mock-data` (deleted): feature `data/`
 * files import row arrays from here and build their views over them, rendering
 * "no data" until the feature's store hydrates live rows over the wire via
 * `@lpg/api-client` (`api.*.list()`).
 *
 * This is NOT a fixture module. There are no seed rows, no curated JSON, no
 * helper that invents entities. If a feature needs rows, it fetches them from
 * the Spring backend — it never adds them here.
 *
 * Settings accessors read the (currently empty) settings collection and return
 * null when unprovisioned; every caller falls back to an explicit constant.
 * Live settings arrive through `api.settings` once wired.
 */

import type {
  Anomaly,
  AnomalyAssignment,
  AuditLog,
  Checkpoint,
  Client,
  ClientSite,
  CustomRole,
  Declaration,
  DeliveryTour as DeliveryTourEntity,
  Device,
  Driver,
  IntegrationAuth,
  Notification,
  NotificationGroup,
  NotificationGroupMember,
  NotificationRule,
  Organization,
  Permission,
  PickupRequest,
  Reconciliation,
  Redressement,
  Report,
  RfidTag,
  RiskScore,
  ScanEvent,
  Setting,
  Site,
  SystemRole,
  TransporterContract,
  UserCustomRole,
  UserMfa,
  Vehicle,
  AppUser,
  RegionEntity as RegionEntityRow,
} from '@lpg/types'

export type {
  Anomaly,
  AnomalyAssignment,
  AuditLog,
  Checkpoint,
  Client,
  ClientSite,
  CustomRole,
  Declaration,
  DeliveryTourEntity,
  Device,
  Driver,
  IntegrationAuth,
  Notification,
  NotificationGroup,
  NotificationGroupMember,
  NotificationRule,
  Organization,
  Permission,
  PickupRequest,
  Reconciliation,
  Redressement,
  Report,
  RfidTag,
  RiskScore,
  ScanEvent,
  Setting,
  Site,
  SystemRole,
  TransporterContract,
  UserCustomRole,
  UserMfa,
  Vehicle,
  AppUser,
  RegionEntityRow,
}

export interface EntityCollections {
  organizations: Organization[]
  users: AppUser[]
  sites: Site[]
  clients: Client[]
  client_sites: ClientSite[]
  vehicles: Vehicle[]
  drivers: Driver[]
  devices: Device[]
  transporter_contracts: TransporterContract[]
  pickup_requests: PickupRequest[]
  delivery_tours: DeliveryTourEntity[]
  checkpoints: Checkpoint[]
  scan_events: ScanEvent[]
  declarations: Declaration[]
  reconciliations: Reconciliation[]
  redressements: Redressement[]
  risk_scores: RiskScore[]
  anomalies: Anomaly[]
  anomaly_assignments: AnomalyAssignment[]
  notification_groups: NotificationGroup[]
  notification_group_members: NotificationGroupMember[]
  notification_rules: NotificationRule[]
  notifications: Notification[]
  user_mfa: UserMfa[]
  integration_auth: IntegrationAuth[]
  system_roles: SystemRole[]
  permissions: Permission[]
  regions: RegionEntityRow[]
  settings: Setting[]
  reports: Report[]
  audit_logs: AuditLog[]
  rfid_tags: RfidTag[]
  custom_roles: CustomRole[]
  user_custom_roles: UserCustomRole[]
}

/** Pre-hydration state: no rows until a store fetches them. Never seed this. */
export const curated: EntityCollections = {
  organizations: [],
  users: [],
  sites: [],
  clients: [],
  client_sites: [],
  vehicles: [],
  drivers: [],
  devices: [],
  transporter_contracts: [],
  pickup_requests: [],
  delivery_tours: [],
  checkpoints: [],
  scan_events: [],
  declarations: [],
  reconciliations: [],
  redressements: [],
  risk_scores: [],
  anomalies: [],
  anomaly_assignments: [],
  notification_groups: [],
  notification_group_members: [],
  notification_rules: [],
  notifications: [],
  user_mfa: [],
  integration_auth: [],
  system_roles: [],
  permissions: [],
  regions: [],
  settings: [],
  reports: [],
  audit_logs: [],
  rfid_tags: [],
  custom_roles: [],
  user_custom_roles: [],
}

export const organizations: Organization[] = curated.organizations
export const users: AppUser[] = curated.users
export const sites: Site[] = curated.sites
export const clients: Client[] = curated.clients
export const client_sites: ClientSite[] = curated.client_sites
export const vehicles: Vehicle[] = curated.vehicles
export const drivers: Driver[] = curated.drivers
export const devices: Device[] = curated.devices
export const transporter_contracts: TransporterContract[] = curated.transporter_contracts
export const pickup_requests: PickupRequest[] = curated.pickup_requests
export const delivery_tours: DeliveryTourEntity[] = curated.delivery_tours
export const checkpoints: Checkpoint[] = curated.checkpoints
export const scan_events: ScanEvent[] = curated.scan_events
export const declarations: Declaration[] = curated.declarations
export const reconciliations: Reconciliation[] = curated.reconciliations
export const redressements: Redressement[] = curated.redressements
export const risk_scores: RiskScore[] = curated.risk_scores
export const anomalies: Anomaly[] = curated.anomalies
export const anomaly_assignments: AnomalyAssignment[] = curated.anomaly_assignments
export const notification_groups: NotificationGroup[] = curated.notification_groups
export const notification_group_members: NotificationGroupMember[] =
  curated.notification_group_members
export const notification_rules: NotificationRule[] = curated.notification_rules
export const notifications: Notification[] = curated.notifications
export const user_mfa: UserMfa[] = curated.user_mfa
export const integration_auth: IntegrationAuth[] = curated.integration_auth
export const system_roles: SystemRole[] = curated.system_roles
export const permissions: Permission[] = curated.permissions
export const regions: RegionEntityRow[] = curated.regions
export const settings: Setting[] = curated.settings
export const reports: Report[] = curated.reports
export const audit_logs: AuditLog[] = curated.audit_logs
export const rfid_tags: RfidTag[] = curated.rfid_tags
export const custom_roles: CustomRole[] = curated.custom_roles
export const user_custom_roles: UserCustomRole[] = curated.user_custom_roles

/**
 * Settings accessors. Null until `api.settings` is wired — callers must carry
 * an explicit fallback (AGENTS.md: zero hardcoded thresholds means the *key*
 * is referenced, not that a value is invented).
 */
export function getSetting(key: string): string | null {
  const setting = curated.settings.find((s) => s.setting_key === key)
  const value = setting?.setting_value
  return typeof value === 'string' ? value : value === undefined || value === null ? null : String(value)
}

export function getSettingNumber(key: string): number | null {
  const raw = getSetting(key)
  if (raw === null || raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}
