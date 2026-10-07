import type { ApiAdapter, AuthResult, AuthUser, Credentials } from './adapter.ts'
import { createResourceService } from './resource.ts'

/**
 * POST /api/v1/scan-events payload. Transcription of the tour-service
 * CreateScanEventDto: exactly one of direction or meterReading, GPS mandatory.
 */
export interface ScanEventPayload {
  checkpointId: string
  livreurUserId: string
  rfidTagId?: string | null
  direction?: 'IN' | 'OUT' | null
  geoLng: number
  geoLat: number
  meterReading?: number | null
  photoUrl?: string | null
  pdaSyncId?: string | null
  timestamp?: string | null
}

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

    // Users (extended): create-with-auth provisions a login account in the
    // same atomic operation as the person row. The backend
    // (csph-fleet-backend/user-service) maps this on
    // POST /api/v1/users/with-auth and requires CreatePersonWithAuthRequest.
    usersCreateWithAuth(body: any) {
      return request<any>('/users/with-auth', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
    },
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
    activityStatuses: createResourceService<any>(adapter, 'activity-statuses'),
    systemRoles: createResourceService<any>(adapter, 'system-roles'),
    settings: createResourceService<any>(adapter, 'settings'),
    auditLogs: createResourceService<any>(adapter, 'audit-logs'),
    reports: createResourceService<any>(adapter, 'reports'),

    // Sites
    sitesNearest(lat: number, lng: number) {
      return request<any>(`/sites/nearest?lat=${lat}&lng=${lng}`)
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

    // Pickup requests (Flux 1 Approvisionnements - Spring Boot tour-service)
    pickups: {
      list(page = 0, size = 50, filters?: { marketerOrganizationId?: string; sourceSiteId?: string; status?: string }) {
        const query = new URLSearchParams({ page: String(page), size: String(size) })
        if (filters?.marketerOrganizationId) query.set('marketerOrganizationId', filters.marketerOrganizationId)
        if (filters?.sourceSiteId) query.set('sourceSiteId', filters.sourceSiteId)
        if (filters?.status) query.set('status', filters.status)
        return adapter.requestList<any>(`/pickups?${query.toString()}`)
      },
      get(id: string) {
        return request<any>(`/pickups/${id}`)
      },
      create(body: any) {
        return request<any>('/pickups', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        })
      },
      update(id: string, body: any) {
        return request<any>(`/pickups/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        })
      },
      approve(id: string, approvedQuantity: number) {
        return request<any>(`/pickups/${id}/approve?approvedQuantity=${approvedQuantity}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      reject(id: string) {
        return request<any>(`/pickups/${id}/reject`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      delete(id: string) {
        return request<void>(`/pickups/${id}`, { method: 'DELETE' })
      },
    },

    // Legacy pickup helpers
    pickupValidate(id: string, approved_quantity: number) {
      return request<any>(`/pickups/${id}/approve?approvedQuantity=${approved_quantity}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } })
    },
    pickupComplete(id: string) {
      return request<any>(`/pickups/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'COMPLETED' }), headers: { 'Content-Type': 'application/json' } })
    },

    // Delivery tours (Spring Boot tour-service lifecycle).
    //
    // Chain: DRAFT -> PLANNED -> INPROGRESS -> CHECKPOINTACTIVE -> CLOSED
    // (INTERNAL), with PENDINGTRANSPORTERACK -> ACKNOWLEDGED inserted after
    // PLANNED for EXTERNAL. Every transition below is a real endpoint; the old
    // `/validate` fused arrival with completion and is deleted server-side.
    tours: {
      list(page = 0, size = 50) {
        return adapter.requestList<any>(`/tours?page=${page}&size=${size}`)
      },
      get(id: string) {
        return request<any>(`/tours/${id}`)
      },
      create(body: any) {
        return request<any>('/tours', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        })
      },
      plan(id: string) {
        return request<any>(`/tours/${id}/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      sendToTransporter(id: string) {
        return request<any>(`/tours/${id}/send-to-transporter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      acknowledge(id: string, body?: any) {
        return request<any>(`/tours/${id}/acknowledge`, {
          method: 'POST',
          body: body ? JSON.stringify(body) : undefined,
          headers: { 'Content-Type': 'application/json' },
        })
      },
      update(id: string, body: any) {
        return request<any>(`/tours/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        })
      },
      delete(id: string) {
        return request<void>(`/tours/${id}`, { method: 'DELETE' })
      },
      start(id: string) {
        return request<any>(`/tours/${id}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      close(id: string, loadedQuantity?: number, deliveredQuantity?: number) {
        const query = new URLSearchParams()
        if (loadedQuantity != null) query.set('loadedQuantity', String(loadedQuantity))
        if (deliveredQuantity != null) query.set('deliveredQuantity', String(deliveredQuantity))
        const qStr = query.toString() ? `?${query.toString()}` : ''
        return request<any>(`/tours/${id}/close${qStr}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      cancel(id: string, reason?: string) {
        const qStr = reason ? `?reason=${encodeURIComponent(reason)}` : ''
        return request<any>(`/tours/${id}/cancel${qStr}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      assignDriver(id: string, driverId?: string, driverPersonId?: string) {
        const query = new URLSearchParams()
        if (driverId) query.set('driverId', driverId)
        if (driverPersonId) query.set('driverPersonId', driverPersonId)
        const qStr = query.toString() ? `?${query.toString()}` : ''
        return request<any>(`/tours/${id}/assign-driver${qStr}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      assignVehicle(id: string, vehicleId: string) {
        return request<any>(`/tours/${id}/assign-vehicle?vehicleId=${encodeURIComponent(vehicleId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      getCheckpoints(tourId: string) {
        return request<any[]>(`/tours/${tourId}/checkpoints`)
      },
      addCheckpoint(tourId: string, checkpoint: any) {
        return request<any>(`/tours/${tourId}/checkpoints`, {
          method: 'POST',
          body: JSON.stringify(checkpoint),
          headers: { 'Content-Type': 'application/json' },
        })
      },
      // PENDING -> REACHED. Records the arrival instant; the server promotes
      // the tour to CHECKPOINTACTIVE on first arrival. Bodyless by design.
      reachCheckpoint(checkpointId: string) {
        return request<any>(`/checkpoints/${checkpointId}/reach`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      // REACHED -> COMPLETED. Bodyless by design. This replaces
      // validateCheckpoint (`/tours/checkpoints/{id}/validate`), which never
      // existed server-side and 404'd on every call.
      completeCheckpoint(checkpointId: string) {
        return request<any>(`/checkpoints/${checkpointId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
      skipCheckpoint(checkpointId: string, reason: string) {
        return request<any>(`/checkpoints/${checkpointId}/skip?reason=${encodeURIComponent(reason)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },

    // Legacy tour helpers
    tourStart(id: string, body?: { started_at?: string; lat?: number; lng?: number }) {
      return request<any>(`/tours/${id}/start`, { method: 'POST', body: JSON.stringify(body || {}), headers: { 'Content-Type': 'application/json' } })
    },
    tourClose(id: string, body?: { closed_at?: string; loadedQuantity?: number; deliveredQuantity?: number }) {
      return request<any>(`/tours/${id}/close`, { method: 'POST', body: JSON.stringify(body || {}), headers: { 'Content-Type': 'application/json' } })
    },
    tourReplay(id: string) {
      return request<any>(`/tours/${id}/replay`)
    },

    // Scan events (tour-service; the gateway routes /scan-events/** there, NOT
    // to cylinder-service). Single create + bulk resync share the
    // CreateScanEvent shape: exactly one of direction (IN/OUT) or meterReading
    // (VRAC, >= 0), GPS mandatory, UUIDs as strings.
    recordScan(body: ScanEventPayload) {
      return request<any>('/scan-events', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    bulkScanUpload(items: ScanEventPayload[]) {
      return request<any>('/scan-events/bulk', { method: 'POST', body: JSON.stringify({ items }), headers: { 'Content-Type': 'application/json' } })
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