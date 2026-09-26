/**
 * In-browser fake backend. No network, no server: data comes from curated
 * fixtures and login just selects a demo profile by email (password ignored).
 * Used on static hosts (Vercel) where the Express mock server cannot run.
 * Swap to real backend by setting VITE_API_MODE.
 */

import { curated, AUTH_FIXTURES } from '@lpg/mock-data'
import type {
  Organization,
  UserSiteAssignment,
  User,
  Role,
  MfaStatus,
} from '@lpg/types'
import type { ApiAdapter, AuthResult, Credentials, ListResult } from './adapter.ts'

/**
 * Minimum shape every collection row must expose: an `id` and the soft-delete
 * marker. The fake adapter only mutates rows through this shape, so the
 * concrete row type (User, Vehicle, …) is widened to `CollectionRow` at the
 * boundary and re-narrowed on the way out via `T`.
 */
interface CollectionRow {
  id: string
  deleted_at?: string | null
}

const COLLECTIONS: Record<string, CollectionRow[]> = {
  regions: curated.regions as unknown as CollectionRow[],
  organizations: curated.organizations as unknown as CollectionRow[],
  system_roles: curated.system_roles as unknown as CollectionRow[],
  permissions: curated.permissions as unknown as CollectionRow[],
  users: curated.users as unknown as CollectionRow[],
  user_mfa: curated.user_mfa as unknown as CollectionRow[],
  integration_auth: curated.integration_auth as unknown as CollectionRow[],
  sites: curated.sites as unknown as CollectionRow[],
  clients: curated.clients as unknown as CollectionRow[],
  client_sites: curated.client_sites as unknown as CollectionRow[],
  vehicles: curated.vehicles as unknown as CollectionRow[],
  drivers: curated.drivers as unknown as CollectionRow[],
  devices: curated.devices as unknown as CollectionRow[],
  transporter_contracts: curated.transporter_contracts as unknown as CollectionRow[],
  pickup_requests: curated.pickup_requests as unknown as CollectionRow[],
  delivery_tours: curated.delivery_tours as unknown as CollectionRow[],
  checkpoints: curated.checkpoints as unknown as CollectionRow[],
  scan_events: curated.scan_events as unknown as CollectionRow[],
  declarations: curated.declarations as unknown as CollectionRow[],
  reconciliations: curated.reconciliations as unknown as CollectionRow[],
  redressements: curated.redressements as unknown as CollectionRow[],
  risk_scores: curated.risk_scores as unknown as CollectionRow[],
  anomalies: curated.anomalies as unknown as CollectionRow[],
  anomaly_assignments: curated.anomaly_assignments as unknown as CollectionRow[],
  notification_groups: curated.notification_groups as unknown as CollectionRow[],
  notification_group_members: curated.notification_group_members as unknown as CollectionRow[],
  notification_rules: curated.notification_rules as unknown as CollectionRow[],
  notifications: curated.notifications as unknown as CollectionRow[],
  rfid_tags: curated.rfid_tags as unknown as CollectionRow[],
  user_site_assignments: curated.user_site_assignments as unknown as CollectionRow[],
  custom_roles: curated.custom_roles as unknown as CollectionRow[],
  user_custom_roles: curated.user_custom_roles as unknown as CollectionRow[],
  reports: [],
  audit_logs: [],
  settings: [],
}

function paginate<T>(items: T[], page = 1, limit = 20): ListResult<T> {
  const safePage = Math.max(1, page)
  const safeLimit = Math.min(100, Math.max(1, limit))
  const start = (safePage - 1) * safeLimit
  const total = items.length
  return {
    data: items.slice(start, start + safeLimit),
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
  }
}

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function fakeToken(profileId: string): string {
  return `fake.${profileId}.${Date.now()}`
}

function genId(name: string): string {
  const rnd =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${name}-${rnd}`
}

interface AuthUserLookup {
  org_id?: string
  mfa_status?: MfaStatus
}

export function createFakeAdapter(): ApiAdapter {
  return {
    async request<T>(path: string, init?: import('./adapter.ts').RequestOptions): Promise<T> {
      const method = (init?.method ?? 'GET').toUpperCase()
      const match = path.match(/^\/([a-z-]+)(?:\/([^?]+))?/i)
      const name = match?.[1]
      const id = match?.[2]
      // api-client resource names use hyphens (e.g. `rfid-tags`); collections
      // use snake_case (e.g. `rfid_tags`). Normalize for lookup.
      const collection = name?.replace(/-/g, '_') ?? ''

      if (name === 'me') return delay(null as unknown as T)
      if (!name || !COLLECTIONS[collection]) {
        throw new Error(`Fake adapter: unsupported resource ${name ?? path}`)
      }
      const rows = COLLECTIONS[collection]

      // CREATE
      if (method === 'POST') {
        const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
        const item: CollectionRow = { id: genId(name), ...body }
        rows.push(item)
        return delay(item as unknown as T)
      }

      // UPDATE
      if ((method === 'PATCH' || method === 'PUT') && id) {
        const idx = rows.findIndex((x) => x.id === id)
        const existing: CollectionRow | undefined = idx >= 0 ? rows[idx] : undefined
        if (!existing) throw new Error('Introuvable')
        const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
        // The path `id` is the source of truth; ignore any incoming id in the body.
        const next: CollectionRow = { ...existing, ...body, id: existing.id }
        rows[idx] = next
        return delay(next as unknown as T)
      }

      // No restore endpoint is documented; deleted rows are recoverable only in DB.
      // DELETE (soft): set deleted_at so the row is excluded from default reads.
      if (method === 'DELETE' && id) {
        const idx = rows.findIndex((x) => x.id === id)
        const existing: CollectionRow | undefined = idx >= 0 ? rows[idx] : undefined
        if (!existing) throw new Error('Introuvable')
        if ('deleted_at' in existing) {
          rows[idx] = { ...existing, deleted_at: new Date().toISOString() }
        } else {
          rows.splice(idx, 1)
        }
        return delay(undefined as unknown as T)
      }

      // READ by id
      if (id) {
        const item = rows.find((x) => x.id === id)
        if (!item || item.deleted_at != null) throw new Error('Introuvable')
        return delay(item as unknown as T)
      }

      throw new Error(`Fake adapter: unsupported path ${path}`)
    },

    async requestList<T>(path: string): Promise<ListResult<T>> {
      const match = path.match(/^\/([a-z-]+)/i)
      const name = match?.[1]
      const collection = name?.replace(/-/g, '_') ?? ''
      if (!name || !COLLECTIONS[collection]) {
        throw new Error(`Fake adapter: unknown resource ${name}`)
      }
      const items = COLLECTIONS[collection] as unknown as T[]
      const qs = path.includes('?') ? path.slice(path.indexOf('?') + 1) : ''
      const params = new URLSearchParams(qs)
      const page = Number(params.get('page') ?? 1)
      const limit = Number(params.get('limit') ?? 20)
      const includeDeleted = params.get('include_deleted') === 'true'
      const visible = (items as unknown as CollectionRow[]).filter((row) => {
        if (includeDeleted) return true
        return !('deleted_at' in row) || row.deleted_at == null
      })
      return delay(paginate(visible as unknown as T[], page, limit))
    },

    async login(creds: Credentials): Promise<AuthResult> {
      const fixture =
        AUTH_FIXTURES.find((f) => f.email === creds.email) ?? AUTH_FIXTURES[0]
      if (!fixture) throw new Error('Fake adapter: no auth fixtures available')
      const users = curated.users as readonly User[]
      const orgs = curated.organizations as readonly Organization[]
      const user = users.find((u) => u.id === fixture.id) as AuthUserLookup | undefined
      const org = user?.org_id
        ? orgs.find((o: Organization) => o.id === user.org_id)
        : undefined
      const assignments: readonly UserSiteAssignment[] = curated.user_site_assignments
      const site_ids = assignments
        .filter((a) => a.user_id === fixture.id)
        .map((a) => a.site_id)
      return delay({
        access_token: fakeToken(fixture.id),
        refresh_token: fakeToken(fixture.id),
        user: {
          id: fixture.id,
          email: fixture.email,
          first_name: fixture.first_name,
          last_name: fixture.last_name,
          system_role: fixture.system_role as Role,
          org_id: user?.org_id,
          org_name: org?.name,
          org_type: org?.type,
          site_ids,
          mfa_status: user?.mfa_status,
        },
      })
    },

    async refresh(): Promise<AuthResult> {
      throw new Error('Fake adapter: refresh not supported')
    },

    setAccessTokenGetter(): void {},
    setOnUnauthorized(): void {},
  }
}

export const fakeAdapter = createFakeAdapter()
