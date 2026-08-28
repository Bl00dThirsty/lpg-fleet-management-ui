// Shared domain types — LPG Fleet Management platform.
// Aligned to csph_gpl_schema_v6_2.sql and TODO.md.
// All enum values are UPPERCASE per schema convention (no underscores in enum values).
// All field names are snake_case to match the production Postgres schema.

export type Role =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'INTEGRATEUR'
  | 'AGENT'
  | 'MARKETEUR'
  | 'TRANSPORTEUR'
  | 'LIVREUR'

export type OrgType =
  | 'REGULATEUR'
  | 'DEPOT'
  | 'MARKETEUR'
  | 'TRANSPORTEUR'
  | 'CLIENT'

export type Region =
  | 'ADAMAOUA'
  | 'CENTRE'
  | 'EST'
  | 'EXTREMENORD'
  | 'LITTORAL'
  | 'NORD'
  | 'NORDOUEST'
  | 'OUEST'
  | 'SUD'
  | 'SUDOUEST'

/**
 * Multi-valued function of a `sites` row (schema `site_function` enum).
 * A site may cumulate several functions; the enlèvement source rule
 * (`flux1.pickup_source_functions`) restricts which may serve as a pickup
 * origin. Do not confuse with `OrgType` (organisation taxonomy).
 */
export type SiteFunction =
  | 'CENTREEMPLISSEUR'
  | 'ENTREPOT'
  | 'POINTAPPROVISIONABLE'

export type SiteStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'ACTIVE'
  | 'VERIFIED'
  | 'SUSPENDED'
  | 'REJECTED'

export type VehicleType = 'VRAC' | 'BOUTEILLES50KG'
export type TourneeType = 'VRAC' | 'BOUTEILLES50KG'

export type ExecutionMode = 'INTERNAL' | 'EXTERNAL'

export type TourneeStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'PENDINGTRANSPORTERACK'
  | 'ACKNOWLEDGED'
  | 'INPROGRESS'
  | 'CHECKPOINTACTIVE'
  | 'CLOSED'
  | 'CANCELLED'

export type CheckpointStatus = 'PENDING' | 'REACHED' | 'COMPLETED' | 'SKIPPED'
export type ScanDirection = 'IN' | 'OUT'

export type PickupStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'INPROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type DeclarationStatus = 'DRAFT' | 'SUBMITTED' | 'RECONCILED' | 'DISPUTED'
export type ReconciliationStatus = 'PENDING' | 'VERIFIED' | 'REDRESSEMENTAPPLIED'
export type RedressementStatus = 'ISSUED' | 'PAID' | 'WAIVED'

export type DeviceType = 'GPS' | 'PDA' | 'RFIDREADER'

export type DeviceStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'INMISSION'
  | 'OFFLINE'
  | 'PENDINGSYNC'
  | 'SYNCING'
  | 'SYNCED'
  | 'SYNCFAILED'
  | 'MAINTENANCE'
  | 'DEPLOYED'
  | 'REMOVED'
  | 'LOST'

export type RfidTagStatus =
  | 'AVAILABLE'
  | 'ASSIGNEDTOBOTTLE'
  | 'INTRANSITOUT'
  | 'INTRANSITIN'
  | 'LOST'
  | 'BLOCKED'

export type RiskLevel = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE' | 'CRITIQUEEXTREME'

export type RiskEntityType =
  | 'MARKETEUR'
  | 'TRANSPORTEUR'
  | 'LIVREUR'
  | 'SITE'
  | 'TOURNEE'
  | 'CLIENT'
  | 'CLIENTSITE'
  | 'VEHICLE'

export type AnomalyCategory = 'INVESTIGATION' | 'TECHNICAL'

export type AnomalyType =
  | 'VOLUMEGAP'
  | 'DEVIATIONROUTE'
  | 'CHECKPOINTMISSED'
  | 'SCANOUTOFSEQUENCE'
  | 'SIPHONNAGE'
  | 'SUBSTITUTIONBOUTEILLES'
  | 'FALSIFICATIONPREUVES'
  | 'FILLINGILLEGAL'
  | 'DIVERSIONSUBSIDIES'
  | 'PDAUNSYNCED'
  | 'BATTERYCRITICAL'
  | 'GPSFAILURE'
  | 'KAFKATIMEOUT'
  | 'IOTDEGRADATION'
  | 'SERVERUNAVAILABLE'
  | 'TOURNEEUNASSIGNEDTOOLONG'
  | 'TRANSPORTERNOACK'
  | 'GPSREMOVED'
  | 'DEVICEOFFLINE'

export type AnomalyStatus = 'NOUVEAU' | 'ENCOURS' | 'RESOLU' | 'FERME'

export type NotificationGroupType =
  | 'TECHNICAL'
  | 'INVESTIGATION'
  | 'ADMIN'
  | 'MARKETING'
  | 'TRANSPORT'

export type MfaType = 'TOTP' | 'SMS' | 'EMAIL'
export type MfaStatus = 'DISABLED' | 'PENDINGSETUP' | 'ENABLED' | 'LOCKED'

export type AuditAction =
  | 'LOGINSUCCESS'
  | 'LOGINFAILURE'
  | 'LOGOUT'
  | 'TOKENREFRESH'
  | 'PASSWORDRESET'
  | 'MFAENABLED'
  | 'MFADISABLED'
  | 'MFACHALLENGEFAILED'
  | 'MFACHALLENGESUCCESS'
  | 'PERMISSIONDENIED'
  | 'DATAEXPORT'
  | 'BULKDELETE'
  | 'DECLARATIONSUBMITTED'
  | 'RECONCILIATIONVERIFIED'
  | 'TOURNEECREATED'
  | 'TOURNEEASSIGNED'
  | 'TOURNEESENTTOTRANSPORTER'
  | 'TOURNEEACKNOWLEDGED'
  | 'TOURNESTARTED'
  | 'TOURNEECLOSED'
  | 'VEHICLECERTIFICATEEXPIRED'
  | 'SITESUSPENDED'
  | 'CLIENTCREATED'
  | 'SCANEVENTRECEIVED'
  | 'PDASYNCBULKUPLOAD'
  | 'ANOMALYRESOLVED'
  | 'DEVICEREMOVED'
  | 'GPSPOSITIONCAPTURED'
  | 'SETTINGCHANGED'

export type ReportType = 'OPERATIONAL' | 'FINANCIAL' | 'COMPLIANCE'
export type ReportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
export type ReportStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED' | 'EXPIRED'

export interface BaseEntity {
  id: string
  created_at?: string
  created_by?: string | null
  updated_at?: string
  updated_by?: string | null
  deleted_at?: string | null
}

export interface Organization extends BaseEntity {
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
}

export interface AppUser extends BaseEntity {
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
}

// Alias for backward compatibility
export type User = AppUser

export interface RegionEntity {
  id: string
  name: string
  code: Region
  created_at?: string
  updated_at?: string
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

export interface Vehicle extends BaseEntity {
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
}

export interface Driver extends BaseEntity {
  id: string
  first_name: string
  last_name: string
  license_number?: string
  org_id: string
  user_id?: string | null
  is_active: boolean
}

export interface Site extends BaseEntity {
  id: string
  org_id: string
  region: Region
  name: string
  functions?: SiteFunction[] | null
  address?: string
  geo_point?: number[] | [number, number] | null
  geo_confidence_score?: number
  delivery_count?: number
  is_verified: boolean
  verified_at?: string | null
  verified_by?: string | null
  status: SiteStatus
  reason?: string | null
  is_active: boolean
}

export interface Client extends BaseEntity {
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
}

export interface ClientSite extends BaseEntity {
  id: string
  client_org_id: string
  region: Region
  name: string
  address?: string
  geo_point?: number[] | [number, number] | null
  geo_confidence_score?: number
  delivery_count?: number
  is_verified: boolean
  verified_at?: string | null
  verified_by?: string | null
  current_marketeur_org_id?: string | null
  site_contact_name?: string
  site_contact_phone?: string
  is_active: boolean
}

export interface UserSiteAssignment {
  id: string
  user_id: string
  site_id: string
  client_site_id?: string | null
  is_primary: boolean
  created_at?: string
  updated_at?: string
}

export interface CustomRole extends BaseEntity {
  id: string
  org_id: string
  name: string
  description?: string
  permissions_json: Record<string, unknown>
  is_active: boolean
}

export interface UserCustomRole {
  id: string
  user_id: string
  custom_role_id: string
  site_id?: string | null
}

export interface Device extends BaseEntity {
  id: string
  serial_number: string
  device_type: DeviceType
  status: DeviceStatus
  firmware_version?: string
  battery_level: number | null
  battery_critical: boolean
  last_sync?: string | null
  last_known_position?: [number, number] | null
  assigned_to_user_id?: string | null
  assigned_to_vehicle_id?: string | null
  org_id?: string | null
  config_json?: Record<string, unknown> | null
  metadata_json?: Record<string, unknown> | null
}

export interface TransporterContract extends BaseEntity {
  id: string
  marketeur_org_id: string
  transporter_org_id: string
  is_primary: boolean
  contract_reference?: string
  started_at?: string | null
  ended_at?: string | null
  is_active: boolean
  contract_document_url?: string | null
  transporter_accepted_at?: string | null
}

export interface PickupRequest extends BaseEntity {
  id: string
  marketeur_org_id: string
  source_site_id: string
  destination_site_id: string
  requested_quantity: number
  approved_quantity?: number | null
  status: PickupStatus
}

export interface DeliveryTour extends BaseEntity {
  id: string
  marketeur_org_id: string
  execution_mode: ExecutionMode
  source_site_id?: string | null
  transporter_org_id?: string | null
  vehicle_id?: string | null
  driver_id?: string | null
  livreur_user_id?: string | null
  assigned_by_transporter_user_id?: string | null
  transporter_assigned_at?: string | null
  sent_to_transporter_at?: string | null
  type: TourneeType
  status: TourneeStatus
  requested_quantity: number
  loaded_quantity?: number | null
  delivered_quantity?: number | null
  started_at?: string | null
  closed_at?: string | null
}

export interface Checkpoint extends BaseEntity {
  id: string
  tournee_id: string
  site_id?: string | null
  client_site_id?: string | null
  sequence: number
  expected_quantity?: number | null
  expected_arrival?: string | null
  actual_arrival?: string | null
  status: CheckpointStatus
  skip_reason?: string | null
}

export interface ScanEvent {
  id: string
  checkpoint_id: string
  livreur_user_id?: string | null
  rfid_tag_id?: string | null
  direction: ScanDirection
  geo_point?: [number, number] | null
  timestamp: string
  meter_reading?: number | null
  photo_url?: string | null
  pda_sync_id?: string | null
  conflict_status?: string | null
  created_at?: string
  created_by?: string | null
}

export interface RfidTag {
  id: string
  tag_id: string
  bottle_serial?: string | null
  status: RfidTagStatus
  current_site_id?: string | null
  current_client_site_id?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface Declaration extends BaseEntity {
  id: string
  marketeur_org_id: string
  period_start: string
  period_end: string
  declared_volume: number
  status: DeclarationStatus
  submitted_by?: string | null
}

export interface Reconciliation extends BaseEntity {
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
}

export interface Redressement extends BaseEntity {
  id: string
  reconciliation_id: string
  amount: number
  status: RedressementStatus
  issued_at?: string
  due_date?: string | null
  paid_at?: string | null
  transaction_ref?: string | null
}

export interface RiskScore extends BaseEntity {
  id: string
  entity_type: RiskEntityType
  entity_id: string
  score: number
  level: RiskLevel
  period_start: string
  period_end: string
  model_version: string
  details_json?: Record<string, unknown> | null
}

export interface Anomaly extends BaseEntity {
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
  resolved_at?: string | null
  resolved_by?: string | null
  resolution_notes?: string | null
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

export interface NotificationGroup extends BaseEntity {
  id: string
  name: string
  type: NotificationGroupType
  is_active: boolean
}

export interface NotificationGroupMember {
  id: string
  group_id: string
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface NotificationRule extends BaseEntity {
  id: string
  name: string
  anomaly_type?: AnomalyType | null
  min_severity?: RiskLevel | null
  target_group_id: string
  is_active: boolean
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

export interface Report extends BaseEntity {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  parameters_json: Record<string, unknown>
  status: ReportStatus
  generated_at?: string | null
  file_url?: string | null
  file_size?: number | null
  generated_by?: string | null
  expires_at?: string | null
}

export interface AuditLog {
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

export interface IntegrationAuth {
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
}

export interface UserMfa {
  id: string
  user_id: string
  mfa_type?: MfaType | null
  secret_encrypted?: string | null
  backup_codes_hash?: string[] | null
  is_enabled: boolean
  verified_at?: string | null
}

export interface Setting {
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
}

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  pagination?: ApiPagination
  filters?: ApiFilters
  aggregations?: AggregationResult
}

export interface ApiPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface ApiFilters {
  date_from?: string
  date_to?: string
  sort?: string
  group_by?: string
}

export interface AggregationBucket {
  key: string
  count: number
  sum_volume?: number
  avg_score?: number
}

export interface AggregationResult {
  grouped_by: string
  buckets: AggregationBucket[]
  total_count: number
  total_volume?: number
}
