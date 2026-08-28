/**
 * Curated CSPH GPL traceability fixtures (imported from Downloads/json_fixture).
 *
 * These mirror the production Postgres schema and are the live data source the
 * analytics selectors derive KPIs from. Field names intentionally keep the
 * snake_case of the source so the mapping to the API layer stays 1:1.
 */

import organizationsJson from './seed/curated/01_organizations.json'
import usersAndRolesJson from './seed/curated/02_users_and_roles.json'
import sitesJson from './seed/curated/03_sites_and_client_sites.json'
import vehiclesJson from './seed/curated/04_vehicles_and_drivers.json'
import devicesJson from './seed/curated/05_devices.json'
import deliveryToursJson from './seed/curated/06_delivery_tours.json'
import complianceJson from './seed/curated/07_compliance.json'
import anomaliesJson from './seed/curated/08_anomalies.json'
import notificationsJson from './seed/curated/09_notifications.json'
import systemConfigJson from './seed/curated/10_system_config.json'
import type {
  Role,
  OrgType,
  Region as RegionEnum,
  SiteFunction,
  SiteStatus,
  VehicleType,
  TourneeType,
  TourneeStatus,
  PickupStatus,
  DeclarationStatus,
  ReconciliationStatus,
  RedressementStatus,
  DeviceType,
  DeviceStatus,
  AnomalyCategory,
  AnomalyType,
  AnomalyStatus,
  RiskLevel,
  RiskEntityType,
  NotificationGroupType,
  ExecutionMode,
  CheckpointStatus,
  ScanDirection,
  MfaStatus,
  Setting,
  Report,
  AuditLog,
  RfidTag,
  CustomRole,
  UserCustomRole,
  UserSiteAssignment,
} from '@lpg/types'

export interface Region {
  id: string
  name: string
  code: RegionEnum
  created_at?: string
  updated_at?: string
}

export interface Organization {
  id: string
  name: string
  type: OrgType
  registration_number?: string
  tax_id?: string
  is_active: boolean
  operational_site_count?: number
  client_site_count?: number
  vehicle_count?: number
  driver_count?: number
  user_count?: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface SystemRole {
  id: string
  name: Role
  description?: string
  hierarchy_level: number
  can_create_subroles?: boolean
  can_assign_roles?: boolean
  max_subordinate_level?: number
  created_at?: string
  updated_at?: string
}

export interface Permission {
  id: string
  code: string
  name: string
  description?: string
  category: string
  created_at?: string
}

export interface User {
  id: string
  email: string
  password_hash?: string
  first_name: string
  last_name: string
  system_role: Role
  org_id: string
  is_active: boolean
  mfa_status?: MfaStatus
  last_login_at?: string | null
  last_login_ip?: string | null
  failed_login_count?: number
  locked_until?: string | null
  password_changed_at?: string | null
  must_change_password?: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface Site {
  id: string
  org_id: string
  region: RegionEnum
  name: string
  functions?: SiteFunction[] | null
  address?: string
  geo_point?: number[] | [number, number] | null
  geo_confidence_score?: number
  delivery_count?: number
  is_verified: boolean
  verified_at?: string | null
  status: SiteStatus
  reason?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  verified_by?: string | null
}

export interface Client {
  id: string
  org_id: string
  primary_contact_name?: string
  primary_contact_phone?: string
  primary_contact_email?: string
  billing_address?: string
  payment_terms?: number | null
  credit_limit?: number | null
  tax_id?: string
  industry_sector?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface ClientSite {
  id: string
  client_org_id: string
  region: RegionEnum
  name: string
  address?: string
  geo_point?: number[] | [number, number] | null
  geo_confidence_score?: number
  delivery_count?: number
  is_verified: boolean
  verified_at?: string | null
  current_marketeur_org_id?: string | null
  site_contact_name?: string
  site_contact_phone?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  verified_by?: string | null
}

export interface Vehicle {
  id: string
  license_plate: string
  type: VehicleType
  org_id: string
  max_volume?: number | null
  max_bottle_count?: number | null
  certificate_url?: string
  certificate_number?: string
  certificate_issued_at?: string | null
  certificate_expiry_at?: string | null
  tare_weight?: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface Driver {
  id: string
  first_name: string
  last_name: string
  license_number?: string
  org_id: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  user_id?: string | null
}

export interface Device {
  id: string
  serial_number: string
  device_type: DeviceType
  status: DeviceStatus
  firmware_version?: string
  battery_level: number | null
  battery_critical: boolean
  last_sync?: string | null
  last_known_position?: number[] | [number, number] | null
  assigned_to_user_id?: string | null
  assigned_to_vehicle_id?: string | null
  org_id?: string | null
  config_json?: Record<string, unknown> | null
  metadata_json?: Record<string, unknown> | null
}

export interface TransporterContract {
  id: string
  marketeur_org_id: string
  transporter_org_id: string
  is_primary: boolean
  contract_reference?: string
  started_at?: string | null
  ended_at?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface PickupRequest {
  id: string
  marketeur_org_id: string
  source_site_id: string
  destination_site_id: string
  requested_quantity: number
  approved_quantity?: number | null
  status: PickupStatus
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface DeliveryTour {
  id: string
  marketeur_org_id: string
  execution_mode: ExecutionMode
  transporter_org_id?: string | null
  vehicle_id?: string | null
  driver_id?: string | null
  livreur_user_id?: string | null
  assigned_by_transporter_user_id?: string | null
  transporter_assigned_at?: string | null
  type: TourneeType
  status: TourneeStatus
  requested_quantity: number
  loaded_quantity?: number | null
  delivered_quantity?: number | null
  started_at?: string | null
  closed_at?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface Checkpoint {
  id: string
  tournee_id: string
  site_id?: string | null
  client_site_id?: string | null
  sequence: number
  expected_arrival?: string | null
  actual_arrival?: string | null
  status: CheckpointStatus
  skip_reason?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface ScanEvent {
  id: string
  checkpoint_id: string
  livreur_user_id?: string | null
  rfid_tag_id?: string | null
  direction: ScanDirection
  geo_point?: number[] | [number, number] | null
  timestamp: string
  meter_reading?: number | null
  photo_url?: string | null
  pda_sync_id?: string | null
  conflict_status?: string | null
  created_at?: string
  created_by?: string | null
}

export interface Declaration {
  id: string
  marketeur_org_id: string
  period_start: string
  period_end: string
  declared_volume: number
  status: DeclarationStatus
  submitted_by?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface Reconciliation {
  id: string
  declaration_id: string
  tracked_volume: number
  tracked_bottles_out?: number
  tracked_bottles_in?: number
  volume_gap: number
  subsidy_impact: number
  status: ReconciliationStatus
  verified_by?: string | null
  verified_at?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
}

export interface Redressement {
  id: string
  reconciliation_id: string
  amount: number
  status: RedressementStatus
  issued_at?: string
  due_date?: string | null
  paid_at?: string | null
  transaction_ref?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
}

export interface RiskScore {
  id: string
  entity_type: RiskEntityType
  entity_id: string
  score: number
  level: RiskLevel
  period_start?: string
  period_end?: string
  model_version?: string
  details_json?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
}

export interface Anomaly {
  id: string
  type: AnomalyType
  category: AnomalyCategory
  severity: RiskLevel
  status: AnomalyStatus
  entity_type?: RiskEntityType | null
  entity_id?: string | null
  site_id?: string | null
  client_site_id?: string | null
  evidence_json?: Record<string, unknown> | null
  assigned_to_group?: NotificationGroupType | null
  created_at?: string
  updated_at?: string
  resolved_at?: string | null
  resolved_by?: string | null
  resolution_notes?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface AnomalyAssignment {
  id: string
  anomaly_id: string
  assigned_to_user_id: string
  assigned_by_user_id: string
  assigned_at?: string
  status: string
  notes?: string | null
  resolved_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface NotificationGroup {
  id: string
  name: string
  type: NotificationGroupType
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface NotificationGroupMember {
  id: string
  group_id: string
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface NotificationRule {
  id: string
  name: string
  anomaly_type?: AnomalyType | null
  min_severity?: RiskLevel | null
  target_group_id: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface Notification {
  id: string
  rule_id?: string | null
  anomaly_id?: string | null
  target_user_id?: string | null
  target_group_id?: string | null
  channel: string
  subject: string
  body: string
  payload_json?: Record<string, unknown> | null
  is_read: boolean
  read_at?: string | null
  delivered_at?: string | null
  created_at?: string
}

export interface CuratedFixtures {
  regions: Region[]
  organizations: Organization[]
  system_roles: SystemRole[]
  permissions: Permission[]
  users: User[]
  user_mfa: Array<Record<string, unknown>>
  integration_auth: Array<Record<string, unknown>>
  sites: Site[]
  clients: Client[]
  client_sites: ClientSite[]
  user_site_assignments: UserSiteAssignment[]
  vehicles: Vehicle[]
  drivers: Driver[]
  devices: Device[]
  transporter_contracts: TransporterContract[]
  pickup_requests: PickupRequest[]
  delivery_tours: DeliveryTour[]
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
  settings: Setting[]
  reports: Report[]
  audit_logs: AuditLog[]
  rfid_tags: RfidTag[]
  custom_roles: CustomRole[]
  user_custom_roles: UserCustomRole[]
}

export const curated: CuratedFixtures = {
  regions: organizationsJson.regions as Region[],
  organizations: organizationsJson.organizations as Organization[],
  system_roles: usersAndRolesJson.system_roles as SystemRole[],
  permissions: usersAndRolesJson.permissions as Permission[],
  users: usersAndRolesJson.users as User[],
  user_mfa: usersAndRolesJson.user_mfa as Array<Record<string, unknown>>,
  integration_auth: usersAndRolesJson.integration_auth as Array<Record<string, unknown>>,
  sites: sitesJson.sites as Site[],
  clients: sitesJson.clients as Client[],
  client_sites: sitesJson.client_sites as ClientSite[],
  user_site_assignments: sitesJson.user_site_assignments as UserSiteAssignment[],
  vehicles: vehiclesJson.vehicles as Vehicle[],
  drivers: vehiclesJson.drivers as Driver[],
  devices: devicesJson.devices as Device[],
  transporter_contracts: deliveryToursJson.transporter_contracts as TransporterContract[],
  pickup_requests: deliveryToursJson.pickup_requests as PickupRequest[],
  delivery_tours: deliveryToursJson.delivery_tours as DeliveryTour[],
  checkpoints: deliveryToursJson.checkpoints as Checkpoint[],
  scan_events: deliveryToursJson.scan_events as ScanEvent[],
  declarations: complianceJson.declarations as Declaration[],
  reconciliations: complianceJson.reconciliations as Reconciliation[],
  redressements: complianceJson.redressements as Redressement[],
  risk_scores: complianceJson.risk_scores as RiskScore[],
  anomalies: anomaliesJson.anomalies as Anomaly[],
  anomaly_assignments: anomaliesJson.anomaly_assignments as AnomalyAssignment[],
  notification_groups: notificationsJson.notification_groups as NotificationGroup[],
  notification_group_members: notificationsJson.notification_group_members as NotificationGroupMember[],
  notification_rules: notificationsJson.notification_rules as NotificationRule[],
  notifications: notificationsJson.notifications as Notification[],
  settings: systemConfigJson.settings as Setting[],
  reports: systemConfigJson.reports as Report[],
  audit_logs: systemConfigJson.audit_logs as AuditLog[],
  rfid_tags: systemConfigJson.rfid_tags as RfidTag[],
  custom_roles: systemConfigJson.custom_roles as CustomRole[],
  user_custom_roles: systemConfigJson.user_custom_roles as UserCustomRole[],
}
