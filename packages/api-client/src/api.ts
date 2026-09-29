import type { ApiAdapter, AuthResult, AuthUser, Credentials } from './adapter.ts'
import { createResourceService } from './resource.ts'

export function createAuthService(adapter: ApiAdapter) {
  return {
    login(creds: Credentials): Promise<AuthResult> {
      return adapter.login(creds)
    },
    refresh(refresh_token: string): Promise<AuthResult> {
      return adapter.refresh(refresh_token)
    },
    logout(refresh_token: string): Promise<void> {
      return adapter.request<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token }),
        headers: { 'Content-Type': 'application/json' },
      })
    },
    me(): Promise<AuthUser> {
      return adapter.request<AuthUser>('/me')
    },
    getPermissions<T = unknown>(): Promise<T> {
      return adapter.request<T>('/me/permissions')
    },
    updateProfile(body: { first_name?: string; last_name?: string; password?: string }): Promise<AuthUser> {
      return adapter.request<AuthUser>('/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
    },
  }
}

export function createApi(adapter: ApiAdapter) {
  const request = <T>(path: string, init?: Record<string, unknown>): Promise<T> =>
    adapter.request<T>(path, init as any)

  return {
    auth: createAuthService(adapter),

    // Core CRUD resources (snake_case paths, snake_case fields)
    organizations: createResourceService<any>(adapter, 'organizations'),
    users: createResourceService<any>(adapter, 'users'),
    sites: createResourceService<any>(adapter, 'sites'),
    clients: createResourceService<any>(adapter, 'clients'),
    clientSites: createResourceService<any>(adapter, 'client-sites'),
    vehicles: createResourceService<any>(adapter, 'vehicles'),
    drivers: createResourceService<any>(adapter, 'drivers'),
    devices: createResourceService<any>(adapter, 'devices'),
    transporterContracts: createResourceService<any>(adapter, 'transporter-contracts'),
    pickupRequests: createResourceService<any>(adapter, 'pickup-requests'),
    deliveryTours: createResourceService<any>(adapter, 'delivery-tours'),
    checkpoints: createResourceService<any>(adapter, 'checkpoints'),
    scanEvents: createResourceService<any>(adapter, 'scan-events'),
    rfidTags: createResourceService<any>(adapter, 'rfid-tags'),
    declarations: createResourceService<any>(adapter, 'declarations'),
    reconciliations: createResourceService<any>(adapter, 'reconciliations'),
    redressements: createResourceService<any>(adapter, 'redressements'),
    riskScores: createResourceService<any>(adapter, 'risk-scores'),
    anomalies: createResourceService<any>(adapter, 'anomalies'),
    anomalyAssignments: createResourceService<any>(adapter, 'anomaly-assignments'),
    notificationGroups: createResourceService<any>(adapter, 'notification-groups'),
    notificationGroupMembers: createResourceService<any>(adapter, 'notification-group-members'),
    notificationRules: createResourceService<any>(adapter, 'notification-rules'),
    notifications: createResourceService<any>(adapter, 'notifications'),
    customRoles: createResourceService<any>(adapter, 'custom-roles'),
    userSiteAssignments: createResourceService<any>(adapter, 'user-site-assignments'),
    userCustomRoles: createResourceService<any>(adapter, 'user-custom-roles'),
    permissions: createResourceService<any>(adapter, 'permissions'),
    regions: createResourceService<any>(adapter, 'regions'),
    systemRoles: createResourceService<any>(adapter, 'system-roles'),
    settings: createResourceService<any>(adapter, 'settings'),
    auditLogs: createResourceService<any>(adapter, 'audit-logs'),
    reports: createResourceService<any>(adapter, 'reports'),

    // Sites — backend exposes GET /sites/nearby?lat=&lon=&radiusKm (Haversine).
    sitesNearby(lat: number, lon: number, radiusKm = 50) {
      return request<any>(`/sites/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`)
    },
    sitesNearest(lat: number, lng: number) {
      return request<any>(`/sites/nearby?lat=${lat}&lon=${lng}`)
    },
    sitesVerify(id: string, notes?: string) {
      return request<any>(`/sites/${id}/verify`, { method: 'POST', body: JSON.stringify({ notes }), headers: { 'Content-Type': 'application/json' } })
    },
    sitesSuspend(id: string, reason: string) {
      return request<any>(`/sites/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }), headers: { 'Content-Type': 'application/json' } })
    },

    // Users
    usersResetPassword(id: string, new_password?: string) {
      return request<any>(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }), headers: { 'Content-Type': 'application/json' } })
    },

    // Vehicles
    getVehicleCertificate(id: string) {
      return request<any>(`/vehicles/${id}/certificate`)
    },

    // Devices
    deviceAssign(id: string, user_id?: string, vehicle_id?: string) {
      return request<any>(`/devices/${id}/assign`, { method: 'POST', body: JSON.stringify({ user_id, vehicle_id }), headers: { 'Content-Type': 'application/json' } })
    },

    // Pickup requests
    pickupValidate(id: string, approved_quantity: number) {
      return request<any>(`/pickup-requests/${id}/validate`, { method: 'PATCH', body: JSON.stringify({ approved_quantity }), headers: { 'Content-Type': 'application/json' } })
    },
    pickupComplete(id: string) {
      return request<any>(`/pickup-requests/${id}/complete`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
    },

    // Delivery tours
    tourStart(id: string, body: { started_at: string; lat: number; lng: number }) {
      return request<any>(`/delivery-tours/${id}/start`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    tourClose(id: string, body: { closed_at: string }) {
      return request<any>(`/delivery-tours/${id}/close`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    tourReplay(id: string) {
      return request<any>(`/delivery-tours/${id}/replay`)
    },

    // Checkpoints
    checkpointReach(id: string, body: { lat: number; lng: number }) {
      return request<any>(`/checkpoints/${id}/reach`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    checkpointSkip(id: string, reason: string) {
      return request<any>(`/checkpoints/${id}/skip`, { method: 'POST', body: JSON.stringify({ reason }), headers: { 'Content-Type': 'application/json' } })
    },

    // Scan events (tour-service writes; cylinder reads live under /scans)
    scans: createResourceService<any>(adapter, 'scans'),
    recordScan(body: any) {
      return request<any>('/scan-events', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    bulkScanUpload(items: any[]) {
      return request<any>('/scan-events/bulk', { method: 'POST', body: JSON.stringify({ items }), headers: { 'Content-Type': 'application/json' } })
    },

    // Tours (tour-service Flux 2 lifecycle; DRAFT->PLANNED->INPROGRESS->CHECKPOINTACTIVE->CLOSED,
    // EXTERNAL inserts PENDINGTRANSPORTERACK->ACKNOWLEDGED)
    tours: {
      list(page = 0, size = 50, filters?: { driverPersonId?: string; status?: string }) {
        const query = new URLSearchParams({ page: String(page), size: String(size) })
        if (filters?.driverPersonId) query.set('driverPersonId', filters.driverPersonId)
        if (filters?.status) query.set('status', filters.status)
        return adapter.requestList<any>(`/tours?${query.toString()}`)
      },
      get(id: string) {
        return request<any>(`/tours/${id}`)
      },
      checkpoints(tourId: string) {
        return request<any>(`/tours/${tourId}/checkpoints`)
      },
      plan(id: string) {
        return request<any>(`/tours/${id}/plan`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
      },
      sendToTransporter(id: string) {
        return request<any>(`/tours/${id}/send-to-transporter`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
      },
      acknowledge(id: string) {
        return request<any>(`/tours/${id}/acknowledge`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
      },
      start(id: string) {
        return request<any>(`/tours/${id}/start`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
      },
      close(id: string) {
        return request<any>(`/tours/${id}/close`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
      },
      reachCheckpoint(checkpointId: string) {
        return request<any>(`/checkpoints/${checkpointId}/reach`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
      },
      completeCheckpoint(checkpointId: string) {
        return request<any>(`/checkpoints/${checkpointId}/complete`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
      },
    },

    // Pickups (tour-service Flux 1)
    pickups: {
      list(page = 0, size = 50) {
        return adapter.requestList<any>(`/pickups?page=${page}&size=${size}`)
      },
      get(id: string) {
        return request<any>(`/pickups/${id}`)
      },
      approve(id: string, approvedQuantity: number) {
        return request<any>(`/pickups/${id}/approve?approvedQuantity=${approvedQuantity}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } })
      },
      reject(id: string) {
        return request<any>(`/pickups/${id}/reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } })
      },
    },

    // Vehicle telemetry (fleet-device-service)
    telemetry: {
      latest(vehicleId: string) {
        return request<any>(`/telemetry/vehicles/${encodeURIComponent(vehicleId)}/latest`)
      },
      history(vehicleId: string, start?: string, end?: string) {
        const query = new URLSearchParams()
        if (start) query.set('start', start)
        if (end) query.set('end', end)
        const qs = query.toString()
        return request<any>(`/telemetry/vehicles/${encodeURIComponent(vehicleId)}${qs ? `?${qs}` : ''}`)
      },
    },

    // Declarations / reconciliations / redressements
    declarationSubmit(id: string) {
      return request<any>(`/declarations/${id}/submit`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
    },
    declarationReconcile(id: string) {
      return request<any>(`/declarations/${id}/reconcile`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
    },
    reconciliationVerify(id: string, notes?: string) {
      return request<any>(`/reconciliations/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ notes }), headers: { 'Content-Type': 'application/json' } })
    },
    redressementPay(id: string, transaction_ref: string) {
      return request<any>(`/redressements/${id}/mark-paid`, { method: 'PATCH', body: JSON.stringify({ transaction_ref }), headers: { 'Content-Type': 'application/json' } })
    },
    redressementWaive(id: string) {
      return request<any>(`/redressements/${id}/waive`, { method: 'PATCH', body: '{}', headers: { 'Content-Type': 'application/json' } })
    },

    // Anomalies
    anomalyAssign(id: string, assigned_to_user_id?: string) {
      return request<any>(`/anomalies/${id}/assign`, { method: 'POST', body: JSON.stringify({ assigned_to_user_id }), headers: { 'Content-Type': 'application/json' } })
    },
    anomalyResolve(id: string, resolution_notes: string) {
      return request<any>(`/anomalies/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution_notes }), headers: { 'Content-Type': 'application/json' } })
    },

    // Risks
    recomputeRisks(entity_id?: string) {
      return request<any>('/risk-scores/recompute', { method: 'POST', body: JSON.stringify({ entity_id }), headers: { 'Content-Type': 'application/json' } })
    },

    // System
    systemHealth() { return request<any>('/system/health') },
    systemMetrics() { return request<any>('/system/metrics') },
  }
}