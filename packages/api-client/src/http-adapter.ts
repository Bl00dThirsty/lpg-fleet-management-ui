import axios, { type AxiosInstance } from 'axios'
import type { ApiEnvelope } from '@lpg/types'
import type { ApiAdapter, ApiPagination, AuthResult, Credentials, ListResult, RequestOptions } from './adapter.ts'
import { fakeAdapter } from './fake-adapter.ts'

type AccessTokenGetter = () => string | null
type UnauthorizedHandler = () => void

function resolveBaseURL(override?: string): string {
  let url = override || (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:18080/api/v1'
  url = url.trim().replace(/\/+$/, '')
  if (url.includes('/v1/api')) {
    url = url.replace(/\/v1\/api/, '/api/v1')
  }
  return url
}

/* ══════════════════════════════════════════════════════════════════════════
   Endpoint contract — frontend resource path → Spring Boot path.
   `createResourceService` builds paths from the DOMAIN name, which is not
   always the path the services expose. Every divergence is declared here.
   ══════════════════════════════════════════════════════════════════════════ */

/** Collections whose list path differs from the domain name. */
const LIST_PATH_ALIASES: Record<string, { path: string; params?: Record<string, string> }> = {
  // user-service maps PersonController on `@GetMapping("/")`: without
  // the trailing slash Spring MVC answers 404, it does not redirect.
  '/users': { path: '/users/' },
  '/permissions': { path: '/permissions/' },
  '/roles': { path: '/roles/' },
  '/groups': { path: '/groups/' },
  // organization-service has no /clients controller: a client IS an
  // organization whose type is CLIENT.
  '/clients': { path: '/organizations', params: { type: 'CLIENT' } },
  // user-service has no /drivers controller: a driver IS a person.
  '/drivers': { path: '/users/' },
  // user-service has no /custom-roles controller: a custom role is a
  // non-system row of /roles/.
  '/custom-roles': { path: '/roles/' },
  // audit-service exposes /audit/modifications, not /audit-logs.
  '/audit-logs': { path: '/audit/modifications' },
}

/**
 * Sub-path rewrites. NOTE: '/scan-events' is deliberately ABSENT — it must
 * stay on tour-service (POST /scan-events, POST /scan-events/bulk for PDA
 * evidence). Cylinder reads live under '/scans' via the explicit `scans`
 * resource. A previous '/scan-events' -> '/scans' alias rewrote bulk
 * uploads to cylinder-service /scans/bulk (404).
 */
const PREFIX_PATH_ALIASES: Record<string, string> = {
  '/rfid-tags': '/rfid',
  '/transporter-contracts': '/contracts',
  '/pickup-requests': '/pickups',
  '/delivery-tours': '/tours',
  '/clients': '/organizations',
  '/drivers': '/users',
  '/custom-roles': '/roles',
  '/audit-logs': '/audit',
}

/**
 * Collections the Spring backend does not expose at all. They resolve to
 * an empty page and one console warning instead of a gateway 500.
 */
const UNIMPLEMENTED_LIST_PATHS = new Set([
  '/regions',
  '/system-roles',
  '/settings',
  '/reports',
  '/notifications',
  '/anomalies',
  '/anomaly-assignments',
  '/notification-groups',
  '/notification-group-members',
  '/notification-rules',
  '/user-site-assignments',
  '/user-custom-roles',
  '/risk-scores',
  '/system/health',
  '/system/metrics',
])

const warnedUnimplemented = new Set<string>()

export function rewritePath(rawPath: string): { path: string; unimplemented?: boolean } {
  const [rawPathname = '', search = ''] = rawPath.split('?')
  const pathname = rawPathname
  const query = new URLSearchParams(search)

  if (UNIMPLEMENTED_LIST_PATHS.has(pathname)) {
    if (!warnedUnimplemented.has(pathname)) {
      warnedUnimplemented.add(pathname)
      console.warn(`[api-client] "${pathname}" is not exposed by the Spring backend yet — returning an empty page.`)
    }
    return { path: pathname, unimplemented: true }
  }

  let target: string | undefined
  const listAlias = LIST_PATH_ALIASES[pathname]
  if (listAlias) {
    target = listAlias.path
    if (listAlias.params) {
      for (const [k, v] of Object.entries(listAlias.params)) query.set(k, v)
    }
  } else {
    for (const [from, to] of Object.entries(PREFIX_PATH_ALIASES)) {
      if (pathname === from || pathname.startsWith(`${from}/`)) {
        target = `${to}${pathname.slice(from.length)}`
        break
      }
    }
  }

  const resolved = target ?? pathname
  const qs = query.toString()
  return { path: qs ? `${resolved}?${qs}` : resolved }
}

/* ══════════════════════════════════════════════════════════════════════════
   Backend (camelCase Spring DTOs) → frontend (@lpg/types snake_case).
   Every mapper accepts both casings and never invents business values:
   unknown enums fall back to documented defaults, missing coords stay null.
   ══════════════════════════════════════════════════════════════════════════ */

function normalizeRegion(raw: unknown): any {
  const s = String(raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  const known = new Set(['ADAMAOUA', 'CENTRE', 'EST', 'EXTREMENORD', 'LITTORAL', 'NORD', 'NORDOUEST', 'OUEST', 'SUD', 'SUDOUEST'])
  if (known.has(s)) return s
  if (s.startsWith('EXTREME')) return 'EXTREMENORD'
  if (s.startsWith('NORDOUEST')) return 'NORDOUEST'
  if (s.startsWith('SUDOUEST')) return 'SUDOUEST'
  return 'CENTRE'
}

function toGeoPoint(lng: unknown, lat: unknown): [number, number] | null {
  const x = Number(lng)
  const y = Number(lat)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  if (x === 0 && y === 0) return null // null-island guard: treat as unknown
  return [x, y]
}

export function mapBackendSiteToSite(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  return {
    id: raw.id ?? raw.siteId ?? raw.site_id,
    code: raw.code,
    site_id: raw.siteId ?? raw.site_id,
    org_id: raw.organizationId ?? raw.org_id ?? '',
    region: normalizeRegion(raw.region),
    name: raw.name ?? '',
    address: raw.addressLine1 ?? raw.address,
    city: raw.city,
    geo_point: toGeoPoint(raw.longitude ?? raw.geoLng ?? raw.lng, raw.latitude ?? raw.geoLat ?? raw.lat),
    geofence_radius_meters: raw.geofenceRadiusMeters ?? raw.geofence_radius_meters ?? 200,
    storage_capacity_tons: raw.storageCapacityTons ?? raw.storage_capacity_tons,
    is_verified: raw.verified ?? raw.is_verified ?? false,
    status: raw.status ?? (raw.isOperational === false ? 'SUSPENDED' : 'ACTIVE'),
    is_operational: raw.isOperational ?? raw.is_operational ?? true,
    is_active: raw.active ?? raw.is_active ?? true,
    type: raw.type,
  }
}

export function mapBackendVehicleToVehicle(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  return {
    id: raw.id,
    license_plate: raw.licensePlate ?? raw.license_plate,
    type: raw.type,
    org_id: raw.organizationId ?? raw.org_id ?? '',
    max_volume: raw.maxVolume ?? raw.max_volume,
    max_bottle_count: raw.maxBottleCount ?? raw.max_bottle_count,
    certificate_url: raw.certificateUrl ?? raw.certificate_url,
    certificate_number: raw.certificateNumber ?? raw.certificate_number,
    certificate_expiry_at: raw.certificateExpiryAt ?? raw.certificate_expiry_at,
    tare_weight: raw.tareWeight ?? raw.tare_weight,
    is_active: raw.active ?? raw.is_active ?? true,
    status: raw.status,
    status_description: raw.statusDescription ?? raw.status_description,
  }
}

export function mapBackendDeviceToDevice(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  const backendType = String(raw.deviceType ?? raw.device_type ?? '')
  const type = backendType.includes('PDA') ? 'PDA' : backendType.includes('RFID') ? 'RFIDREADER' : 'GPS'
  return {
    id: raw.id,
    serial_number: raw.serialNumber ?? raw.serial_number,
    device_type: type,
    status: raw.status,
    firmware_version: raw.firmwareVersion ?? raw.firmware_version,
    battery_level: raw.batteryLevel ?? raw.battery_level ?? null,
    battery_critical: raw.batteryCritical ?? raw.battery_critical ?? false,
    last_sync: raw.lastSync ?? raw.last_sync,
    last_known_position: toGeoPoint(raw.lastLongitude ?? raw.last_longitude, raw.lastLatitude ?? raw.last_latitude),
    assigned_to_user_id: raw.assignedToPersonId ?? raw.assigned_to_user_id,
    assigned_to_vehicle_id: raw.assignedToVehicleId ?? raw.assigned_to_vehicle_id,
    org_id: raw.organizationId ?? raw.org_id,
  }
}

export interface TelemetryPoint {
  vehicle_id: string
  lat: number
  lng: number
  speed?: number | null
  heading?: number | null
  battery_level?: number | null
  timestamp: string
}

export function mapBackendTelemetryToPoint(raw: any): TelemetryPoint | null {
  if (!raw || typeof raw !== 'object') return null
  const lat = Number(raw.latitude ?? raw.lat)
  const lng = Number(raw.longitude ?? raw.lng ?? raw.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    vehicle_id: String(raw.vehicleId ?? raw.vehicle_id ?? ''),
    lat,
    lng,
    speed: raw.speed ?? null,
    heading: raw.heading ?? null,
    battery_level: raw.batteryLevel ?? raw.battery_level ?? null,
    timestamp: String(raw.timestamp ?? ''),
  }
}

export function mapBackendScanToScanEvent(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  return {
    id: raw.id,
    checkpoint_id: raw.checkpointId ?? raw.checkpoint_id,
    livreur_user_id: raw.livreurUserId ?? raw.livreur_user_id,
    rfid_tag_id: raw.rfidTagId ?? raw.rfid_tag_id,
    direction: raw.direction,
    geo_point: toGeoPoint(
      raw.geoLng ?? raw.longitude ?? raw.lng,
      raw.geoLat ?? raw.latitude ?? raw.lat,
    ),
    timestamp: raw.timestamp,
    meter_reading: raw.meterReading ?? raw.meter_reading,
    photo_url: raw.photoUrl ?? raw.photo_url,
    pda_sync_id: raw.pdaSyncId ?? raw.pda_sync_id,
  }
}

export function mapBackendCheckpointToCheckpoint(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  return {
    id: raw.id,
    tournee_id: raw.tourId ?? raw.tour_id ?? '',
    site_id: raw.siteId ?? raw.site_id,
    client_site_id: raw.clientSiteId ?? raw.client_site_id,
    sequence: raw.sequence ?? 0,
    expected_arrival: raw.expectedArrival || raw.expected_arrival,
    actual_arrival: raw.actualArrival || raw.actual_arrival,
    status: raw.status || 'PENDING',
    skip_reason: raw.skipReason || raw.skip_reason,
  }
}

export function mapBackendTourToDeliveryTour(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  return {
    id: raw.id,
    tour_code: raw.tourCode || raw.tour_code,
    marketeur_org_id: raw.marketerOrganizationId || raw.marketeur_org_id,
    execution_mode: raw.executionMode || raw.execution_mode,
    transporter_org_id: raw.transporterOrganizationId || raw.transporter_org_id,
    vehicle_id: raw.vehicleId || raw.vehicle_id,
    driver_id: raw.driverId || raw.driver_id,
    livreur_user_id: raw.driverPersonId || raw.livreurPersonId || raw.livreur_user_id,
    type: raw.type,
    status: raw.status,
    requested_quantity: raw.requestedQuantity ?? raw.requested_quantity ?? 0,
    loaded_quantity: raw.loadedQuantity ?? raw.loaded_quantity,
    delivered_quantity: raw.deliveredQuantity ?? raw.delivered_quantity,
    started_at: raw.startedAt || raw.started_at,
    closed_at: raw.closedAt || raw.closed_at,
  }
}

export function mapBackendPickupToPickupRequest(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  return {
    id: raw.id,
    marketeur_org_id: raw.marketerOrganizationId || raw.marketeur_org_id,
    source_site_id: raw.sourceSiteId || raw.source_site_id,
    destination_site_id: raw.destinationSiteId || raw.destination_site_id,
    requested_quantity: raw.requestedQuantity ?? raw.requested_quantity ?? 0,
    approved_quantity: raw.approvedQuantity ?? raw.approved_quantity,
    status: raw.status || 'DRAFT',
  }
}

export function mapBackendPersonToUser(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  return {
    id: raw.id,
    username: raw.personId ?? raw.username ?? null,
    email: raw.email ?? '',
    first_name: raw.firstName ?? raw.first_name ?? raw.personId ?? '—',
    last_name: raw.lastName ?? raw.last_name ?? '',
    role_codes: Array.isArray(raw.roles)
      ? raw.roles.map((r: any) => (typeof r === 'string' ? r : r?.roleCode)).filter(Boolean)
      : [],
  }
}

export function createHttpAdapter(baseURL?: string): ApiAdapter {
  const client: AxiosInstance = axios.create({
    baseURL: resolveBaseURL(baseURL ?? (import.meta as any).env?.VITE_API_BASE_URL),
    timeout: 20_000,
  })

  let getAccessToken: AccessTokenGetter = () => null
  let onUnauthorized: UnauthorizedHandler = () => {}
  let isRefreshing = false

  client.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      config.headers = config.headers ?? {}
      ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true
        if (!isRefreshing) {
          isRefreshing = true
          try {
            await onUnauthorized()
          } finally {
            isRefreshing = false
          }
        }
        const token = getAccessToken()
        if (token) {
          original.headers = original.headers ?? {}
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        }
      }
      return Promise.reject(error)
    }
  )

  function toApiError(path: string, status?: number, body?: any): Error {
    const message =
      (body && typeof body.message === 'string' && body.message) ||
      (body && typeof body.error === 'string' && body.error) ||
      `Request failed on ${path} (${status || 'no response'})`
    const err = new Error(message)
    ;(err as Error & { status?: number }).status = status
    return err
  }

  async function request<T>(path: string, init?: RequestOptions): Promise<T> {
    const { path: resolved } = rewritePath(path)
    let res
    try {
      res = await client.request<ApiEnvelope<T>>({
        url: resolved,
        method: (init?.method as any) ?? 'GET',
        data: init?.body,
        headers: init?.headers,
      })
    } catch (error: any) {
      throw toApiError(resolved, error?.response?.status, error?.response?.data)
    }
    const body: any = res.data
    if (body && typeof body === 'object' && 'success' in body && body.success === false) {
      throw toApiError(resolved, res.status, body)
    }
    // Envelope: { success, message, data } — fall back to raw body.
    return (body?.data ?? body) as T
  }

  const EMPTY_PAGE = { page: 1, limit: 0, total: 0, pages: 0 } as ApiPagination

  async function requestList<T>(path: string, init?: RequestOptions): Promise<ListResult<T>> {
    const rewritten = rewritePath(path)
    if (rewritten.unimplemented) {
      return { data: [], pagination: EMPTY_PAGE }
    }
    let res
    try {
      res = await client.request<any>({
        url: rewritten.path,
        method: (init?.method as any) ?? 'GET',
        data: init?.body,
        headers: init?.headers,
      })
    } catch (error: any) {
      throw toApiError(rewritten.path, error?.response?.status, error?.response?.data)
    }
    const body: any = res.data
    if (body && typeof body === 'object' && 'success' in body && body.success === false) {
      throw toApiError(rewritten.path, res.status, body)
    }
    const envelope = body?.data ?? body
    // Spring page shapes: { content, totalElements, number, size } or plain arrays.
    const rows: T[] = Array.isArray(envelope)
      ? envelope
      : Array.isArray(envelope?.content)
        ? envelope.content
        : Array.isArray(envelope?.member)
          ? envelope.member
          : []
    const total: number = Array.isArray(envelope)
      ? envelope.length
      : (envelope?.totalElements ?? envelope?.totalCount ?? envelope?.total ?? rows.length ?? 0)
    const page: number = (envelope?.number ?? envelope?.pageNumber ?? 0) + 1
    const limit: number = envelope?.size ?? envelope?.pageSize ?? rows.length
    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        pages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    }
  }

  return {
    request,
    requestList,
    async login(creds: Credentials): Promise<AuthResult> {
      const res = await client.post<ApiEnvelope<AuthResult>>('/auth/login', creds)
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data as AuthResult
    },
    async refresh(refresh_token: string): Promise<AuthResult> {
      const res = await client.post<ApiEnvelope<AuthResult>>('/auth/refresh', { refresh_token })
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data as AuthResult
    },
    setAccessTokenGetter(getter) { getAccessToken = getter },
    setOnUnauthorized(handler) { onUnauthorized = handler },
  }
}

export function createApiAdapter(): ApiAdapter {
  const mode = (import.meta as any).env?.VITE_API_MODE
  if (mode === 'fake') return fakeAdapter
  return createHttpAdapter()
}