/**
 * HTTP handlers for the mock API. All field names and entity names are
 * snake_case to match the production Postgres schema.
 */

import type { Request, Response, Router } from 'express'
import { Router as makeRouter } from 'express'
import { signToken, verifyToken } from './jwt.ts'
import { AUTH_FIXTURES } from '@lpg/mock-data'
import { ROLE_GRANTS, type PermissionCode } from '@lpg/permissions'
import {
  listEntities,
  getEntity,
  createEntity,
  updateEntity,
  softDeleteEntity,
  findEntities,
  countEntities,
  geoNear,
} from './db.ts'
import type { EntityName } from './types.ts'

const ACCESS_TTL = 60 * 15
const REFRESH_TTL = 60 * 60 * 24 * 7

function publicUser(fixture: (typeof AUTH_FIXTURES)[number]) {
  return {
    id: fixture.id,
    email: fixture.email,
    first_name: fixture.first_name,
    last_name: fixture.last_name,
    system_role: fixture.system_role,
  }
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.type !== 'access') {
    return res.status(401).json({ success: false, message: 'Non authentifie', data: null })
  }
  ;(req as any).auth = payload
  next()
}

function ok<T>(res: Response, data: T, message = 'OK') {
  return res.json({ success: true, message, data })
}
function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, message: 'Cree', data })
}
function notFound(res: Response, msg = 'Introuvable') {
  return res.status(404).json({ success: false, message: msg, data: null })
}
function badReq(res: Response, msg: string) {
  return res.status(400).json({ success: false, message: msg, data: null })
}

function paginatedList(req: Request, res: Response, name: EntityName, options?: { date_field?: string }) {
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
  const sort_by = req.query.sort_by as string | undefined
  const order = (req.query.order as 'asc' | 'desc') ?? 'desc'
  const group_by = req.query.group_by as string | undefined
  const date_from = req.query.date_from as string | undefined
  const date_to = req.query.date_to as string | undefined
  const search = req.query.search as string | undefined

  const reserved = new Set(['page', 'limit', 'sort_by', 'order', 'group_by', 'date_from', 'date_to', 'search'])
  const filters: Record<string, string> = {}
  for (const [k, v] of Object.entries(req.query)) {
    if (!reserved.has(k) && typeof v === 'string') filters[k] = v
  }

  const result = listEntities(name, {
    page, limit, filters, search, sort_by, order, group_by, date_from, date_to, date_field: options?.date_field,
  })

  const envelope: any = { success: true, message: 'OK', data: result.data, pagination: result.pagination }
  if (result.aggregations) envelope.aggregations = result.aggregations
  return res.json(envelope)
}

// ============ AUTH ============
function authRouter(): Router {
  const r = makeRouter()
  r.post('/login', (req, res) => {
    const { email, password } = req.body ?? {}
    const fixture = AUTH_FIXTURES.find((f) => f.email === email && f.password === password)
    if (!fixture) return res.status(401).json({ success: false, message: 'Identifiants invalides', data: null })
    const access = signToken({ sub: fixture.id, role: fixture.system_role, email: fixture.email, type: 'access' }, ACCESS_TTL)
    const refresh = signToken({ sub: fixture.id, role: fixture.system_role, email: fixture.email, type: 'refresh' }, REFRESH_TTL)
    return res.json({ success: true, message: 'Connexion reussie', data: { accessToken: access, refreshToken: refresh, user: publicUser(fixture) } })
  })

  r.post('/refresh', (req, res) => {
    const { refreshToken } = req.body ?? {}
    const payload = refreshToken ? verifyToken(refreshToken) : null
    if (!payload || payload.type !== 'refresh') return res.status(401).json({ success: false, message: 'Refresh token invalide', data: null })
    const fixture = AUTH_FIXTURES.find((f) => f.id === payload.sub)
    if (!fixture) return res.status(401).json({ success: false, message: 'Utilisateur introuvable', data: null })
    const access = signToken({ sub: fixture.id, role: fixture.system_role, email: fixture.email, type: 'access' }, ACCESS_TTL)
    const refresh = signToken({ sub: fixture.id, role: fixture.system_role, email: fixture.email, type: 'refresh' }, REFRESH_TTL)
    return res.json({ success: true, message: 'Session renouvelee', data: { accessToken: access, refreshToken: refresh, user: publicUser(fixture) } })
  })

  r.post('/logout', requireAuth, (_req, res) => res.json({ success: true, message: 'Deconnexion reussie', data: null }))
  return r
}

function meRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => {
    const payload = (req as any).auth
    const fixture = AUTH_FIXTURES.find((f) => f.id === payload.sub)
    if (!fixture) return notFound(res, 'Utilisateur introuvable')
    const user = getEntity('users', payload.sub)
    return ok(res, user ?? publicUser(fixture))
  })

  r.patch('/', requireAuth, (req, res) => {
    const payload = (req as any).auth
    const { first_name, last_name } = req.body ?? {}
    const updated = updateEntity('users', payload.sub, { first_name, last_name } as any)
    return updated ? ok(res, updated) : notFound(res)
  })

  r.get('/permissions', requireAuth, (req, res) => {
    const payload = (req as any).auth
    const grants = ROLE_GRANTS[payload.role as keyof typeof ROLE_GRANTS] ?? []
    return ok(res, { can: grants as PermissionCode[] })
  })
  return r
}

// ============ ORGS ============
function orgRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'organizations'))
  r.post('/', (req, res) => created(res, createEntity('organizations', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('organizations', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('organizations', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.delete('/:id', (req, res) => {
    return softDeleteEntity('organizations', req.params.id) ? ok(res, null, 'Supprime') : notFound(res)
  })
  r.get('/:id/stats', (req, res) => {
    const orgId = req.params.id
    return ok(res, {
      organization_id: orgId,
      total_vehicles: countEntities('vehicles', (v: any) => v.org_id === orgId),
      total_sites: countEntities('sites', (s: any) => s.org_id === orgId),
      active_tours: countEntities('delivery_tours', (t: any) => t.status === 'INPROGRESS'),
    })
  })
  return r
}

// ============ USERS ============
function usersRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'users'))
  r.post('/', (req, res) => created(res, createEntity('users', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('users', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('users', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/reset-password', (req, res) => {
    const user = getEntity('users', req.params.id)
    if (!user) return notFound(res)
    const new_password = req.body?.new_password ?? `temp-${Math.random().toString(36).slice(2, 10)}`
    return ok(res, { user_id: req.params.id, new_password })
  })
  return r
}

// ============ SITES & CLIENT SITES ============
function sitesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => {
    const { lat, lng, radius } = req.query
    if (lat && lng && radius) {
      const result = geoNear('sites', Number(lat), Number(lng), Number(radius))
      return res.json({ success: true, message: 'OK', data: result, pagination: { page: 1, limit: result.length, total: result.length } })
    }
    return paginatedList(req, res, 'sites')
  })
  r.post('/', (req, res) => created(res, createEntity('sites', req.body ?? {})))
  r.get('/nearest', (req, res) => {
    const { lat, lng } = req.query
    if (!lat || !lng) return badReq(res, 'lat et lng requis')
    const result = geoNear('sites', Number(lat), Number(lng), 10)
    return ok(res, result.slice(0, 5))
  })
  r.get('/:id', (req, res) => {
    const item = getEntity('sites', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('sites', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/verify', (req, res) => {
    const updated = updateEntity('sites', req.params.id, { is_verified: true, verified_at: new Date().toISOString(), status: 'VERIFIED' } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  r.post('/:id/suspend', (req, res) => {
    const { reason } = req.body ?? {}
    const updated = updateEntity('sites', req.params.id, { status: 'SUSPENDED', reason } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  return r
}

function clientSitesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'client_sites'))
  r.post('/', (req, res) => created(res, createEntity('client_sites', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('client_sites', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('client_sites', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/verify', (req, res) => {
    const updated = updateEntity('client_sites', req.params.id, { is_verified: true, verified_at: new Date().toISOString() } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  return r
}

function clientsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'clients'))
  r.post('/', (req, res) => created(res, createEntity('clients', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('clients', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('clients', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  return r
}

// ============ VEHICLES & DRIVERS ============
function vehiclesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'vehicles'))
  r.post('/', (req, res) => created(res, createEntity('vehicles', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('vehicles', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('vehicles', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.get('/:id/certificate', (req, res) => {
    const vehicle = getEntity('vehicles', req.params.id)
    if (!vehicle) return notFound(res)
    return ok(res, {
      certificate_url: (vehicle as any).certificate_url,
      certificate_number: (vehicle as any).certificate_number,
      valid_until: (vehicle as any).certificate_expiry_at,
    })
  })
  return r
}

function driversRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'drivers'))
  r.post('/', (req, res) => created(res, createEntity('drivers', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('drivers', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('drivers', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  return r
}

// ============ DEVICES ============
function devicesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'devices'))
  r.post('/', (req, res) => created(res, createEntity('devices', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('devices', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('devices', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/assign', (req, res) => {
    const { user_id, vehicle_id } = req.body ?? {}
    const updated = updateEntity('devices', req.params.id, {
      assigned_to_user_id: user_id,
      assigned_to_vehicle_id: vehicle_id,
      status: 'ASSIGNED',
    } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  return r
}

function rfidTagsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'rfid_tags'))
  r.post('/', (req, res) => {
    const body = req.body ?? {}
    if (Array.isArray(body)) {
      const items = body.map((t) => createEntity('rfid_tags', { ...t, status: t.status ?? 'AVAILABLE' }))
      return created(res, items)
    }
    return created(res, createEntity('rfid_tags', { ...body, status: body.status ?? 'AVAILABLE' }))
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('rfid_tags', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  return r
}

// ============ PICKUPS ============
function pickupRequestsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'pickup_requests'))
  r.post('/', (req, res) => created(res, createEntity('pickup_requests', { ...req.body, status: req.body?.status ?? 'DRAFT' })))
  r.get('/:id', (req, res) => {
    const item = getEntity('pickup_requests', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('pickup_requests', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id/validate', (req, res) => {
    const { approved_quantity } = req.body ?? {}
    const updated = updateEntity('pickup_requests', req.params.id, { approved_quantity, status: 'VALIDATED' } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  r.post('/:id/complete', (req, res) => {
    const updated = updateEntity('pickup_requests', req.params.id, { status: 'COMPLETED' } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  return r
}

// ============ TOURS & CHECKPOINTS & SCANS ============
function deliveryToursRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'delivery_tours'))
  r.post('/', (req, res) => {
    const body = { ...req.body, status: req.body?.status ?? 'DRAFT' }
    const tour = createEntity('delivery_tours', body)
    return created(res, tour)
  })
  r.get('/:id', (req, res) => {
    const tour = getEntity('delivery_tours', req.params.id)
    if (!tour) return notFound(res)
    const checkpoints = findEntities('checkpoints', (c: any) => c.tournee_id === req.params.id)
    const scans = findEntities('scan_events', (s: any) => checkpoints.some((c: any) => c.id === s.checkpoint_id))
    return ok(res, { ...tour, checkpoints, scans })
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('delivery_tours', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/start', (req, res) => {
    const updated = updateEntity('delivery_tours', req.params.id, { status: 'INPROGRESS', started_at: req.body?.started_at ?? new Date().toISOString() } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  r.post('/:id/close', (req, res) => {
    const updated = updateEntity('delivery_tours', req.params.id, { status: 'CLOSED', closed_at: new Date().toISOString() } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  r.get('/:id/replay', (req, res) => {
    const checkpoints = findEntities('checkpoints', (c: any) => c.tournee_id === req.params.id)
    const waypoints = checkpoints
      .filter((c: any) => c.actual_arrival)
      .map((c: any, i: number) => ({ sequence: c.sequence ?? i + 1, status: c.status, timestamp: c.actual_arrival }))
    return ok(res, { type: 'FeatureCollection', features: waypoints })
  })
  return r
}

function checkpointsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'checkpoints'))
  r.post('/', (req, res) => created(res, createEntity('checkpoints', req.body ?? {})))
  r.patch('/:id', (req, res) => {
    const item = updateEntity('checkpoints', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/reach', (req, res) => {
    const updated = updateEntity('checkpoints', req.params.id, { status: 'REACHED', actual_arrival: new Date().toISOString() } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  r.post('/:id/skip', (req, res) => {
    const { reason } = req.body ?? {}
    const updated = updateEntity('checkpoints', req.params.id, { status: 'SKIPPED', skip_reason: reason } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  return r
}

function scanEventsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'scan_events'))
  r.post('/', (req, res) => {
    const scan = createEntity('scan_events', { ...req.body, timestamp: req.body?.timestamp ?? new Date().toISOString() })
    return created(res, scan)
  })
  r.post('/bulk', (req, res) => {
    const { scans = [] } = req.body ?? {}
    const items = scans.map((s: any) => createEntity('scan_events', { ...s, timestamp: s.timestamp ?? new Date().toISOString() }))
    return created(res, { received: items.length })
  })
  return r
}

// ============ DECLARATIONS & RECONCILIATION ============
function declarationsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'declarations'))
  r.post('/', (req, res) => created(res, createEntity('declarations', { ...req.body, status: req.body?.status ?? 'DRAFT' })))
  r.get('/:id', (req, res) => {
    const item = getEntity('declarations', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/submit', (req, res) => {
    const updated = updateEntity('declarations', req.params.id, { status: 'SUBMITTED' } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  r.post('/:id/reconcile', (req, res) => {
    const decl = getEntity('declarations', req.params.id)
    if (!decl) return notFound(res)
    const declared_volume = (decl as any).declared_volume ?? 0
    const tracked = declared_volume * (0.85 + Math.random() * 0.3)
    const gap = tracked - declared_volume
    const rec = createEntity('reconciliations', {
      declaration_id: req.params.id,
      tracked_volume: Math.round(tracked),
      volume_gap: Math.round(gap),
      subsidy_impact: Math.round(gap * 1000),
      status: 'PENDING',
    } as any)
    return ok(res, rec)
  })
  return r
}

function reconciliationsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'reconciliations'))
  r.patch('/:id/verify', (req, res) => {
    const { notes } = req.body ?? {}
    const updated = updateEntity('reconciliations', req.params.id, { status: 'VERIFIED', verified_at: new Date().toISOString(), notes } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  r.post('/:id/redressement', (req, res) => {
    const { amount, due_date } = req.body ?? {}
    const item = createEntity('redressements', {
      reconciliation_id: req.params.id,
      amount: amount ?? 0,
      due_date: due_date ?? '2026-08-30',
      status: 'ISSUED',
      issued_at: new Date().toISOString(),
    })
    updateEntity('reconciliations', req.params.id, { status: 'REDRESSEMENTAPPLIED' } as any)
    return created(res, item)
  })
  return r
}

function redressementsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'redressements'))
  r.patch('/:id/mark-paid', (req, res) => {
    const { transaction_ref } = req.body ?? {}
    const updated = updateEntity('redressements', req.params.id, { status: 'PAID', paid_at: new Date().toISOString(), transaction_ref } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  r.patch('/:id/waive', (req, res) => {
    const updated = updateEntity('redressements', req.params.id, { status: 'WAIVED' } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  return r
}

// ============ ANOMALIES ============
function anomaliesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'anomalies'))
  r.get('/:id', (req, res) => {
    const item = getEntity('anomalies', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('anomalies', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/assign', (req, res) => {
    const assignment = createEntity('anomaly_assignments', { ...req.body, anomaly_id: req.params.id, assigned_at: new Date().toISOString(), status: 'PENDING' })
    return created(res, assignment)
  })
  r.post('/:id/resolve', (req, res) => {
    const { resolution_notes } = req.body ?? {}
    const updated = updateEntity('anomalies', req.params.id, { status: 'RESOLU', resolved_at: new Date().toISOString(), resolution_notes } as any)
    return updated ? ok(res, updated) : notFound(res)
  })
  return r
}

// ============ RISK ============
function riskScoresRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'risk_scores'))
  r.post('/recompute', (_req, res) => {
    const recomputed = findEntities('risk_scores', () => true).map(
      (rs: any) => ({
        id: rs.id,
        entity_type: rs.entity_type,
        entity_id: rs.entity_id,
        score: clampScore(rs.score ?? 0),
        level: riskLevelFor(rs.score ?? 0),
        model_version: 'CSPH-RISK-v2.2',
        recomputed_at: new Date().toISOString(),
      }),
    )
    return ok(res, {
      recomputed: recomputed.length,
      model_version: 'CSPH-RISK-v2.2',
      generated_at: new Date().toISOString(),
      data: recomputed,
    })
  })
  return r
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function riskLevelFor(score: number): string {
  if (score >= 85) return 'CRITIQUEEXTREME'
  if (score >= 70) return 'CRITIQUE'
  if (score >= 45) return 'ELEVE'
  if (score >= 20) return 'MODERE'
  return 'FAIBLE'
}

// ============ NOTIFICATIONS ============
function notificationGroupsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'notification_groups'))
  r.post('/', (req, res) => created(res, createEntity('notification_groups', req.body ?? {})))
  r.patch('/:id', (req, res) => {
    const item = updateEntity('notification_groups', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  return r
}

function notificationRulesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'notification_rules'))
  r.post('/', (req, res) => created(res, createEntity('notification_rules', req.body ?? {})))
  r.patch('/:id', (req, res) => {
    const item = updateEntity('notification_rules', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  return r
}

function notificationsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'notifications'))
  return r
}

// ============ CONTRACTS & RBAC ============
function transporterContractsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'transporter_contracts'))
  r.post('/', (req, res) => created(res, createEntity('transporter_contracts', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('transporter_contracts', req.params.id)
    return item ? ok(res, item) : notFound(res)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('transporter_contracts', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/attach-proof', (req, res) => {
    const item = updateEntity('transporter_contracts', req.params.id, {
      contract_document_url: req.body?.contract_document_url,
    } as any)
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/accept', (req, res) => {
    const item = updateEntity('transporter_contracts', req.params.id, {
      transporter_accepted_at: new Date().toISOString(),
    } as any)
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/suspend', (req, res) => {
    const item = updateEntity('transporter_contracts', req.params.id, { is_active: false } as any)
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/reactivate', (req, res) => {
    const item = updateEntity('transporter_contracts', req.params.id, { is_active: true } as any)
    return item ? ok(res, item) : notFound(res)
  })
  r.post('/:id/set-primary', (req, res) => {
    const current = getEntity<any>('transporter_contracts', req.params.id)
    if (!current) return notFound(res)
    findEntities<any>('transporter_contracts', (contract) =>
      contract.marketeur_org_id === current.marketeur_org_id && !contract.deleted_at,
    ).forEach((contract) => updateEntity('transporter_contracts', contract.id, { is_primary: contract.id === current.id } as any))
    const updated = getEntity('transporter_contracts', req.params.id)
    return updated ? ok(res, updated) : notFound(res)
  })
  r.delete('/:id', (req, res) =>
    softDeleteEntity('transporter_contracts', req.params.id) ? ok(res, null, 'Supprime') : notFound(res),
  )
  return r
}

function customRolesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'custom_roles'))
  r.post('/', (req, res) => created(res, createEntity('custom_roles', req.body ?? {})))
  r.patch('/:id', (req, res) => {
    const item = updateEntity('custom_roles', req.params.id, req.body ?? {})
    return item ? ok(res, item) : notFound(res)
  })
  return r
}

function permissionsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'permissions'))
  return r
}

function settingsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'settings'))
  r.patch('/:key', (req, res) => ok(res, { setting_key: req.params.key, ...req.body }))
  return r
}

function auditLogsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'audit_logs'))
  return r
}

function reportsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'reports'))
  return r
}

function systemRouter(): Router {
  const r = makeRouter()
  r.get('/health', (_req, res) => ok(res, { status: 'ok', timestamp: new Date().toISOString() }))
  r.get('/metrics', (_req, res) => ok(res, { active_tours: countEntities('delivery_tours', (t: any) => t.status === 'INPROGRESS'), open_anomalies: countEntities('anomalies', (a: any) => a.status !== 'RESOLU') }))
  return r
}

// ============ AGGREGATE ============
export function buildRouter(): Router {
  const root = makeRouter()
  root.use('/auth', authRouter())
  root.use('/me', meRouter())
  root.use('/organizations', orgRouter())
  root.use('/users', usersRouter())
  root.use('/sites', sitesRouter())
  root.use('/client-sites', clientSitesRouter())
  root.use('/clients', clientsRouter())
  root.use('/vehicles', vehiclesRouter())
  root.use('/drivers', driversRouter())
  root.use('/devices', devicesRouter())
  root.use('/rfid-tags', rfidTagsRouter())
  root.use('/pickup-requests', pickupRequestsRouter())
  root.use('/pickups', pickupRequestsRouter())
  root.use('/delivery-tours', deliveryToursRouter())
  root.use('/tours', deliveryToursRouter())
  root.use('/checkpoints', checkpointsRouter())
  root.use('/scan-events', scanEventsRouter())
  root.use('/scans', scanEventsRouter())
  root.use('/declarations', declarationsRouter())
  root.use('/reconciliations', reconciliationsRouter())
  root.use('/redressements', redressementsRouter())
  root.use('/anomalies', anomaliesRouter())
  root.use('/risk-scores', riskScoresRouter())
  root.use('/risks', riskScoresRouter())
  root.use('/notification-groups', notificationGroupsRouter())
  root.use('/notification-rules', notificationRulesRouter())
  root.use('/notifications', notificationsRouter())
  root.use('/transporter-contracts', transporterContractsRouter())
  root.use('/custom-roles', customRolesRouter())
  root.use('/permissions', permissionsRouter())
  root.use('/settings', settingsRouter())
  root.use('/audit-logs', auditLogsRouter())
  root.use('/reports', reportsRouter())
  root.use('/system', systemRouter())
  return root
}
