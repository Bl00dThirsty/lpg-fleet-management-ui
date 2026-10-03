/**
 * In-memory DB for the mock API. Backed entirely by `curated` from @lpg/mock-data.
 * All entity names and field shapes match the production Postgres schema.
 */

import { curated } from '@lpg/mock-data'
import type { EntityMap, EntityName } from './types.ts'

type Collections = { [K in EntityName]: EntityMap[K][] }

const empty: never[] = []

export const collections: Collections = {
  regions: curated.regions,
  organizations: curated.organizations,
  system_roles: curated.system_roles,
  permissions: curated.permissions,
  users: curated.users,
  user_mfa: curated.user_mfa as any,
  integration_auth: curated.integration_auth as any,
  sites: curated.sites,
  clients: curated.clients,
  client_sites: curated.client_sites,
  user_site_assignments: (curated as any).user_site_assignments ?? (empty as never[]),
  custom_roles: curated.custom_roles,
  user_custom_roles: curated.user_custom_roles,
  vehicles: curated.vehicles,
  drivers: curated.drivers,
  devices: curated.devices,
  transporter_contracts: curated.transporter_contracts,
  pickup_requests: curated.pickup_requests,
  delivery_tours: curated.delivery_tours,
  checkpoints: curated.checkpoints,
  scan_events: curated.scan_events,
  rfid_tags: curated.rfid_tags,
  declarations: curated.declarations,
  reconciliations: curated.reconciliations,
  redressements: curated.redressements,
  risk_scores: curated.risk_scores,
  anomalies: curated.anomalies,
  anomaly_assignments: curated.anomaly_assignments,
  notification_groups: curated.notification_groups,
  notification_group_members: curated.notification_group_members,
  notification_rules: curated.notification_rules,
  notifications: curated.notifications,
  reports: curated.reports,
  audit_logs: curated.audit_logs,
  settings: curated.settings,
}

function ensureCollection(name: EntityName) {
  if (!collections[name]) {
    ;(collections as any)[name] = []
  }
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

export interface ListResult<T> {
  data: T[]
  pagination: { page: number; limit: number; total: number; pages: number }
  aggregations?: AggregationResult
}

export interface QueryOptions {
  page?: number
  limit?: number
  filters?: Record<string, string | number | boolean | undefined>
  search?: string
  sort_by?: string
  order?: 'asc' | 'desc'
  date_from?: string
  date_to?: string
  date_field?: string
  group_by?: string
  sum_field?: string
}

const DATE_FIELDS = new Set([
  'created_at',
  'updated_at',
  'timestamp',
  'period_start',
  'period_end',
  'last_sync',
  'last_login_at',
  'last_known_position',
  'deleted_at',
  'last_auth_at',
  'verified_at',
  'transporter_assigned_at',
  'expected_arrival',
  'actual_arrival',
  'started_at',
  'closed_at',
  'due_date',
  'paid_at',
  'issued_at',
  'resolved_at',
  'read_at',
  'delivered_at',
  'generated_at',
  'expires_at',
])

function parseDate(v: string | undefined): number | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.getTime()
}

function detectDateField(item: Record<string, unknown>, preferred?: string): string | null {
  if (preferred && item[preferred] !== undefined) return preferred
  for (const key of Object.keys(item)) {
    if (DATE_FIELDS.has(key) && typeof item[key] === 'string') return key
  }
  return null
}

export function listEntities<T>(name: EntityName, opts: QueryOptions = {}): ListResult<T> {
  ensureCollection(name)
  let items = collections[name] as unknown as T[]

  const dateField = opts.date_field ?? detectDateField(items[0] as any)
  const dateFrom = parseDate(opts.date_from)
  const dateTo = parseDate(opts.date_to)

  if (dateFrom || dateTo) {
    items = items.filter((item: any) => {
      if (!dateField) return true
      const v = parseDate(item[dateField])
      if (v === null) return true
      if (dateFrom && v < dateFrom) return false
      if (dateTo && v > dateTo) return false
      return true
    })
  }

  if (opts.filters) {
    for (const [key, value] of Object.entries(opts.filters)) {
      if (value !== undefined && value !== null && value !== '') {
        items = items.filter((item: any) => {
          const itemVal = item[key]
          if (itemVal === undefined || itemVal === null) return false
          if (typeof value === 'boolean') return itemVal === value
          return String(itemVal).toLowerCase() === String(value).toLowerCase()
        })
      }
    }
  }

  if (opts.search) {
    const q = opts.search.toLowerCase()
    items = items.filter((item: any) =>
      Object.values(item).some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
    )
  }

  const sortKey = opts.sort_by
  const sortDir = opts.order === 'asc' ? 1 : -1
  if (sortKey) {
    items = [...items].sort((a: any, b: any) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sortDir
      return String(va).localeCompare(String(vb)) * sortDir
    })
  }

  const aggregates = opts.group_by ? computeAggregations(items as any[], opts.group_by) : undefined

  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20))
  const start = (page - 1) * limit
  const total = items.length
  const pages = Math.ceil(total / limit)

  const result: ListResult<T> = {
    data: items.slice(start, start + limit) as T[],
    pagination: { page, limit, total, pages },
  }
  if (aggregates) result.aggregations = aggregates
  return result
}

function computeAggregations(items: any[], field: string): AggregationResult {
  const buckets = new Map<string, { count: number; sum_volume: number; scores: number[] }>()
  for (const item of items) {
    let key: string
    const raw = item[field]
    if (raw === undefined || raw === null) key = 'NONE'
    else if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) key = raw.slice(0, 10)
    else key = String(raw)

    const existing = buckets.get(key) ?? { count: 0, sum_volume: 0, scores: [] }
    existing.count++
    for (const f of ['declared_volume', 'tracked_volume', 'delivered_quantity', 'requested_quantity', 'volume_gap', 'subsidy_impact', 'amount', 'score']) {
      if (typeof item[f] === 'number') existing.sum_volume += item[f]
    }
    if (typeof item.score === 'number') existing.scores.push(item.score)
    buckets.set(key, existing)
  }

  const bucketList: AggregationBucket[] = Array.from(buckets.entries()).map(([key, v]) => ({
    key,
    count: v.count,
    sum_volume: v.sum_volume > 0 ? v.sum_volume : undefined,
    avg_score: v.scores.length > 0
      ? Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 100) / 100
      : undefined,
  }))

  const total_volume = bucketList.reduce((s, b) => s + (b.sum_volume ?? 0), 0)

  return {
    grouped_by: field,
    buckets: bucketList,
    total_count: items.length,
    total_volume: total_volume > 0 ? total_volume : undefined,
  }
}

export function getEntity<T>(name: EntityName, id: string): T | undefined {
  ensureCollection(name)
  return (collections[name] as unknown as T[]).find((x: any) => x.id === id)
}

export function findEntities<T>(name: EntityName, predicate: (item: any) => boolean): T[] {
  ensureCollection(name)
  return (collections[name] as unknown as T[]).filter(predicate as any) as T[]
}

export function createEntity<T extends { id: string }>(name: EntityName, body: Omit<T, 'id'>): T {
  ensureCollection(name)
  const prefix = name.length <= 4 ? name.toUpperCase() : name.slice(0, 4).replace(/[^a-z_]/g, '').toUpperCase()
  const item = { ...(body as object), id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` } as unknown as T
  ;(collections[name] as unknown as T[]).push(item)
  return item
}

export function updateEntity<T extends { id: string }>(name: EntityName, id: string, body: Partial<T>): T | undefined {
  ensureCollection(name)
  const arr = collections[name] as unknown as T[]
  const idx = arr.findIndex((x) => x.id === id)
  if (idx === -1) return undefined
  arr[idx] = { ...arr[idx], ...body }
  return arr[idx]
}

export function deleteEntity(name: EntityName, id: string): boolean {
  ensureCollection(name)
  const arr = collections[name] as unknown as any[]
  const idx = arr.findIndex((x) => x.id === id)
  if (idx === -1) return false
  arr.splice(idx, 1)
  return true
}

export function softDeleteEntity(name: EntityName, id: string): boolean {
  ensureCollection(name)
  const arr = collections[name] as unknown as any[]
  const idx = arr.findIndex((x) => x.id === id)
  if (idx === -1) return false
  arr[idx].deleted_at = new Date().toISOString()
  return true
}

export function countEntities(name: EntityName, predicate?: (item: any) => boolean): number {
  ensureCollection(name)
  if (!predicate) return (collections[name] as any[]).length
  return (collections[name] as any[]).filter(predicate).length
}

export function geoNear(
  name: Extract<EntityName, 'sites' | 'client_sites'>,
  lat: number,
  lng: number,
  radiusKm: number
): EntityMap['sites'][] {
  ensureCollection(name)
  return (collections[name] as any[]).filter((s) => {
    if (!Array.isArray(s.geo_point)) return false
    const [slng, slat] = s.geo_point
    if (slat == null || slng == null) return false
    const d = haversineKm(lat, lng, slat, slng)
    return d <= radiusKm
  })
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}