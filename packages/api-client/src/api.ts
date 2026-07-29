import type { ApiAdapter, AuthResult, AuthUser, Credentials } from './adapter.ts'
import { createResourceService } from './resource.ts'

export function createAuthService(adapter: ApiAdapter) {
  return {
    login(creds: Credentials): Promise<AuthResult> {
      return adapter.login(creds)
    },
    refresh(refreshToken: string): Promise<AuthResult> {
      return adapter.refresh(refreshToken)
    },
    logout(refreshToken: string): Promise<void> {
      return adapter.request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }), headers: { 'Content-Type': 'application/json' } })
    },
    me(): Promise<AuthUser> {
      return adapter.request<AuthUser>('/me')
    },
    getPermissions<T = any>(): Promise<T> {
      return adapter.request<T>('/me/permissions')
    },
    updateProfile(body: { firstName?: string; lastName?: string; password?: string }): Promise<AuthUser> {
      return adapter.request<AuthUser>('/me', { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
  }
}

export function createApi(adapter: ApiAdapter) {
  const request = <T>(path: string, init?: Record<string, unknown>): Promise<T> =>
    adapter.request<T>(path, init as any)

  return {
    auth: createAuthService(adapter),

    // ---- Core CRUD Resources ----
    organizations: createResourceService<any>(adapter, 'organizations'),
    users: createResourceService<any>(adapter, 'users'),
    sites: createResourceService<any>(adapter, 'sites'),
    vehicles: createResourceService<any>(adapter, 'vehicles'),
    tours: createResourceService<any>(adapter, 'tours'),
    declarations: createResourceService<any>(adapter, 'declarations'),
    anomalies: createResourceService<any>(adapter, 'anomalies'),
    reports: createResourceService<any>(adapter, 'reports'),
    pda: createResourceService<any>(adapter, 'pda-devices'),
    infra: createResourceService<any>(adapter, 'infra'),
    transporters: createResourceService<any>(adapter, 'transporters'),
    drivers: createResourceService<any>(adapter, 'drivers'),
    rfidTags: createResourceService<any>(adapter, 'rfid-tags'),
    pickups: createResourceService<any>(adapter, 'pickups'),
    reconciliations: createResourceService<any>(adapter, 'reconciliations'),
    redressements: createResourceService<any>(adapter, 'redressements'),
    customRoles: createResourceService<any>(adapter, 'custom-roles'),
    userAssignments: createResourceService<any>(adapter, 'user-assignments'),
    userCustomRoles: createResourceService<any>(adapter, 'user-custom-roles'),
    notificationGroups: createResourceService<any>(adapter, 'notification-groups'),
    notificationRules: createResourceService<any>(adapter, 'notification-rules'),
    risks: createResourceService<any>(adapter, 'risks'),
    auditLogs: createResourceService<any>(adapter, 'audit-logs'),
    vehicleTypes: createResourceService<any>(adapter, 'vehicle-types'),
    deliveryTypes: createResourceService<any>(adapter, 'delivery-types'),
    tourStatuses: createResourceService<any>(adapter, 'tour-statuses'),

    // ---- Organizations ----
    orgStats(id: string) {
      return request<any>(`/organizations/${id}/stats`)
    },

    // ---- Sites ----
    sitesNearest(lat: number, lng: number) {
      return request<any>(`/sites/nearest?lat=${lat}&lng=${lng}`)
    },
    sitesAutoAssignGeo(id: string) {
      return request<any>(`/sites/${id}/auto-assign-geo`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
    },
    sitesVerify(id: string, notes?: string) {
      return request<any>(`/sites/${id}/verify`, { method: 'POST', body: JSON.stringify({ notes }), headers: { 'Content-Type': 'application/json' } })
    },
    sitesSuspend(id: string, reason: string) {
      return request<any>(`/sites/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Users ----
    usersResetPassword(id: string, newPassword?: string) {
      return request<any>(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Vehicles ----
    getVehicleCertificate(id: string) {
      return request<any>(`/vehicles/${id}/certificate`)
    },

    // ---- PDA ----
    pdaAssign(id: string, livreurUserId: string) {
      return request<any>(`/pda-devices/${id}/assign`, { method: 'POST', body: JSON.stringify({ livreurUserId }), headers: { 'Content-Type': 'application/json' } })
    },
    pdaSyncUpload(body: any) {
      return request<any>('/pda-sync', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- RFID Tags ----
    rfidCreateBulk(tags: any[]) {
      return request<any>('/rfid-tags', { method: 'POST', body: JSON.stringify(tags), headers: { 'Content-Type': 'application/json' } })
    },
    rfidBlock(id: string, reason: string) {
      return request<any>(`/rfid-tags/${id}/block`, { method: 'POST', body: JSON.stringify({ reason }), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Pickups ----
    pickupVehicles(id: string) {
      return request<any>(`/pickups/${id}/vehicles`)
    },
    pickupAssignVehicles(id: string, vehicleIds: string[]) {
      return request<any>(`/pickups/${id}/assign-vehicles`, { method: 'POST', body: JSON.stringify({ vehicleIds }), headers: { 'Content-Type': 'application/json' } })
    },
    pickupValidate(id: string, approvedQuantityKg: number) {
      return request<any>(`/pickups/${id}/validate`, { method: 'PATCH', body: JSON.stringify({ approvedQuantityKg }), headers: { 'Content-Type': 'application/json' } })
    },
    pickupStart(id: string, body: { vehicleId: string; driverId: string; livreurUserId: string }) {
      return request<any>(`/pickups/${id}/start`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    pickupComplete(id: string, arrivalProofPhotoUrl?: string) {
      return request<any>(`/pickups/${id}/complete`, { method: 'POST', body: JSON.stringify({ arrivalProofPhotoUrl }), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Tours ----
    getTour(id: string) {
      return request<any>(`/tours/${id}`)
    },
    tourStart(id: string, body: { startedAt: string; initialLat: number; initialLng: number }) {
      return request<any>(`/tours/${id}/start`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    tourClose(id: string, body: { closedAt: string }) {
      return request<any>(`/tours/${id}/close`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    tourReplay(id: string) {
      return request<any>(`/tours/${id}/replay`)
    },

    // ---- Checkpoints ----
    checkpointReach(id: string, body: { actualLat: number; actualLng: number }) {
      return request<any>(`/checkpoints/${id}/reach`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    checkpointSkip(id: string, reason: string) {
      return request<any>(`/checkpoints/${id}/skip`, { method: 'POST', body: JSON.stringify({ reason }), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Scans ----
    recordScan(body: any) {
      return request<any>('/scans', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Declarations ----
    declarationReconcile(id: string) {
      return request<any>(`/declarations/${id}/reconcile`)
    },

    // ---- Reconciliations ----
    reconciliationVerify(id: string, notes?: string) {
      return request<any>(`/reconciliations/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ notes }), headers: { 'Content-Type': 'application/json' } })
    },
    reconcileCreateRedressement(id: string, body: { amountFcfa: number; dueDate: string }) {
      return request<any>(`/reconciliations/${id}/redressement`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Redressements ----
    redressementPay(id: string, transactionRef: string) {
      return request<any>(`/redressements/${id}/pay`, { method: 'PATCH', body: JSON.stringify({ transactionRef }), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Anomalies ----
    anomalyAssign(id: string, assignedToUserId?: string) {
      return request<any>(`/anomalies/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedToUserId }), headers: { 'Content-Type': 'application/json' } })
    },
    anomalyResolve(id: string, resolutionNotes: string) {
      return request<any>(`/anomalies/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolutionNotes }), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Risks ----
    recomputeRisks(entityId?: string) {
      return request<any>('/risks/recompute', { method: 'POST', body: JSON.stringify({ entityId }), headers: { 'Content-Type': 'application/json' } })
    },

    // ---- Dashboards ----
    dashboard(role: string) {
      return request<any>(`/dashboard/${role}`)
    },

    // ---- Reports ----
    reportOperational(params?: Record<string, string>) {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<any>(`/reports/operational${qs}`)
    },
    reportFinancial(params?: Record<string, string>) {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<any>(`/reports/financial${qs}`)
    },
    reportCompliance() {
      return request<any>('/reports/compliance')
    },

    // ---- System ----
    systemHealth() {
      return request<any>('/system/health')
    },
    systemMetrics() {
      return request<any>('/system/metrics')
    },
  }
}
