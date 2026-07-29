import type {
  Role, OrgType, SiteType, SiteStatus, TruckStatus,
  ContractTier, TruckRiskLevel, TransporterStatus,
  VehicleType, RiskLevel, TourneeType, AnomalyCategory,
} from '@lpg/types'

export interface Organization {
  id: string; name: string; type: OrgType; code: string
  registrationNumber?: string; region: string
  isActive: boolean; active: boolean
  contactEmail?: string; contactPhone?: string
}

export interface AppUser {
  id: string; email: string; firstName: string; lastName: string
  role: Role; systemRole?: Role; organizationId: string; orgId?: string
  active: boolean; isActive?: boolean; phone?: string
}

export interface Transporter {
  id: string; name: string; status: TransporterStatus; region: string
  contactEmail: string; contactPhone: string; fleetSize: number
  organizationId?: string
}

export interface Site {
  id: string; name: string; type: SiteType
  city?: string; region?: string; operator?: string
  lat?: number; lng?: number
  capturedLat?: number | null; capturedLng?: number | null
  status: SiteStatus; description?: string
  isKeySite?: boolean; organizationId?: string; orgId?: string
  addressText?: string; isVerifiedByAgent?: boolean
  geoConfidenceScore?: number; deliveryCountAtGeo?: number
  verifiedAt?: string | null; verifiedBy?: string | null
  reason?: string
}

export interface Truck {
  id: string; plateNumber?: string; licensePlate?: string
  type?: VehicleType; transporterOrgId?: string
  maxVolumeLiters?: number; tankCapacityLiters?: number
  maxBottleCount?: number
  certificateDeJaugementUrl?: string; certificateIssuedAt?: string
  certificateExpiryAt?: string; certificateNumber?: string
  tareWeightKg?: number
  isActive?: boolean; status: TruckStatus
  tenantName?: string; marketer?: string
  compartments?: number; fuelType?: 'GPL'
  makeModel?: string; year?: number; gpsImei?: string
  assignedDriver?: string; driverPhone?: string; fleetManager?: string
  operatingRegion?: string; homeDepot?: string
  currentLocation?: string
  latitude?: number; longitude?: number
  destination?: string; destinationLatitude?: number; destinationLongitude?: number
  assignedRoute?: string; odometerKm?: number; nextServiceKm?: number
  lastServiceDate?: string; insuranceExpiry?: string
  technicalVisitExpiry?: string; permitExpiry?: string; lastPing?: string
  contractTier?: ContractTier; riskLevel?: TruckRiskLevel
  organizationId?: string
}

export interface Tour {
  id: string; reference?: string
  truckId?: string; vehicleId?: string; driverId?: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'IN_PROGRESS' | 'PLANNED' | 'CLOSED'
  plannedDate?: string; stops?: number
  type?: TourneeType; marketerOrgId?: string; transporterOrgId?: string
  livreurUserId?: string
  loadedVolumeLiters?: number; deliveredVolumeLiters?: number
  loadedBottleCount?: number; deliveredBottleCount?: number
  checkpoints?: Checkpoint[]; scans?: ScanEvent[]
  startedAt?: string; closedAt?: string | null
}

export interface Declaration {
  id: string; reference?: string
  marketeurId?: string; marketerOrgId?: string; siteId?: string
  status: string
  bottlesIn?: number; bottlesOut?: number; declaredAt?: string
  periodStart?: string; periodEnd?: string
  declaredVolumeKg?: number; submittedBy?: string
}

export interface Anomaly {
  id: string; type: string; category?: AnomalyCategory
  severity: 'low' | 'medium' | 'high' | RiskLevel
  resourceId?: string; entityType?: string; entityId?: string; siteId?: string
  message?: string; detectedAt?: string; resolved?: boolean
  status?: string; assignedToUserId?: string
  evidence?: Record<string, unknown>
  assignedToGroup?: string
  resolvedAt?: string | null; resolvedBy?: string | null
  resolutionNotes?: string | null
}

export interface Report {
  id: string; title: string; category: string
  generatedAt: string; author: string; format?: string
}

export interface PdaDevice {
  id: string; serial?: string; serialNumber?: string
  status: string; assignedTo?: string | null; assignedToUserId?: string
  lastSync: string; orgId?: string
  batteryLevel?: number; batteryCritical?: boolean
}

export interface InfraMetric {
  id: string; service: string; cpu: number; memory: number
  status: string; measuredAt: string
}

export interface Driver {
  id: string; firstName: string; lastName: string
  licenseNumber: string; transporterOrgId: string
  userId?: string; phone?: string; status?: string
}

export interface RfidTag {
  id: string; tagId: string; bottleSerial: string
  status: string; assignedToBottle?: string; blockReason?: string
  createdAt: string
}

export interface Pickup {
  id: string; marketerOrgId: string
  sourceSiteId: string; destinationSiteId: string
  requestedQuantityKg: number; approvedQuantityKg?: number
  status: string; vehicleIds?: string[]; vehicleId?: string
  driverId?: string; livreurUserId?: string
  arrivalProofPhotoUrl?: string; createdAt: string
}

export interface Checkpoint {
  id: string; tourId?: string; tourneeId?: string; siteId: string
  expectedArrival?: string; actualArrival?: string | null
  status: string; skipReason?: string
  actualLat?: number; actualLng?: number; sequence?: number
}

export interface ScanEvent {
  id: string; checkpointId: string; rfidTagId?: string | null
  direction: string; capturedLat: number; capturedLng: number
  timestamp?: string; scannedAt?: string
  meterReading?: number; photoUrl?: string; livreurUserId?: string
}

export interface Reconciliation {
  id: string; declarationId: string; marketeurOrgId?: string
  declaredVolumeKg?: number; trackedVolumeKg: number
  gapKg?: number; gapPct?: number
  trackedBottlesOut?: number; trackedBottlesIn?: number
  volumeGapKg?: number; subsidyImpactFcfa?: number
  status: string; verifiedByAgent?: boolean; notes?: string
  periodStart?: string; periodEnd?: string
  verifiedBy?: string | null
}

export interface Redressement {
  id: string; reconciliationId: string
  amountFcfa: number; status: string
  dueDate?: string; transactionRef?: string | null
  createdAt?: string; issuedAt?: string; paidAt?: string | null
}

export interface CustomRole {
  id: string; orgId: string; name: string; description?: string
  permissions: { can: { action?: string; resource?: string }[] } | { can: string[] }
  isActive?: boolean
}

export interface UserSiteAssignment {
  id: string; userId: string; siteId: string; isPrimary: boolean
}

export interface UserCustomRole {
  id: string; userId: string; customRoleId: string; siteId?: string
}

export interface NotificationGroup {
  id: string; name: string; type: string
  members?: string[]; memberIds?: string[]; isActive?: boolean
}

export interface NotificationRule {
  id: string; name?: string; anomalyType: string
  minSeverity: string; targetGroupId: string; isActive?: boolean
}

export interface Risk {
  id: string; entityType: string; entityId: string
  score: number; level?: RiskLevel
  periodStart?: string; periodEnd?: string
  modelVersion?: string; details?: Record<string, unknown>
  factors?: Record<string, number>; computedAt?: string
}

export interface AuditLog {
  id: string; userId: string; table: string; action: string
  entityId: string; changes: Record<string, unknown>; timestamp: string
}

export interface DeliveryType {
  id: string; name: string; code: string; description?: string
}

export interface TourStatus {
  id: string; name: string; code: string; color?: string
}

export type EntityName =
  | 'organizations' | 'users' | 'sites' | 'trucks'
  | 'tours' | 'declarations' | 'anomalies' | 'reports'
  | 'pda' | 'infra' | 'transporters' | 'drivers'
  | 'rfid-tags' | 'pickups' | 'checkpoints' | 'scans'
  | 'reconciliations' | 'redressements' | 'custom-roles'
  | 'user-assignments' | 'user-custom-roles'
  | 'notification-groups' | 'notification-rules'
  | 'risks' | 'audit-logs' | 'vehicle-types'
  | 'delivery-types' | 'tour-statuses'

export type EntityMap = {
  organizations: Organization; users: AppUser; sites: Site
  trucks: Truck; tours: Tour; declarations: Declaration
  anomalies: Anomaly; reports: Report; pda: PdaDevice
  infra: InfraMetric; transporters: Transporter; drivers: Driver
  'rfid-tags': RfidTag; pickups: Pickup; checkpoints: Checkpoint
  scans: ScanEvent; reconciliations: Reconciliation
  redressements: Redressement; 'custom-roles': CustomRole
  'user-assignments': UserSiteAssignment; 'user-custom-roles': UserCustomRole
  'notification-groups': NotificationGroup; 'notification-rules': NotificationRule
  risks: Risk; 'audit-logs': AuditLog
  'vehicle-types': DeliveryType; 'delivery-types': DeliveryType
  'tour-statuses': TourStatus
}
