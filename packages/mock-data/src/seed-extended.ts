export const drivers = [
  { id: 'drv-1', firstName: 'Jean-Baptiste', lastName: 'Mballa', licenseNumber: 'CM-1992-0102345', transporterOrgId: 'org-1', userId: 'user-7', phone: '+237 699 100 201', status: 'active' },
  { id: 'drv-2', firstName: 'Romain', lastName: 'Etoundi', licenseNumber: 'CM-2005-0034567', transporterOrgId: 'org-1', phone: '+237 677 200 202', status: 'active' },
  { id: 'drv-3', firstName: 'Celestin', lastName: 'Omgba', licenseNumber: 'CM-2010-0045678', transporterOrgId: 'org-2', phone: '+237 655 300 203', status: 'active' },
  { id: 'drv-4', firstName: 'Maurice', lastName: 'Ngono', licenseNumber: 'CM-2008-0056789', transporterOrgId: 'org-2', phone: '+237 698 400 204', status: 'active' },
  { id: 'drv-5', firstName: 'Alphonse', lastName: 'Fouda', licenseNumber: 'CM-2012-0067890', transporterOrgId: 'org-3', phone: '+237 677 500 205', status: 'inactive' },
  { id: 'drv-6', firstName: 'Pierre', lastName: 'Zanga', licenseNumber: 'CM-2015-0078901', transporterOrgId: 'org-3', phone: '+237 655 600 206', status: 'active' },
  { id: 'drv-7', firstName: 'David', lastName: 'Essomba', licenseNumber: 'CM-2018-0089012', transporterOrgId: 'org-4', phone: '+237 699 700 207', status: 'active' },
  { id: 'drv-8', firstName: 'Serge', lastName: 'Mekongo', licenseNumber: 'CM-2020-0090123', transporterOrgId: 'org-4', phone: '+237 698 800 208', status: 'active' },
]

export const rfidTags = [
  { id: 'rfid-1', tagId: 'E200-001-3F7A-001', bottleSerial: 'BTL-0001', status: 'ASSIGNED_TO_BOTTLE', createdAt: '2026-01-15T08:00:00Z' },
  { id: 'rfid-2', tagId: 'E200-001-3F7A-002', bottleSerial: 'BTL-0002', status: 'ASSIGNED_TO_BOTTLE', createdAt: '2026-01-15T08:00:00Z' },
  { id: 'rfid-3', tagId: 'E200-001-3F7A-003', bottleSerial: 'BTL-0003', status: 'ACTIVE', createdAt: '2026-01-20T10:00:00Z' },
  { id: 'rfid-4', tagId: 'E200-001-3F7A-004', bottleSerial: 'BTL-0004', status: 'ASSIGNED_TO_BOTTLE', createdAt: '2026-01-20T10:00:00Z' },
  { id: 'rfid-5', tagId: 'E200-001-3F7A-005', bottleSerial: 'BTL-0005', status: 'BLOCKED', createdAt: '2026-02-01T09:00:00Z', blockReason: 'Bouteille compromise - fuite détectée' },
  { id: 'rfid-6', tagId: 'E200-002-8AB1-006', bottleSerial: 'BTL-0006', status: 'ASSIGNED_TO_BOTTLE', createdAt: '2026-02-05T11:00:00Z' },
  { id: 'rfid-7', tagId: 'E200-002-8AB1-007', bottleSerial: 'BTL-0007', status: 'ASSIGNED_TO_BOTTLE', createdAt: '2026-02-05T11:00:00Z' },
  { id: 'rfid-8', tagId: 'E200-002-8AB1-008', bottleSerial: 'BTL-0008', status: 'COMPROMISED', createdAt: '2026-02-10T14:00:00Z', blockReason: 'Tag volé signalé par le livreur' },
  { id: 'rfid-9', tagId: 'E200-003-2CD5-009', bottleSerial: 'BTL-0009', status: 'ASSIGNED_TO_BOTTLE', createdAt: '2026-03-01T08:00:00Z' },
  { id: 'rfid-10', tagId: 'E200-003-2CD5-010', bottleSerial: 'BTL-0010', status: 'ASSIGNED_TO_BOTTLE', createdAt: '2026-03-01T08:00:00Z' },
]

for (let i = 11; i <= 30; i++) {
  const status = i % 5 === 0 ? 'ACTIVE' : 'ASSIGNED_TO_BOTTLE'
  rfidTags.push({
    id: `rfid-${i}`,
    tagId: `E200-${String((i % 10) + 10).padStart(2, '0')}-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${String(i).padStart(3, '0')}`,
    bottleSerial: `BTL-${String(i).padStart(4, '0')}`,
    status,
    createdAt: `2026-03-${String((i % 28) + 1).padStart(2, '0')}T08:00:00Z`,
  })
}

export const pickups = [
  { id: 'pck-1', marketerOrgId: 'org-5', sourceSiteId: 'site-1', destinationSiteId: 'site-3', requestedQuantityKg: 18000, approvedQuantityKg: 18000, status: 'COMPLETED', vehicleId: 'trk-1', driverId: 'drv-1', livreurUserId: 'user-7', arrivalProofPhotoUrl: null, createdAt: '2026-07-10T06:00:00Z' },
  { id: 'pck-2', marketerOrgId: 'org-6', sourceSiteId: 'site-2', destinationSiteId: 'site-4', requestedQuantityKg: 22000, approvedQuantityKg: 22000, status: 'IN_PROGRESS', vehicleId: 'trk-2', driverId: 'drv-2', livreurUserId: 'user-7', createdAt: '2026-07-15T07:00:00Z' },
  { id: 'pck-3', marketerOrgId: 'org-5', sourceSiteId: 'site-1', destinationSiteId: 'site-5', requestedQuantityKg: 15000, status: 'VALIDATED', vehicleIds: ['trk-3', 'trk-4'], createdAt: '2026-07-18T08:00:00Z' },
  { id: 'pck-4', marketerOrgId: 'org-6', sourceSiteId: 'site-2', destinationSiteId: 'site-6', requestedQuantityKg: 25000, status: 'PENDING', createdAt: '2026-07-20T09:00:00Z' },
  { id: 'pck-5', marketerOrgId: 'org-5', sourceSiteId: 'site-3', destinationSiteId: 'site-7', requestedQuantityKg: 12000, approvedQuantityKg: 12000, status: 'COMPLETED', vehicleId: 'trk-5', driverId: 'drv-3', livreurUserId: 'user-7', createdAt: '2026-07-22T05:00:00Z' },
  { id: 'pck-6', marketerOrgId: 'org-6', sourceSiteId: 'site-4', destinationSiteId: 'site-8', requestedQuantityKg: 16000, status: 'CANCELLED', createdAt: '2026-07-25T10:00:00Z' },
]

export const checkpoints = [
  { id: 'chk-1', tourId: 'tour-1', siteId: 'site-3', expectedArrival: '2026-07-20T10:00:00Z', actualArrival: '2026-07-20T10:15:00Z', status: 'COMPLETED', actualLat: 3.8672, actualLng: 11.5155, sequence: 1 },
  { id: 'chk-2', tourId: 'tour-1', siteId: 'site-5', expectedArrival: '2026-07-20T12:00:00Z', actualArrival: '2026-07-20T12:30:00Z', status: 'COMPLETED', actualLat: 3.8567, actualLng: 11.5040, sequence: 2 },
  { id: 'chk-3', tourId: 'tour-2', siteId: 'site-4', expectedArrival: '2026-07-21T09:00:00Z', status: 'PENDING', sequence: 1 },
  { id: 'chk-4', tourId: 'tour-2', siteId: 'site-6', expectedArrival: '2026-07-21T11:00:00Z', status: 'PENDING', sequence: 2 },
  { id: 'chk-5', tourId: 'tour-3', siteId: 'site-7', expectedArrival: '2026-07-22T08:00:00Z', actualArrival: '2026-07-22T08:05:00Z', status: 'REACHED', actualLat: 3.8667, actualLng: 11.5177, sequence: 1 },
  { id: 'chk-6', tourId: 'tour-3', siteId: 'site-9', expectedArrival: '2026-07-22T10:00:00Z', status: 'PENDING', sequence: 2 },
  { id: 'chk-7', tourId: 'tour-4', siteId: 'site-10', expectedArrival: '2026-07-23T07:00:00Z', status: 'SKIPPED', skipReason: 'Route impraticable suite aux fortes pluies', sequence: 1 },
  { id: 'chk-8', tourId: 'tour-4', siteId: 'site-11', expectedArrival: '2026-07-23T09:00:00Z', actualArrival: '2026-07-23T09:45:00Z', status: 'COMPLETED', actualLat: 3.8765, actualLng: 11.4899, sequence: 2 },
]

export const scans = [
  { id: 'scn-1', checkpointId: 'chk-1', rfidTagId: 'rfid-1', direction: 'IN', capturedLat: 3.8672, capturedLng: 11.5155, meterReading: 450012, livreurUserId: 'user-7', photoUrl: null, scannedAt: '2026-07-20T10:16:00Z', timestamp: '2026-07-20T10:16:00Z' },
  { id: 'scn-2', checkpointId: 'chk-1', rfidTagId: 'rfid-2', direction: 'IN', capturedLat: 3.8672, capturedLng: 11.5155, meterReading: 450013, livreurUserId: 'user-7', photoUrl: null, scannedAt: '2026-07-20T10:17:00Z', timestamp: '2026-07-20T10:17:00Z' },
  { id: 'scn-3', checkpointId: 'chk-1', rfidTagId: 'rfid-1', direction: 'OUT', capturedLat: 3.8672, capturedLng: 11.5155, meterReading: 450015, livreurUserId: 'user-7', photoUrl: null, scannedAt: '2026-07-20T10:25:00Z', timestamp: '2026-07-20T10:25:00Z' },
  { id: 'scn-4', checkpointId: 'chk-2', rfidTagId: 'rfid-3', direction: 'IN', capturedLat: 3.8567, capturedLng: 11.5040, meterReading: 235001, livreurUserId: 'user-7', photoUrl: 'https://picsum.photos/seed/delivery1/800/600', scannedAt: '2026-07-20T12:32:00Z', timestamp: '2026-07-20T12:32:00Z' },
  { id: 'scn-5', checkpointId: 'chk-2', rfidTagId: 'rfid-4', direction: 'IN', capturedLat: 3.8567, capturedLng: 11.5040, meterReading: 235002, livreurUserId: 'user-7', photoUrl: null, scannedAt: '2026-07-20T12:33:00Z', timestamp: '2026-07-20T12:33:00Z' },
  { id: 'scn-6', checkpointId: 'chk-2', rfidTagId: 'rfid-3', direction: 'OUT', capturedLat: 3.8567, capturedLng: 11.5040, meterReading: 235005, livreurUserId: 'user-7', photoUrl: null, scannedAt: '2026-07-20T12:40:00Z', timestamp: '2026-07-20T12:40:00Z' },
  { id: 'scn-7', checkpointId: 'chk-5', rfidTagId: 'rfid-6', direction: 'IN', capturedLat: 3.8667, capturedLng: 11.5177, meterReading: 567100, livreurUserId: 'user-7', photoUrl: 'https://picsum.photos/seed/delivery2/800/600', scannedAt: '2026-07-22T08:06:00Z', timestamp: '2026-07-22T08:06:00Z' },
  { id: 'scn-8', checkpointId: 'chk-5', rfidTagId: 'rfid-7', direction: 'IN', capturedLat: 3.8667, capturedLng: 11.5177, meterReading: 567101, livreurUserId: 'user-7', photoUrl: null, scannedAt: '2026-07-22T08:07:00Z', timestamp: '2026-07-22T08:07:00Z' },
]

export const reconciliations = [
  { id: 'rec-1', declarationId: 'decl-1', marketeurOrgId: 'org-5', declaredVolumeKg: 50000, trackedVolumeKg: 48750, trackedBottlesOut: 3450, trackedBottlesIn: 120, gapKg: -1250, gapPct: -2.5, volumeGapKg: -1250, subsidyImpactFcfa: 250000, status: 'VERIFIED', verifiedByAgent: true, verifiedBy: 'user-5', notes: 'Écart mineur, accepté', periodStart: '2026-06-01', periodEnd: '2026-06-30' },
  { id: 'rec-2', declarationId: 'decl-2', marketeurOrgId: 'org-6', declaredVolumeKg: 35000, trackedVolumeKg: 32900, trackedBottlesOut: 2800, trackedBottlesIn: 90, gapKg: -2100, gapPct: -6.0, volumeGapKg: -2100, subsidyImpactFcfa: 450000, status: 'PENDING_VERIFICATION', periodStart: '2026-06-01', periodEnd: '2026-06-30' },
  { id: 'rec-3', declarationId: 'decl-3', marketeurOrgId: 'org-5', declaredVolumeKg: 42000, trackedVolumeKg: 44520, trackedBottlesOut: 3600, trackedBottlesIn: 150, gapKg: +2520, gapPct: +6.0, volumeGapKg: 2520, subsidyImpactFcfa: 520000, status: 'REJECTED', periodStart: '2026-07-01', periodEnd: '2026-07-15' },
  { id: 'rec-4', declarationId: 'decl-4', marketeurOrgId: 'org-6', declaredVolumeKg: 28000, trackedVolumeKg: 27720, trackedBottlesOut: 2200, trackedBottlesIn: 80, gapKg: -280, gapPct: -1.0, volumeGapKg: -280, subsidyImpactFcfa: 58000, status: 'VERIFIED', verifiedByAgent: true, verifiedBy: 'user-5', periodStart: '2026-07-01', periodEnd: '2026-07-15' },
]

export const redressements = [
  { id: 'red-1', reconciliationId: 'rec-3', amountFcfa: 1520000, dueDate: '2026-08-30T00:00:00Z', status: 'PENDING', createdAt: '2026-07-16T10:00:00Z' },
  { id: 'red-2', reconciliationId: 'rec-2', amountFcfa: 920000, dueDate: '2026-08-15T00:00:00Z', status: 'PENDING', createdAt: '2026-07-01T14:00:00Z' },
]

export const customRoles = [
  { id: 'crol-1', orgId: 'org-5', name: 'Chef de depot', permissions: { can: ['read:tours', 'write:tours', 'read:declarations'] } },
  { id: 'crol-2', orgId: 'org-5', name: 'Superviseur livraison', permissions: { can: ['read:tours', 'read:scans', 'write:pickups'] } },
  { id: 'crol-3', orgId: 'org-6', name: 'Responsable qualité', permissions: { can: ['read:declarations', 'write:declarations', 'read:anomalies'] } },
  { id: 'crol-4', orgId: 'org-6', name: 'Operateur saisie', permissions: { can: ['read:declarations', 'write:declarations'] } },
  { id: 'crol-5', orgId: 'org-1', name: 'Dispatcher', permissions: { can: ['read:tours', 'write:tours', 'read:trucks'] } },
  { id: 'crol-6', orgId: 'org-2', name: 'Gestionnaire flotte', permissions: { can: ['read:vehicles', 'write:vehicles', 'read:drivers'] } },
]

export const userAssignments = [
  { id: 'uasn-1', userId: 'user-5', siteId: 'site-3', isPrimary: true },
  { id: 'uasn-2', userId: 'user-5', siteId: 'site-5', isPrimary: false },
  { id: 'uasn-3', userId: 'user-6', siteId: 'site-4', isPrimary: true },
  { id: 'uasn-4', userId: 'user-6', siteId: 'site-6', isPrimary: false },
  { id: 'uasn-5', userId: 'user-7', siteId: 'site-3', isPrimary: false },
  { id: 'uasn-6', userId: 'user-7', siteId: 'site-7', isPrimary: true },
]

export const userCustomRoles = [
  { id: 'ucrl-1', userId: 'user-6', customRoleId: 'crol-1' },
  { id: 'ucrl-2', userId: 'user-6', customRoleId: 'crol-2', siteId: 'site-4' },
  { id: 'ucrl-3', userId: 'user-5', customRoleId: 'crol-5' },
]

export const notificationGroups = [
  { id: 'ng-1', name: 'Equipe technique (IT)', type: 'TECHNICAL', members: ['user-3', 'user-4'], memberIds: ['user-3', 'user-4'], isActive: true },
  { id: 'ng-2', name: 'Cellule investigation fraude', type: 'INVESTIGATION', members: ['user-5', 'user-1', 'user-2'], memberIds: ['user-5', 'user-1', 'user-2'], isActive: true },
  { id: 'ng-3', name: 'Support PDA & RFID', type: 'TECHNICAL', members: ['user-4'], memberIds: ['user-4'], isActive: true },
  { id: 'ng-4', name: 'Verification declarations', type: 'INVESTIGATION', members: ['user-5', 'user-2'], memberIds: ['user-5', 'user-2'], isActive: true },
]

export const notificationRules = [
  { id: 'nr-1', anomalyType: 'PDA_UNSYNCED', minSeverity: 'medium', targetGroupId: 'ng-3' },
  { id: 'nr-2', anomalyType: 'RFID_TAMPERED', minSeverity: 'high', targetGroupId: 'ng-2' },
  { id: 'nr-3', anomalyType: 'WEIGHT_DISCREPANCY', minSeverity: 'medium', targetGroupId: 'ng-2' },
  { id: 'nr-4', anomalyType: 'GPS_SIGNAL_LOST', minSeverity: 'low', targetGroupId: 'ng-1' },
  { id: 'nr-5', anomalyType: 'DECLARATION_GAP', minSeverity: 'medium', targetGroupId: 'ng-4' },
  { id: 'nr-6', anomalyType: 'VEHICLE_OVERSPEED', minSeverity: 'low', targetGroupId: 'ng-1' },
]

export const risks = [
  { id: 'rsk-1', entityType: 'MARKETEUR', entityId: 'org-5', score: 75, level: 'ELEVE', periodStart: '2026-06-24T00:00:00Z', periodEnd: '2026-07-24T00:00:00Z', modelVersion: 'linear-regression-v3', details: { volumeGapRatio: 0.042, deviationKm: 12.5, missedCheckpoints: 3, syncFailures: 1 }, factors: { declaration_gap: 0.8, anomaly_count: 0.6, fraud_history: 0.85 }, computedAt: '2026-07-24T00:00:00Z' },
  { id: 'rsk-2', entityType: 'MARKETEUR', entityId: 'org-6', score: 45, level: 'MODERE', periodStart: '2026-06-24T00:00:00Z', periodEnd: '2026-07-24T00:00:00Z', modelVersion: 'linear-regression-v3', details: { volumeGapRatio: 0.018, deviationKm: 5.2, missedCheckpoints: 1, syncFailures: 0 }, factors: { declaration_gap: 0.3, anomaly_count: 0.4, fraud_history: 0.65 }, computedAt: '2026-07-24T00:00:00Z' },
  { id: 'rsk-3', entityType: 'TRANSPORTEUR', entityId: 'org-1', score: 30, level: 'FAIBLE', periodStart: '2026-06-24T00:00:00Z', periodEnd: '2026-07-24T00:00:00Z', modelVersion: 'linear-regression-v3', details: { onTimeRate: 0.92, incidentCount: 2, maintenanceGaps: 0 }, factors: { gps_drift: 0.2, late_delivery: 0.35, maintenance: 0.35 }, computedAt: '2026-07-24T00:00:00Z' },
  { id: 'rsk-4', entityType: 'TRANSPORTEUR', entityId: 'org-3', score: 82, level: 'CRITIQUE', periodStart: '2026-06-24T00:00:00Z', periodEnd: '2026-07-24T00:00:00Z', modelVersion: 'linear-regression-v3', details: { onTimeRate: 0.65, incidentCount: 8, maintenanceGaps: 3 }, factors: { gps_drift: 0.7, late_delivery: 0.55, maintenance: 0.55 }, computedAt: '2026-07-24T00:00:00Z' },
  { id: 'rsk-5', entityType: 'SITE', entityId: 'site-8', score: 88, level: 'CRITIQUE', periodStart: '2026-06-24T00:00:00Z', periodEnd: '2026-07-24T00:00:00Z', modelVersion: 'linear-regression-v3', details: { geoConfidence: 0.42, scanGaps: 12, daysSinceVerification: 95 }, factors: { geo_confidence: 0.9, scan_gaps: 0.75, site_verification: 0.8 }, computedAt: '2026-07-24T00:00:00Z' },
  { id: 'rsk-6', entityType: 'LIVREUR', entityId: 'user-7', score: 22, level: 'FAIBLE', periodStart: '2026-06-24T00:00:00Z', periodEnd: '2026-07-24T00:00:00Z', modelVersion: 'linear-regression-v3', details: { scanAccuracy: 0.98, gpsDrift: 0.1, completedTours: 42 }, factors: { performance: 0.95, reliability: 0.98 }, computedAt: '2026-07-24T00:00:00Z' },
  { id: 'rsk-7', entityType: 'TOURNEE', entityId: 'tour-4', score: 55, level: 'MODERE', periodStart: '2026-07-23T00:00:00Z', periodEnd: '2026-07-23T23:59:59Z', modelVersion: 'linear-regression-v3', details: { skippedCheckpoints: 1, lateArrivals: 0, scanAnomalies: 0 }, factors: { compliance: 0.6, timeliness: 0.5 }, computedAt: '2026-07-24T00:00:00Z' },
]

export const auditLogs = [
  { id: 'log-1', userId: 'user-1', table: 'Sites', action: 'UPDATE', entityId: 'site-1', changes: { status: { from: 'PENDING_GEO_ASSIGN', to: 'ACTIVE' } }, timestamp: '2026-07-20T08:00:00Z' },
  { id: 'log-2', userId: 'user-2', table: 'Users', action: 'CREATE', entityId: 'user-8', changes: { email: 'nouveau@lpg.cm', role: 'AGENT' }, timestamp: '2026-07-20T09:30:00Z' },
  { id: 'log-3', userId: 'user-5', table: 'Sites', action: 'UPDATE', entityId: 'site-3', changes: { isVerifiedByAgent: { from: false, to: true } }, timestamp: '2026-07-20T11:00:00Z' },
  { id: 'log-4', userId: 'user-1', table: 'Organizations', action: 'UPDATE', entityId: 'org-5', changes: { isActive: { from: true, to: false } }, timestamp: '2026-07-21T08:15:00Z' },
  { id: 'log-5', userId: 'user-2', table: 'Declarations', action: 'UPDATE', entityId: 'decl-1', changes: { status: { from: 'submitted', to: 'validated' } }, timestamp: '2026-07-21T10:45:00Z' },
  { id: 'log-6', userId: 'user-5', table: 'Tours', action: 'UPDATE', entityId: 'tour-1', changes: { status: { from: 'in_progress', to: 'completed' } }, timestamp: '2026-07-21T14:30:00Z' },
  { id: 'log-7', userId: 'user-3', table: 'Trucks', action: 'UPDATE', entityId: 'trk-3', changes: { status: { from: 'active', to: 'maintenance' } }, timestamp: '2026-07-22T07:00:00Z' },
  { id: 'log-8', userId: 'user-1', table: 'Anomalies', action: 'UPDATE', entityId: 'ano-1', changes: { resolved: { from: false, to: true } }, timestamp: '2026-07-22T09:20:00Z' },
  { id: 'log-9', userId: 'user-6', table: 'Pickups', action: 'CREATE', entityId: 'pck-3', changes: { requestedQuantityKg: 15000, status: 'PENDING' }, timestamp: '2026-07-23T08:00:00Z' },
  { id: 'log-10', userId: 'user-5', table: 'Reconciliations', action: 'UPDATE', entityId: 'rec-1', changes: { status: { from: 'PENDING_VERIFICATION', to: 'VERIFIED' } }, timestamp: '2026-07-23T11:30:00Z' },
]

export const vehicleTypes = [
  { id: 'vt-1', name: 'Camion citerne VRAC', code: 'VRAC', description: 'Camion citerne pour transport de GPL en vrac (liquide sous pression)' },
  { id: 'vt-2', name: 'Camion plateau bouteilles', code: 'BOTTLE', description: 'Camion plateau pour transport de bouteilles GPL 12.5kg et 50kg' },
  { id: 'vt-3', name: 'Camion mixte', code: 'MIXED', description: 'Camion pouvant transporter à la fois du vrac et des bouteilles' },
]

export const deliveryTypes = [
  { id: 'dt-1', name: 'Livraison vrac station service', code: 'VRAC_STATION', description: 'Livraison GPL vrac vers une station-service' },
  { id: 'dt-2', name: 'Livraison bouteilles B2B', code: 'BTL_B2B', description: 'Livraison de bouteilles 50kg vers des clients professionnels' },
  { id: 'dt-3', name: 'Livraison bouteilles ménage', code: 'BTL_HOME', description: 'Livraison de bouteilles 12.5kg vers des points de vente détail' },
]

export const tourStatuses = [
  { id: 'ts-1', name: 'Planifiée', code: 'PLANNED', color: 'slate' },
  { id: 'ts-2', name: 'En cours', code: 'IN_PROGRESS', color: 'sky' },
  { id: 'ts-3', name: 'Terminée', code: 'COMPLETED', color: 'emerald' },
  { id: 'ts-4', name: 'Annulée', code: 'CANCELLED', color: 'rose' },
  { id: 'ts-5', name: 'Incident', code: 'INCIDENT', color: 'amber' },
]
