// Shared domain types — LPG Fleet Management platform.

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'INTEGRATEUR'
  | 'AGENT'
  | 'MARKETEUR'
  | 'LIVREUR'

export type OrgType = 'CSPH' | 'SCDP' | 'SNH' | 'MARKETEUR' | 'TRANSPORTEUR' | 'csph' | 'scdp' | 'snh' | 'marketeur' | 'transporteur'

export type SiteType = 'CENTRE_EMPLISSEUR' | 'DEPOT' | 'CLIENT' | 'POINT_DE_VENTE' | 'depot' | 'scdp' | 'filling-center' | 'marketer' | 'delivery-point'

export type SiteStatus = 'PENDING_GEO_ASSIGN' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'active' | 'planned' | 'inactive'

export type BottleStatus = 'in_empty' | 'out_full'

export type TruckStatus = 'available' | 'in_transit' | 'maintenance' | 'inactive' | 'active'

export type ContractTier = 'Starter' | 'Growth' | 'Enterprise'

export type TruckRiskLevel = 'low' | 'medium' | 'high'

export type TransporterStatus = 'active' | 'pending' | 'suspended'

export type VehicleType = 'VRAC' | 'BOUTEILLES'

export type AnomalyCategory = 'INVESTIGATION' | 'TECHNICAL'

export type AnomalyType =
  | 'VOLUME_GAP' | 'DEVIATION_ROUTE' | 'CHECKPOINT_MISSED' | 'SCAN_OUT_OF_SEQUENCE'
  | 'SIPHONNAGE' | 'SUBSTITUTION_BOUTEILLES' | 'FALSIFICATION_PREUVES'
  | 'PDA_UNSYNCED' | 'BATTERY_CRITICAL' | 'GPS_FAILURE' | 'KAFKA_TIMEOUT' | 'IOT_DEGRADATION'
  | 'gps' | 'rfid' | 'weight' | 'iot'

export type GroupType = 'TECHNICAL' | 'INVESTIGATION' | 'ADMIN' | 'MARKETING'

export type RiskLevel = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE' | 'CRITIQUE_EXTREME' | 'low' | 'medium' | 'high'

export type PickupStatus = 'DRAFT' | 'VALIDATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING'

export type TourneeType = 'VRAC' | 'BOUTEILLES_50KG'

export type TourneeStatus = 'PLANNED' | 'IN_PROGRESS' | 'CHECKPOINT_ACTIVE' | 'CLOSED' | 'CANCELLED'

export type CheckpointStatus = 'PENDING' | 'REACHED' | 'COMPLETED' | 'SKIPPED'

export type ScanDirection = 'IN' | 'OUT'

export type ReconciliationStatus = 'PENDING' | 'VERIFIED' | 'REDRESSEMENT_APPLIED' | 'PENDING_VERIFICATION' | 'REJECTED'

export type RedressementStatus = 'ISSUED' | 'PAID' | 'WAIVED' | 'PENDING' | 'OVERDUE'

export type AnomalyStatus = 'NOUVEAU' | 'EN_COURS' | 'RESOLU' | 'FERME' | 'ASSIGNE'

export type DeclarationStatus = 'DRAFT' | 'SUBMITTED' | 'RECONCILED' | 'DISPUTED' | 'draft' | 'submitted' | 'validated' | 'rejected'

export interface BaseEntity {
  id: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  deletedAt?: string | null
}

export interface Organization {
  id: string
  name: string
  type: OrgType
  code: string
  registrationNumber?: string
  region: string
  isActive: boolean
  active: boolean
  contactEmail?: string
  contactPhone?: string
}

export interface AppUser {
  id: string
  email: string
  firstName: string
  lastName: string
  systemRole: Role
  role: Role
  organizationId: string
  orgId?: string
  active: boolean
  isActive?: boolean
}

export interface Transporter {
  id: string
  name: string
  status: TransporterStatus
  region: string
  contactEmail: string
  contactPhone: string
  fleetSize: number
  organizationId?: string
}

export interface Vehicle {
  id: string
  licensePlate: string
  plateNumber?: string
  type: VehicleType
  transporterOrgId: string
  maxVolumeLiters?: number
  maxBottleCount?: number
  tankCapacityLiters?: number
  certificateDeJaugementUrl: string
  certificateIssuedAt?: string
  certificateExpiryAt: string
  certificateNumber: string
  tareWeightKg?: number
  isActive: boolean
  compartments?: number
  fuelType?: 'GPL'
  makeModel: string
  year: number
  gpsImei?: string
  assignedDriver?: string
  status: TruckStatus
  contractTier?: ContractTier
  riskLevel?: TruckRiskLevel
  organizationId?: string
}

export interface Driver {
  id: string
  firstName: string
  lastName: string
  licenseNumber: string
  transporterOrgId: string
  userId?: string
  phone?: string
  status?: 'active' | 'inactive'
}

export interface Site {
  id: string
  orgId: string
  organizationId?: string
  name: string
  type: SiteType
  addressText: string
  capturedLat: number | null
  capturedLng: number | null
  lat?: number
  lng?: number
  city?: string
  region?: string
  operator?: string
  geoConfidenceScore: number
  deliveryCountAtGeo: number
  isVerifiedByAgent: boolean
  verifiedAt?: string | null
  verifiedBy?: string | null
  status: SiteStatus
  reason?: string
  description?: string
  isKeySite?: boolean
}

export interface Tour {
  id: string
  reference: string
  marketerOrgId: string
  transporterOrgId: string
  type: TourneeType
  vehicleId: string
  truckId?: string
  driverId: string
  livreurUserId: string
  loadedVolumeLiters?: number
  deliveredVolumeLiters?: number
  loadedBottleCount?: number
  deliveredBottleCount?: number
  checkpoints?: Checkpoint[]
  status: TourneeStatus | 'planned' | 'in_progress' | 'completed' | 'cancelled'
  startedAt?: string
  closedAt?: string | null
  plannedDate?: string
  stops?: number
}

export interface Checkpoint {
  id: string
  tourneeId: string
  tourId?: string
  siteId: string
  sequence: number
  expectedArrival: string
  actualArrival?: string | null
  status: CheckpointStatus
  scans?: ScanEvent[]
  skipReason?: string
  actualLat?: number
  actualLng?: number
}

export interface ScanEvent {
  id: string
  checkpointId: string
  livreurUserId: string
  rfidTagId: string | null
  direction: ScanDirection
  capturedLat: number
  capturedLng: number
  timestamp: string
  scannedAt?: string
  meterReading?: number
  photoUrl?: string
}

export interface PickupRequest {
  id: string
  marketerOrgId: string
  sourceSiteId: string
  destinationSiteId: string
  requestedQuantityKg: number
  approvedQuantityKg?: number
  status: PickupStatus
  assignedVehicles?: string[]
  vehicleIds?: string[]
  vehicleId?: string
  driverId?: string
  livreurUserId?: string
  createdAt: string
}

export interface Declaration {
  id: string
  marketerOrgId: string
  marketeurId?: string
  periodStart: string
  periodEnd: string
  declaredVolumeKg: number
  status: DeclarationStatus
  submittedBy: string
  reference?: string
  siteId?: string
  bottlesIn?: number
  bottlesOut?: number
  declaredAt?: string
  createdAt?: string
}

export interface Reconciliation {
  id: string
  declarationId: string
  trackedVolumeKg: number
  trackedBottlesOut: number
  trackedBottlesIn: number
  volumeGapKg: number
  gapKg?: number
  gapPct?: number
  subsidyImpactFcfa: number
  status: ReconciliationStatus
  verifiedBy?: string | null
  verifiedByAgent?: boolean
  notes?: string
  periodStart?: string
  periodEnd?: string
  declaredVolumeKg?: number
  marketeurOrgId?: string
}

export interface Redressement {
  id: string
  reconciliationId: string
  amountFcfa: number
  status: RedressementStatus
  issuedAt?: string
  createdAt?: string
  paidAt?: string | null
  transactionRef?: string | null
  dueDate?: string
}

export interface RiskScore {
  id: string
  entityType: 'MARKETEUR' | 'TRANSPORTEUR' | 'LIVREUR' | 'SITE' | 'TOURNEE'
  entityId: string
  score: number
  level: RiskLevel
  periodStart: string
  periodEnd: string
  modelVersion: string
  details: Record<string, unknown>
  factors?: Record<string, number>
  computedAt?: string
}

export interface Anomaly {
  id: string
  type: AnomalyType
  category: AnomalyCategory
  severity: RiskLevel | 'low' | 'medium' | 'high'
  status: AnomalyStatus
  entityType: string
  entityId: string
  siteId?: string
  evidence: Record<string, unknown>
  assignedToGroup: 'TECHNICAL_TEAM' | 'INVESTIGATION_TEAM'
  assignedToUserId?: string
  resolvedAt?: string | null
  resolvedBy?: string | null
  resolutionNotes?: string | null
  resourceId?: string
  message?: string
  detectedAt?: string
  resolved?: boolean
}

export interface CustomRole {
  id: string
  orgId: string
  name: string
  description?: string
  permissions: { can: { action: string; resource: string }[] }
  isActive: boolean
}

export interface UserCustomRole {
  id: string
  userId: string
  customRoleId: string
  siteId?: string
}

export interface UserSiteAssignment {
  id: string
  userId: string
  siteId: string
  isPrimary: boolean
}

export interface NotificationGroup {
  id: string
  name: string
  type: GroupType
  members: string[]
  memberIds?: string[]
  isActive: boolean
}

export interface NotificationRule {
  id: string
  name?: string
  anomalyType: AnomalyType
  minSeverity: RiskLevel | 'low' | 'medium' | 'high'
  targetGroupId: string
  isActive: boolean
}

export interface RfidTag {
  id: string
  tagId: string
  bottleSerial: string
  status: 'ACTIVE' | 'ASSIGNED_TO_BOTTLE' | 'BLOCKED' | 'COMPROMISED'
  blockReason?: string
  createdAt: string
}

export interface PdaDevice {
  id: string
  serial: string
  serialNumber?: string
  status: 'online' | 'offline' | 'maintenance' | 'PENDING_SYNC' | 'ACTIVE'
  assignedTo: string | null
  assignedToUserId?: string
  lastSync: string
  batteryLevel?: number
  batteryCritical?: boolean
}

export interface InfraMetric {
  id: string
  service: string
  cpu: number
  memory: number
  status: 'healthy' | 'degraded' | 'down'
  measuredAt: string
}

export interface Report {
  id: string
  title: string
  category: 'operations' | 'finance' | 'compliance'
  generatedAt: string
  author: string
  format?: string
}

export interface AuditLog {
  id: string
  userId: string
  table: string
  action: string
  entityId: string
  changes: Record<string, unknown>
  timestamp: string
}

export interface DeliveryType {
  id: string
  name: string
  code: string
  description?: string
}

export interface TourStatus {
  id: string
  name: string
  code: string
  color?: string
}

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  donnees: T
  pagination?: Pagination
  filtres?: ApiFilters
  aggregations?: AggregationResult
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface ApiFilters {
  dateDebut?: string
  dateFin?: string
  tri?: string
  groupement?: string
}

export interface AggregationBucket {
  key: string
  count: number
  sumVolume?: number
  avgScore?: number
}

export interface AggregationResult {
  groupedBy: string
  buckets: AggregationBucket[]
  totalCount: number
  totalVolume?: number
}
