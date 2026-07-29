import { seeds, AUTH_FIXTURES } from '@lpg/mock-data'
import type { EntityMap, EntityName } from './types.ts'

type Collections = { [K in EntityName]: EntityMap[K][] }

const users = (seeds.users as any[]).map((u) => {
  const fixture = AUTH_FIXTURES.find((f) => f.id === u.id)
  return { ...u, password: fixture?.password ?? 'password' }
})

const emptyArr: any[] = []

export const collections: Collections = {
  organizations: (seeds as any).organizations ?? emptyArr,
  users,
  sites: (seeds as any).sites ?? emptyArr,
  trucks: (seeds as any).trucks ?? emptyArr,
  tours: (seeds as any).tours ?? emptyArr,
  declarations: (seeds as any).declarations ?? emptyArr,
  anomalies: (seeds as any).anomalies ?? emptyArr,
  reports: (seeds as any).reports ?? emptyArr,
  pda: (seeds as any).pda ?? emptyArr,
  infra: (seeds as any).infra ?? emptyArr,
  transporters: (seeds as any).transporters ?? emptyArr,
  drivers: (seeds as any).drivers ?? emptyArr,
  'rfid-tags': (seeds as any)['rfid-tags'] ?? emptyArr,
  pickups: (seeds as any).pickups ?? emptyArr,
  checkpoints: (seeds as any).checkpoints ?? emptyArr,
  scans: (seeds as any).scans ?? emptyArr,
  reconciliations: (seeds as any).reconciliations ?? emptyArr,
  redressements: (seeds as any).redressements ?? emptyArr,
  'custom-roles': (seeds as any)['custom-roles'] ?? emptyArr,
  'user-assignments': (seeds as any)['user-assignments'] ?? emptyArr,
  'user-custom-roles': (seeds as any)['user-custom-roles'] ?? emptyArr,
  'notification-groups': (seeds as any)['notification-groups'] ?? emptyArr,
  'notification-rules': (seeds as any)['notification-rules'] ?? emptyArr,
  risks: (seeds as any).risks ?? emptyArr,
  'audit-logs': (seeds as any)['audit-logs'] ?? emptyArr,
  'vehicle-types': (seeds as any)['vehicle-types'] ?? emptyArr,
  'delivery-types': (seeds as any)['delivery-types'] ?? emptyArr,
  'tour-statuses': (seeds as any)['tour-statuses'] ?? emptyArr,
}

function ensureCollection(name: EntityName) {
  if (!collections[name]) {
    (collections as any)[name] = []
  }
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

export interface ListResult<T> {
  data: T[]
  pagination: { page: number; limit: number; total: number; pages: number }
  aggregations?: AggregationResult
}

export interface QueryOptions {
  page?: number
  /** Alias: limit (standard) or limite (legacy). Max 100. */
  limit?: number
  filters?: Record<string, string | number | boolean | undefined>
  search?: string
  /** Alias: sortBy (standard) or sort (legacy). Whitelist enforced per-entity upstream. */
  sortBy?: string
  order?: 'asc' | 'desc'
  /** ISO-8601 date range filtering */
  dateFrom?: string
  dateTo?: string
  dateField?: string
  /** Group rows and return aggregation buckets */
  groupBy?: string
  /** Numeric field to sum in aggregations (e.g., 'deliveredVolumeLiters') */
  sumField?: string
}

const DATE_FIELDS = new Set([
  'createdAt', 'updatedAt', 'detectedAt', 'declaredAt', 'scannedAt',
  'startedAt', 'closedAt', 'plannedDate', 'generatedAt', 'measuredAt',
  'timestamp', 'periodStart', 'periodEnd', 'lastSync', 'lastPing',
  'computedAt', 'expectedArrival', 'actualArrival', 'dueDate',
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

export function listEntities<T>(
  name: EntityName,
  opts: QueryOptions = {}
): ListResult<T> {
  ensureCollection(name)
  let items = collections[name] as unknown as T[]

  const dateField = opts.dateField ?? detectDateField(items[0] as any)
  const dateFrom = parseDate(opts.dateFrom)
  const dateTo = parseDate(opts.dateTo)

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
      Object.values(item).some(
        (v) => typeof v === 'string' && v.toLowerCase().includes(q)
      )
    )
  }

  const sortKey = opts.sortBy
  const sortDir = opts.order === 'asc' ? 1 : -1

  if (sortKey) {
    items = [...items].sort((a: any, b: any) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sortDir
      return String(va).localeCompare(String(vb)) * sortDir
    })
  }

  const aggregates = opts.groupBy ? computeAggregations(items as any[], opts.groupBy) : undefined

  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20))
  const start = (page - 1) * limit
  const total = items.length
  const pages = Math.ceil(total / limit)

  const result: ListResult<T> = {
    data: items.slice(start, start + limit) as T[],
    pagination: { page, limit, total, pages },
  }
  if (aggregates) {
    result.aggregations = aggregates
  }
  return result
}

function computeAggregations(items: any[], field: string): AggregationResult {
  const buckets = new Map<string, { count: number; sumVolume: number; scores: number[] }>()

  for (const item of items) {
    let key: string
    const raw = item[field]
    if (raw === undefined || raw === null) {
      key = 'AUCUN'
    } else if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
      key = raw.slice(0, 10)
    } else {
      key = String(raw)
    }

    const existing = buckets.get(key) ?? { count: 0, sumVolume: 0, scores: [] }
    existing.count++
    if (typeof item.volume === 'number') existing.sumVolume += item.volume
    if (typeof item.score === 'number') existing.scores.push(item.score)
    if (typeof item.deliveredVolumeLiters === 'number') existing.sumVolume += item.deliveredVolumeLiters
    if (typeof item.declaredVolumeKg === 'number') existing.sumVolume += item.declaredVolumeKg
    if (typeof item.requestedQuantityKg === 'number') existing.sumVolume += item.requestedQuantityKg
    if (typeof item.bottlesIn === 'number') existing.sumVolume += item.bottlesIn
    if (typeof item.bottlesOut === 'number') existing.sumVolume += item.bottlesOut
    buckets.set(key, existing)
  }

  const bucketList: AggregationBucket[] = Array.from(buckets.entries()).map(([key, v]) => ({
    key,
    count: v.count,
    sumVolume: v.sumVolume > 0 ? v.sumVolume : undefined,
    avgScore: v.scores.length > 0
      ? Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 100) / 100
      : undefined,
  }))

  const totalVolume = bucketList.reduce((s, b) => s + (b.sumVolume ?? 0), 0)

  return {
    groupedBy: field,
    buckets: bucketList,
    totalCount: items.length,
    totalVolume: totalVolume > 0 ? totalVolume : undefined,
  }
}

export function getEntity<T>(name: EntityName, id: string): T | undefined {
  ensureCollection(name)
  return (collections[name] as unknown as T[]).find((x: any) => x.id === id)
}

export function findEntities<T>(
  name: EntityName,
  predicate: (item: any) => boolean
): T[] {
  ensureCollection(name)
  return (collections[name] as unknown as T[]).filter(predicate as any) as T[]
}

export function createEntity<T extends { id: string }>(
  name: EntityName,
  body: Omit<T, 'id'>
): T {
  ensureCollection(name)
  const prefix = name.length <= 2 ? name.toUpperCase() : name.slice(0, 4).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const item = {
    ...(body as object),
    id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  } as unknown as T
  ;(collections[name] as unknown as T[]).push(item)
  return item
}

export function updateEntity<T extends { id: string }>(
  name: EntityName,
  id: string,
  body: Partial<T>
): T | undefined {
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
  arr[idx].deletedAt = new Date().toISOString()
  return true
}

export function countEntities(name: EntityName, predicate?: (item: any) => boolean): number {
  ensureCollection(name)
  if (!predicate) return (collections[name] as any[]).length
  return (collections[name] as any[]).filter(predicate).length
}

export function geoNear(
  name: Extract<EntityName, 'sites'>,
  lat: number,
  lng: number,
  radiusKm: number
): EntityMap['sites'][] {
  ensureCollection(name)
  return (collections[name] as EntityMap['sites'][]).filter((s) => {
    const slat = s.lat ?? s.capturedLat
    const slng = s.lng ?? s.capturedLng
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
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
