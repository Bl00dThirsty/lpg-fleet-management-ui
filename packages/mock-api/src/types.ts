/**
 * Domain entity interfaces for the mock API.
 * Field names are snake_case to match the production Postgres schema (csph_gpl_schema_v6_2.sql).
 */

import type {
  Role,
  OrgType,
  Region,
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
  MfaType,
  MfaStatus,
  RfidTagStatus,
  ReportFormat,
  ReportStatus,
  AuditAction,
} from '@lpg/types'

export interface RegionEntity {
  id: string
  name: string
  code: Region
  created_at?: string
  updated_at?: string
}

export interface OrganizationEntity {
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

export interface UserEntity {
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

export interface SiteEntity {
  id: string
  org_id: string
  region: Region
  name: string
  functions?: SiteFunction[] | null
  address?: string
  geo_point?: number[] | null
  geo_confidence_score?: number
  delivery_count?: number
  is_verified: boolean
  verified_at?: string | null
  verified_by?: string | null
  status: SiteStatus
  reason?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface ClientEntity {
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

export interface ClientSiteEntity {
  id: string
  client_org_id: string
  region: Region
  name: string
  address?: string
  geo_point?: number[] | null
  geo_confidence_score?: number
  delivery_count?: number
  is_verified: boolean
  verified_at?: string | null
  verified_by?: string | null
  current_marketeur_org_id?: string | null
  site_contact_name?: string
  site_contact_phone?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface VehicleEntity {
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

export interface DriverEntity {
  id: string
  first_name: string
  last_name: string
  license_number?: string
  org_id: string
  user_id?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface DeviceEntity {
  id: string
  serial_number: string
  device_type: DeviceType
  status: DeviceStatus
  firmware_version?: string
  battery_level: number | null
  battery_critical: boolean
  last_sync?: string | null
  last_known_position?: number[] | null
  assigned_to_user_id?: string | null
  assigned_to_vehicle_id?: string | null
  org_id?: string | null
  config_json?: Record<string, unknown> | null
  metadata_json?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface TransporterContractEntity {
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

export interface PickupRequestEntity {
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

export interface DeliveryTourEntity {
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

export interface CheckpointEntity {
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

export interface ScanEventEntity {
  id: string
  checkpoint_id: string
  livreur_user_id?: string | null
  rfid_tag_id?: string | null
  direction: ScanDirection
  geo_point?: number[] | null
  timestamp: string
  meter_reading?: number | null
  photo_url?: string | null
  pda_sync_id?: string | null
  conflict_status?: string | null
  created_at?: string
  created_by?: string | null
}

export interface RfidTagEntity {
  id: string
  tag_id: string
  bottle_serial?: string | null
  status: RfidTagStatus
  current_site_id?: string | null
  current_client_site_id?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface DeclarationEntity {
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

export interface ReconciliationEntity {
  id: string
  declaration_id: string
  tracked_volume: number
  tracked_bottles_out?: number | null
  tracked_bottles_in?: number | null
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

export interface RedressementEntity {
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

export interface RiskScoreEntity {
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

export interface AnomalyEntity {
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

export interface AnomalyAssignmentEntity {
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

export interface NotificationGroupEntity {
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

export interface NotificationGroupMemberEntity {
  id: string
  group_id: string
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface NotificationRuleEntity {
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

export interface NotificationEntity {
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

export interface ReportEntity {
  id: string
  name: string
  type: string
  format: ReportFormat
  parameters_json: Record<string, unknown>
  status: ReportStatus
  generated_at?: string | null
  file_url?: string | null
  file_size?: number | null
  generated_by?: string | null
  expires_at?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface AuditLogEntity {
  id: string
  user_id?: string | null
  session_id?: string | null
  action: AuditAction
  resource_table?: string | null
  resource_id?: string | null
  field_name?: string | null
  old_value?: Record<string, unknown> | null
  new_value?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
  request_id?: string | null
  risk_score?: number
  created_at: string
}

export interface CustomRoleEntity {
  id: string
  org_id: string
  name: string
  description?: string
  permissions_json: Record<string, unknown>
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface UserSiteAssignmentEntity {
  id: string
  user_id: string
  site_id: string
  client_site_id?: string | null
  is_primary: boolean
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
}

export interface UserCustomRoleEntity {
  id: string
  user_id: string
  custom_role_id: string
  site_id?: string | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  updated_by?: string | null
}

export interface SystemRoleEntity {
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

export interface PermissionEntity {
  id: string
  code: string
  name: string
  description?: string
  category: string
  created_at?: string
}

export interface UserMfaEntity {
  id: string
  user_id: string
  mfa_type?: MfaType | null
  secret_encrypted?: string | null
  backup_codes_hash?: string[] | null
  is_enabled: boolean
  verified_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface IntegrationAuthEntity {
  id: string
  user_id: string
  auth_key_hash: string
  certificate_pem?: string | null
  certificate_expiry?: string | null
  allowed_ip_ranges?: string[] | null
  last_auth_at?: string | null
  auth_success_count?: number
  auth_failure_count?: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface SettingEntity {
  id: string
  setting_key: string
  setting_value: string
  value_type: string
  category: string
  description?: string | null
  is_encrypted: boolean
  min_value?: number | null
  max_value?: number | null
  requires_restart: boolean
  created_at?: string
  updated_at?: string
}

export type EntityName =
  | 'regions'
  | 'organizations'
  | 'system_roles'
  | 'permissions'
  | 'users'
  | 'user_mfa'
  | 'integration_auth'
  | 'sites'
  | 'clients'
  | 'client_sites'
  | 'user_site_assignments'
  | 'custom_roles'
  | 'user_custom_roles'
  | 'vehicles'
  | 'drivers'
  | 'devices'
  | 'transporter_contracts'
  | 'pickup_requests'
  | 'delivery_tours'
  | 'checkpoints'
  | 'scan_events'
  | 'rfid_tags'
  | 'declarations'
  | 'reconciliations'
  | 'redressements'
  | 'risk_scores'
  | 'anomalies'
  | 'anomaly_assignments'
  | 'notification_groups'
  | 'notification_group_members'
  | 'notification_rules'
  | 'notifications'
  | 'reports'
  | 'audit_logs'
  | 'settings'

export type EntityMap = {
  regions: RegionEntity
  organizations: OrganizationEntity
  system_roles: SystemRoleEntity
  permissions: PermissionEntity
  users: UserEntity
  user_mfa: UserMfaEntity
  integration_auth: IntegrationAuthEntity
  sites: SiteEntity
  clients: ClientEntity
  client_sites: ClientSiteEntity
  user_site_assignments: UserSiteAssignmentEntity
  custom_roles: CustomRoleEntity
  user_custom_roles: UserCustomRoleEntity
  vehicles: VehicleEntity
  drivers: DriverEntity
  devices: DeviceEntity
  transporter_contracts: TransporterContractEntity
  pickup_requests: PickupRequestEntity
  delivery_tours: DeliveryTourEntity
  checkpoints: CheckpointEntity
  scan_events: ScanEventEntity
  rfid_tags: RfidTagEntity
  declarations: DeclarationEntity
  reconciliations: ReconciliationEntity
  redressements: RedressementEntity
  risk_scores: RiskScoreEntity
  anomalies: AnomalyEntity
  anomaly_assignments: AnomalyAssignmentEntity
  notification_groups: NotificationGroupEntity
  notification_group_members: NotificationGroupMemberEntity
  notification_rules: NotificationRuleEntity
  notifications: NotificationEntity
  reports: ReportEntity
  audit_logs: AuditLogEntity
  settings: SettingEntity
}