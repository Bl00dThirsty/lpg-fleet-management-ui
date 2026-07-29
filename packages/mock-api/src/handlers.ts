import type { Request, Response, Router } from 'express'
import { Router as makeRouter } from 'express'
import { signToken, verifyToken } from './jwt.ts'
import { AUTH_FIXTURES } from '@lpg/mock-data'
import {
  listEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  softDeleteEntity,
  findEntities,
  countEntities,
  geoNear,
} from './db.ts'
import type { EntityName, EntityMap } from './types.ts'

const ACCESS_TTL = 60 * 15
const REFRESH_TTL = 60 * 60 * 24 * 7

function publicUser(fixture: (typeof AUTH_FIXTURES)[number]) {
  return {
    id: fixture.id,
    email: fixture.email,
    firstName: fixture.firstName,
    lastName: fixture.lastName,
    role: fixture.role,
  }
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.type !== 'access') {
    return res.status(401).json({ success: false, message: 'Non authentifie', donnees: null })
  }
  ;(req as any).auth = payload
  next()
}

function ok<T>(res: Response, data: T, message = 'OK') {
  return res.json({ success: true, message, donnees: data })
}
function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, message: 'Cree', donnees: data })
}
function notFound(res: Response, msg = 'Introuvable') {
  return res.status(404).json({ success: false, message: msg, donnees: null })
}
function badReq(res: Response, msg: string) {
  return res.status(400).json({ success: false, message: msg, donnees: null })
}

function paginatedList(req: Request, res: Response, name: EntityName, options?: { dateField?: string }) {
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Number(req.query.limit ?? req.query.limite ?? 20)
  const sortBy = (req.query.sortBy ?? req.query.sort) as string | undefined
  const order = (req.query.order as 'asc' | 'desc') ?? 'desc'
  const groupBy = req.query.groupBy as string | undefined
  const dateFrom = req.query.dateFrom as string | undefined
  const dateTo = req.query.dateTo as string | undefined
  const search = req.query.search as string | undefined

  const reserved = new Set(['page', 'limit', 'limite', 'sortBy', 'sort', 'order', 'groupBy', 'dateFrom', 'dateTo', 'search'])
  const filters: Record<string, string> = {}
  for (const [k, v] of Object.entries(req.query)) {
    if (!reserved.has(k) && typeof v === 'string') {
      filters[k] = v
    }
  }

  const result = listEntities(name, {
    page, limit, filters, search, sortBy, order, groupBy, dateFrom, dateTo, dateField: options?.dateField,
  })

  const envelope: any = { success: true, message: 'OK', donnees: result.data, pagination: result.pagination }
  if (result.aggregations) {
    envelope.aggregations = result.aggregations
  }
  return res.json(envelope)
}

// =============================================
// DOMAIN 1: Authentication & User Profile
// =============================================
function authRouter(): Router {
  const r = makeRouter()

  r.post('/login', (req: Request, res: Response) => {
    const { email, password } = req.body ?? {}
    const fixture = AUTH_FIXTURES.find((f) => f.email === email && f.password === password)
    if (!fixture) return res.status(401).json({ success: false, message: 'Identifiants invalides', donnees: null })
    const access = signToken({ sub: fixture.id, role: fixture.role, email: fixture.email, type: 'access' }, ACCESS_TTL)
    const refresh = signToken({ sub: fixture.id, role: fixture.role, email: fixture.email, type: 'refresh' }, REFRESH_TTL)
    return res.json({ success: true, message: 'Connexion reussie', donnees: { accessToken: access, refreshToken: refresh, user: publicUser(fixture) } })
  })

  r.post('/refresh', (req: Request, res: Response) => {
    const { refreshToken } = req.body ?? {}
    const payload = refreshToken ? verifyToken(refreshToken) : null
    if (!payload || payload.type !== 'refresh') return res.status(401).json({ success: false, message: 'Refresh token invalide', donnees: null })
    const fixture = AUTH_FIXTURES.find((f) => f.id === payload.sub)
    if (!fixture) return res.status(401).json({ success: false, message: 'Utilisateur introuvable', donnees: null })
    const access = signToken({ sub: fixture.id, role: fixture.role, email: fixture.email, type: 'access' }, ACCESS_TTL)
    const refresh = signToken({ sub: fixture.id, role: fixture.role, email: fixture.email, type: 'refresh' }, REFRESH_TTL)
    return res.json({ success: true, message: 'Session renouvelee', donnees: { accessToken: access, refreshToken: refresh, user: publicUser(fixture) } })
  })

  r.post('/logout', requireAuth, (_req, res) => {
    return res.json({ success: true, message: 'Deconnexion reussie', donnees: null })
  })

  return r
}

function meRouter(): Router {
  const r = makeRouter()

  r.get('/', requireAuth, (req, res) => {
    const payload = (req as any).auth
    const fixture = AUTH_FIXTURES.find((f) => f.id === payload.sub)
    if (!fixture) return notFound(res, 'Utilisateur introuvable')
    const usersList = findEntities('users', (u: any) => u.id === payload.sub)
    const user = usersList[0] ?? publicUser(fixture)
    const userId = (user as any).organizationId ?? 'org-1'
    return ok(res, {
      ...user,
      organizations: [{ id: userId, name: 'CSPH', type: 'CSPH' }],
      sites: findEntities<EntityMap['sites']>('sites', (s: any) => s.organizationId === userId).slice(0, 5),
    })
  })

  r.patch('/', requireAuth, (req, res) => {
    const payload = (req as any).auth
    const { firstName, lastName } = req.body ?? {}
    const user = getEntity<EntityMap['users']>('users', payload.sub)
    if (!user) return notFound(res)
    const updated = updateEntity<EntityMap['users']>('users', payload.sub, { firstName, lastName } as any)
    return ok(res, updated)
  })

  r.get('/permissions', requireAuth, (req, res) => {
    const payload = (req as any).auth
    const perms = {
      can: [
        'read:organizations', 'read:users', 'read:sites', 'read:trucks',
        'read:tours', 'read:declarations', 'read:anomalies', 'read:reports',
        'read:pda', 'read:infra', 'read:transporters', 'read:drivers',
        'read:rfid-tags', 'read:pickups', 'read:checkpoints', 'read:scans',
        'read:reconciliations', 'read:redressements', 'read:risks',
        'read:audit-logs', 'read:notification-groups', 'read:notification-rules',
        'write:organizations', 'write:users', 'write:sites', 'write:trucks',
        'write:tours', 'write:declarations', 'write:anomalies',
      ],
    }
    if (payload.role === 'SUPER_ADMIN') perms.can.push('manage:all')
    return ok(res, perms)
  })

  return r
}

// =============================================
// DOMAIN 2: Organizations
// =============================================
function orgRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'organizations'))
  r.post('/', (req, res) => created(res, createEntity('organizations', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('organizations', req.params.id)
    if (!item) return notFound(res)
    return ok(res, item)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('organizations', req.params.id, req.body ?? {})
    if (!item) return notFound(res)
    return ok(res, item)
  })
  r.delete('/:id', (req, res) => {
    if (!softDeleteEntity('organizations', req.params.id)) return notFound(res)
    return ok(res, null, 'Supprime')
  })
  r.get('/:id/stats', (req, res) => {
    const orgId = req.params.id
    const vehicles = countEntities('trucks', (v: any) => v.organizationId === orgId)
    const sites = countEntities('sites', (s: any) => s.organizationId === orgId)
    const activeTours = countEntities('tours', (t: any) => t.status === 'in_progress' || t.status === 'IN_PROGRESS')
    return ok(res, {
      organizationId: orgId,
      totalVehicles: vehicles,
      totalSites: sites,
      activeTours,
      activeDeliveries: Math.floor(activeTours * 0.7),
      totalVolume: Math.floor(Math.random() * 100000 + 20000),
    })
  })

  return r
}

// =============================================
// DOMAIN 3: Sites & Geo
// =============================================
function sitesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => {
    const { lat, lng, radius } = req.query
    if (lat && lng && radius) {
      const result = geoNear('sites', Number(lat), Number(lng), Number(radius))
      return res.json({ success: true, message: 'OK', donnees: result, pagination: { page: 1, limite: result.length, total: result.length } })
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
    if (!item) return notFound(res)
    return ok(res, item)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('sites', req.params.id, req.body ?? {})
    if (!item) return notFound(res)
    return ok(res, item)
  })
  r.post('/:id/auto-assign-geo', (req, res) => {
    const site = getEntity<EntityMap['sites']>('sites', req.params.id)
    if (!site) return notFound(res)
    const updated = updateEntity<EntityMap['sites']>('sites', req.params.id, { status: 'ACTIVE' as any })
    return ok(res, updated)
  })
  r.post('/:id/verify', (req, res) => {
    const site = getEntity<EntityMap['sites']>('sites', req.params.id)
    if (!site) return notFound(res)
    const updated = updateEntity<EntityMap['sites']>('sites', req.params.id, { isVerifiedByAgent: true })
    return ok(res, updated)
  })
  r.post('/:id/suspend', (req, res) => {
    const site = getEntity<EntityMap['sites']>('sites', req.params.id)
    if (!site) return notFound(res)
    const updated = updateEntity<EntityMap['sites']>('sites', req.params.id, { status: 'INACTIVE' as any })
    return ok(res, updated)
  })

  return r
}

// =============================================
// DOMAIN 4: Users & RBAC
// =============================================
function usersRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'users'))
  r.post('/', (req, res) => created(res, createEntity('users', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('users', req.params.id)
    if (!item) return notFound(res)
    return ok(res, item)
  })
  r.patch('/:id', (req, res) => {
    const item = updateEntity('users', req.params.id, req.body ?? {})
    if (!item) return notFound(res)
    return ok(res, item)
  })
  r.post('/:id/reset-password', (req, res) => {
    const user = getEntity('users', req.params.id)
    if (!user) return notFound(res)
    const newPassword = req.body?.newPassword ?? `temp-${Math.random().toString(36).slice(2, 10)}`
    return ok(res, { userId: req.params.id, newPassword })
  })

  return r
}

function userAssignmentsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'user-assignments'))
  r.post('/', (req, res) => created(res, createEntity('user-assignments', req.body ?? {})))
  r.delete('/:id', (req, res) => {
    if (!deleteEntity('user-assignments', req.params.id)) return notFound(res)
    return ok(res, null, 'Supprime')
  })
  return r
}

function customRolesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'custom-roles'))
  r.post('/', (req, res) => created(res, createEntity('custom-roles', req.body ?? {})))
  return r
}

function userCustomRolesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.get('/', (req, res) => paginatedList(req, res, 'user-custom-roles'))
  r.post('/', (req, res) => created(res, createEntity('user-custom-roles', req.body ?? {})))
  return r
}

// =============================================
// DOMAIN 5: Vehicles & Drivers
// =============================================
function vehiclesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'trucks'))
  r.post('/', (req, res) => created(res, createEntity('trucks', req.body ?? {})))
  r.get('/:id', (req, res) => {
    const item = getEntity('trucks', req.params.id)
    if (!item) return notFound(res)
    return ok(res, item)
  })
  r.get('/:id/certificate', (req, res) => {
    const truck = getEntity('trucks', req.params.id)
    if (!truck) return notFound(res)
    return ok(res, { certificateUrl: `/certificates/${req.params.id}.pdf`, certificateNumber: `CERT-${Date.now()}`, validUntil: '2027-06-30' })
  })

  return r
}

function driversRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'drivers'))
  r.post('/', (req, res) => created(res, createEntity('drivers', req.body ?? {})))

  return r
}

// =============================================
// DOMAIN 6: Equipment (PDA & RFID)
// =============================================
function pdaRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'pda'))
  r.post('/', (req, res) => created(res, createEntity('pda', req.body ?? {})))
  r.patch('/:id', (req, res) => {
    const item = updateEntity('pda', req.params.id, req.body ?? {})
    if (!item) return notFound(res)
    return ok(res, item)
  })
  r.post('/:id/assign', (req, res) => {
    const item = getEntity('pda', req.params.id)
    if (!item) return notFound(res)
    const { livreurUserId } = req.body ?? {}
    const updated = updateEntity('pda', req.params.id, { assignedToUserId: livreurUserId, assignedTo: livreurUserId ?? null } as any)
    return ok(res, updated)
  })

  return r
}

function pdaSyncRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  r.post('/', (req, res) => {
    const { tourneeId, scans: scanData = [], photos = [] } = req.body ?? {}
    const createdScans = scanData.map((s: any) => createEntity('scans', { ...s, scannedAt: s.scannedAt ?? new Date().toISOString() }))
    return created(res, { tourneeId, scansCreated: createdScans.length, photosReceived: photos.length, status: 'COMPLETED' })
  })
  return r
}

function rfidTagsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'rfid-tags'))
  r.post('/', (req, res) => {
    const body = req.body ?? {}
    if (Array.isArray(body)) {
      const createdTags = body.map((t: any) => createEntity('rfid-tags', { ...t, status: t.status ?? 'ACTIVE', createdAt: new Date().toISOString() }))
      return created(res, createdTags)
    }
    return created(res, createEntity('rfid-tags', { ...body, status: body.status ?? 'ACTIVE', createdAt: new Date().toISOString() }))
  })
  r.post('/:id/block', (req, res) => {
    const item = getEntity('rfid-tags', req.params.id)
    if (!item) return notFound(res)
    const { reason } = req.body ?? {}
    const updated = updateEntity('rfid-tags', req.params.id, { status: 'BLOCKED', blockReason: reason } as any)
    return ok(res, updated)
  })

  return r
}

// =============================================
// DOMAIN 7: Pickups (Approvisionnement)
// =============================================
function pickupsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'pickups'))
  r.post('/', (req, res) => created(res, createEntity('pickups', { ...req.body, status: req.body?.status ?? 'PENDING', createdAt: new Date().toISOString() })))
  r.get('/:id/vehicles', (req, res) => {
    const pickup = getEntity('pickups', req.params.id)
    if (!pickup) return notFound(res)
    const vehicles = findEntities<EntityMap['trucks']>('trucks', () => true).slice(0, 4)
    return ok(res, vehicles.map((v: any) => ({
      id: v.id,
      plateNumber: v.plateNumber ?? v.licensePlate,
      maxVolumeLiters: v.maxVolumeLiters ?? v.tankCapacityLiters,
      recommended: true,
      utilization: Math.round((pickup as any).requestedQuantityKg / ((v.maxVolumeLiters ?? v.tankCapacityLiters) * 0.5) * 100),
    })))
  })
  r.post('/:id/assign-vehicles', (req, res) => {
    const pickup = getEntity('pickups', req.params.id)
    if (!pickup) return notFound(res)
    const { vehicleIds } = req.body ?? {}
    const updated = updateEntity('pickups', req.params.id, { vehicleIds } as any)
    return ok(res, updated)
  })
  r.patch('/:id/validate', (req, res) => {
    const pickup = getEntity('pickups', req.params.id)
    if (!pickup) return notFound(res)
    const updated = updateEntity('pickups', req.params.id, { ...req.body, status: 'VALIDATED' } as any)
    return ok(res, updated)
  })
  r.post('/:id/start', (req, res) => {
    const pickup = getEntity('pickups', req.params.id)
    if (!pickup) return notFound(res)
    const { vehicleId, driverId, livreurUserId } = req.body ?? {}
    const updated = updateEntity('pickups', req.params.id, { vehicleId, driverId, livreurUserId, status: 'IN_PROGRESS' } as any)
    return ok(res, updated)
  })
  r.post('/:id/complete', (req, res) => {
    const pickup = getEntity('pickups', req.params.id)
    if (!pickup) return notFound(res)
    const updated = updateEntity('pickups', req.params.id, { ...req.body, status: 'COMPLETED' } as any)
    return ok(res, updated)
  })

  return r
}

// =============================================
// DOMAIN 8: Delivery Tours
// =============================================
function toursRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'tours'))
  r.post('/', (req, res) => {
    const body = { ...req.body, status: req.body?.status ?? 'planned', stops: req.body?.checkpoints?.length ?? 0 }
    const tour = createEntity('tours', body)
    if (req.body?.checkpoints) {
      for (const cp of req.body.checkpoints) {
        createEntity('checkpoints', { ...cp, tourId: tour.id, status: cp.status ?? 'PENDING' } as any)
      }
    }
    return created(res, tour)
  })
  r.get('/:id', (req, res) => {
    const tour = getEntity('tours', req.params.id)
    if (!tour) return notFound(res)
    const tourCheckpoints = findEntities('checkpoints', (c: any) => c.tourId === req.params.id)
    const tourScans = findEntities('scans', (s: any) => tourCheckpoints.some((c: any) => c.id === s.checkpointId))
    return ok(res, { ...tour, checkpoints: tourCheckpoints, scans: tourScans })
  })
  r.patch('/:id', (req, res) => {
    const tour = getEntity('tours', req.params.id)
    if (!tour) return notFound(res)
    const updated = updateEntity('tours', req.params.id, req.body ?? {})
    return ok(res, updated)
  })
  r.post('/:id/start', (req, res) => {
    const tour = getEntity('tours', req.params.id)
    if (!tour) return notFound(res)
    const updated = updateEntity('tours', req.params.id, { ...req.body, status: 'IN_PROGRESS', startedAt: req.body?.startedAt ?? new Date().toISOString() } as any)
    return ok(res, updated)
  })
  r.post('/:id/close', (req, res) => {
    const tour = getEntity('tours', req.params.id)
    if (!tour) return notFound(res)
    const updated = updateEntity('tours', req.params.id, { ...req.body, status: 'completed' } as any)
    return ok(res, updated)
  })
  r.get('/:id/replay', (req, res) => {
    const tour = getEntity('tours', req.params.id)
    if (!tour) return notFound(res)
    const tourCheckpoints = findEntities('checkpoints', (c: any) => c.tourId === req.params.id)
    const waypoints = tourCheckpoints
      .filter((c: any) => c.actualLat && c.actualLng)
      .map((c: any, i: number) => ({ sequence: i + 1, lat: c.actualLat, lng: c.actualLng, status: c.status, timestamp: c.actualArrival ?? c.expectedArrival }))
    return ok(res, { type: 'FeatureCollection', features: waypoints.map((w: any) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [w.lng, w.lat] }, properties: w })) })
  })

  return r
}

function checkpointsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.post('/:id/reach', (req, res) => {
    const cp = getEntity('checkpoints', req.params.id)
    if (!cp) return notFound(res)
    const updated = updateEntity('checkpoints', req.params.id, { ...req.body, status: 'REACHED', actualArrival: new Date().toISOString() } as any)
    return ok(res, updated)
  })
  r.post('/:id/skip', (req, res) => {
    const cp = getEntity('checkpoints', req.params.id)
    if (!cp) return notFound(res)
    const updated = updateEntity('checkpoints', req.params.id, { ...req.body, status: 'SKIPPED' } as any)
    return ok(res, updated)
  })

  return r
}

function scansRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.post('/', (req, res) => {
    const scan = createEntity('scans', { ...req.body, scannedAt: req.body?.scannedAt ?? new Date().toISOString() } as any)
    return created(res, scan)
  })

  return r
}

// =============================================
// DOMAIN 9: Declarations & Perequation
// =============================================
function declarationsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'declarations'))
  r.post('/', (req, res) => created(res, createEntity('declarations', req.body ?? {})))
  r.get('/:id/reconcile', (req, res) => {
    const decl = getEntity<EntityMap['declarations']>('declarations', req.params.id)
    if (!decl) return notFound(res)
    const declaredVolume = decl.declaredVolumeKg ?? Math.round(((decl.bottlesIn ?? 0) + (decl.bottlesOut ?? 0)) * 12.5)
    const trackedVolume = Math.round(declaredVolume * (0.85 + Math.random() * 0.3))
    const gap = trackedVolume - declaredVolume
    const rec = createEntity('reconciliations', {
      declarationId: req.params.id,
      marketeurOrgId: decl.marketerOrgId ?? decl.marketeurId,
      declaredVolumeKg: declaredVolume,
      trackedVolumeKg: trackedVolume,
      gapKg: gap,
      gapPct: Math.round((gap / declaredVolume) * 1000) / 10,
      status: 'PENDING_VERIFICATION',
      periodStart: decl.periodStart ?? '2026-07-01',
      periodEnd: decl.periodEnd ?? '2026-07-31',
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
    const item = getEntity('reconciliations', req.params.id)
    if (!item) return notFound(res)
    const updated = updateEntity('reconciliations', req.params.id, { ...req.body, status: 'VERIFIED', verifiedByAgent: true } as any)
    return ok(res, updated)
  })
  r.post('/:id/redressement', (req, res) => {
    const item = getEntity('reconciliations', req.params.id)
    if (!item) return notFound(res)
    const redressement = createEntity('redressements', {
      reconciliationId: req.params.id,
      amountFcfa: req.body?.amountFcfa ?? 0,
      dueDate: req.body?.dueDate ?? '2026-08-30T00:00:00Z',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    } as any)
    return created(res, redressement)
  })

  return r
}

function redressementsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.patch('/:id/pay', (req, res) => {
    const item = getEntity('redressements', req.params.id)
    if (!item) return notFound(res)
    const updated = updateEntity('redressements', req.params.id, { ...req.body, status: 'PAID' } as any)
    return ok(res, updated)
  })

  return r
}

// =============================================
// DOMAIN 10: Risk, Anomalies & Notifications
// =============================================
function anomaliesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'anomalies'))
  r.get('/:id', (req, res) => {
    const item = getEntity('anomalies', req.params.id)
    if (!item) return notFound(res)
    return ok(res, item)
  })
  r.patch('/:id/assign', (req, res) => {
    const item = getEntity('anomalies', req.params.id)
    if (!item) return notFound(res)
    const updated = updateEntity('anomalies', req.params.id, { ...req.body, status: 'ASSIGNE' } as any)
    return ok(res, updated)
  })
  r.patch('/:id/resolve', (req, res) => {
    const item = getEntity('anomalies', req.params.id)
    if (!item) return notFound(res)
    const updated = updateEntity('anomalies', req.params.id, { ...req.body, status: 'RESOLU', resolved: true } as any)
    return ok(res, updated)
  })

  return r
}

function risksRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'risks'))
  r.post('/recompute', (req, res) => {
    const { entityId } = req.body ?? {}
    const allRisks = findEntities('risks', (r: any) => !entityId || r.entityId === entityId)
    const recalculated = allRisks.map((r: any) => updateEntity('risks', r.id, {
      score: Math.round((0.1 + Math.random() * 0.9) * 100) / 100,
      computedAt: new Date().toISOString(),
    } as any))
    return ok(res, recalculated)
  })

  return r
}

function notificationGroupsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'notification-groups'))
  r.post('/', (req, res) => created(res, createEntity('notification-groups', req.body ?? {})))
  return r
}

function notificationRulesRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/', (req, res) => paginatedList(req, res, 'notification-rules'))
  r.post('/', (req, res) => created(res, createEntity('notification-rules', req.body ?? {})))
  return r
}

// =============================================
// DOMAIN 11: Reports & Dashboards
// =============================================
function reportsRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/operational', (req, res) => {
    return ok(res, {
      format: req.query.format ?? 'PDF',
      generatedAt: new Date().toISOString(),
      totalTours: countEntities('tours'),
      completedTours: countEntities('tours', (t: any) => t.status === 'completed'),
      totalVolume: Math.round(Math.random() * 200000 + 50000),
      activeVehicles: countEntities('trucks', (t: any) => t.status === 'active'),
      incidentsThisMonth: Math.floor(Math.random() * 15),
    })
  })
  r.get('/financial', (req, res) => {
    return ok(res, {
      format: req.query.format ?? 'PDF',
      period: req.query.period ?? '2026-Q2',
      generatedAt: new Date().toISOString(),
      totalDeclared: Math.round(Math.random() * 500000 + 100000),
      totalTracked: Math.round(Math.random() * 480000 + 100000),
      totalGapKg: Math.round(Math.random() * 20000 - 10000),
      totalRedressementFcfa: Math.round(Math.random() * 5000000),
      paidRedressementFcfa: Math.round(Math.random() * 3000000),
    })
  })
  r.get('/compliance', (req, res) => {
    return ok(res, {
      format: req.query.format ?? 'PDF',
      generatedAt: new Date().toISOString(),
      totalSites: countEntities('sites'),
      verifiedSites: countEntities('sites', (s: any) => (s as any).isVerifiedByAgent),
      missingScanSites: Math.floor(Math.random() * 8),
      lateDeclarationMarketers: Math.floor(Math.random() * 5),
      complianceScore: Math.round(Math.random() * 20 + 75),
    })
  })

  return r
}

function dashboardRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)

  r.get('/super-admin', (_req, res) => {
    return ok(res, {
      totalOrganizations: countEntities('organizations'),
      activeOrganizations: countEntities('organizations', (o: any) => o.active ?? o.isActive ?? true),
      totalUsers: countEntities('users'),
      totalVehicles: countEntities('trucks'),
      activeTours: countEntities('tours', (t: any) => t.status === 'in_progress' || t.status === 'IN_PROGRESS'),
      totalDeclarationsThisMonth: countEntities('declarations'),
      unresolvedAnomalies: countEntities('anomalies', (a: any) => !a.resolved),
      nationalVolume: randomInt(500000, 800000),
      subventionTotal: randomInt(200000000, 500000000),
      topFraudRiskMarketers: ['TotalEnergies Marketers', 'SCDP'] as any,
      monthlyTrends: Array.from({ length: 6 }, (_, i) => ({
        month: `2026-0${i + 1}`,
        volume: randomInt(80000, 150000),
        declarations: randomInt(15, 30),
        anomalies: randomInt(3, 12),
      })),
    })
  })

  r.get('/admin', (_req, res) => {
    return ok(res, {
      organizations: countEntities('organizations'),
      activeUsers: countEntities('users', (u: any) => u.active ?? u.isActive ?? true),
      managedSites: countEntities('sites'),
      pendingDeclarations: countEntities('declarations', (d: any) => d.status === 'submitted' || d.status === 'SUBMITTED'),
      recentAnomalies: countEntities('anomalies', (a: any) => !a.resolved),
      fleetHealth: { operational: randomInt(20, 40), maintenance: randomInt(2, 8), offline: randomInt(1, 5) },
    })
  })

  r.get('/agent', (_req, res) => {
    return ok(res, {
      assignedMarketers: 6,
      pendingDeclarations: randomInt(3, 8),
      pendingVerifications: randomInt(2, 5),
      fraudAlerts: randomInt(0, 3),
      recentAnomalies: findEntities('anomalies', (a: any) => !a.resolved).slice(0, 5).map((a: any) => ({ id: a.id, type: a.type, severity: a.severity, message: a.message, date: a.detectedAt })),
    })
  })

  r.get('/marketeur', (_req, res) => {
    return ok(res, {
      fleetSize: countEntities('trucks'),
      activeTours: countEntities('tours', (t: any) => t.status === 'in_progress' || t.status === 'IN_PROGRESS'),
      monthlyVolume: randomInt(30000, 80000),
      driverPerformance: Array.from({ length: 4 }, (_, i) => ({
        driver: `Driver ${i + 1}`,
        tours: randomInt(10, 30),
        avgEfficiency: Math.round((80 + Math.random() * 20) * 10) / 10,
      })),
      deliveryCompletion: Math.round((85 + Math.random() * 15) * 10) / 10,
    })
  })

  r.get('/livreur', (_req, res) => {
    return ok(res, {
      activeMissions: countEntities('tours', (t: any) => (t.status === 'in_progress' || t.status === 'IN_PROGRESS') && t.livreurUserId),
      completedToday: randomInt(1, 5),
      syncStatus: 'OK',
      pendingUploads: randomInt(0, 3),
      batteryLevel: randomInt(40, 95),
    })
  })

  return r
}

// =============================================
// DOMAIN 12: Monitoring & Infrastructure
// =============================================
function systemRouter(): Router {
  const r = makeRouter()

  r.get('/health', (_req, res) => {
    return ok(res, {
      status: 'healthy',
      database: 'connected',
      redis: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  })

  r.get('/metrics', requireAuth, (_req, res) => {
    return ok(res, {
      cpu: { usage: randomInt(10, 45) },
      memory: { used: randomInt(2, 8) + 'GB', total: '16GB' },
      api: { requestsPerSec: randomInt(50, 200), errorRate: (Math.random() * 3).toFixed(1) + '%' },
      activeConnections: randomInt(20, 150),
    })
  })

  r.get('/audit-logs', requireAuth, (req, res) => paginatedList(req, res, 'audit-logs'))

  return r
}

// =============================================
// Generic Resource CRUD (for entities not needing domain logic)
// =============================================
function genericResourceRouter(): Router {
  const r = makeRouter()
  r.use(requireAuth)
  const names: EntityName[] = ['reports', 'infra', 'transporters', 'vehicle-types', 'delivery-types', 'tour-statuses']

  for (const name of names) {
    r.get(`/${name}`, (req, res) => paginatedList(req, res, name as EntityName))
    r.get(`/${name}/:id`, (req, res) => {
      const item = getEntity(name as EntityName, req.params.id)
      if (!item) return notFound(res)
      return ok(res, item)
    })
    r.post(`/${name}`, (req, res) => created(res, createEntity(name as EntityName, req.body ?? {})))
    r.put(`/${name}/:id`, (req, res) => {
      const item = updateEntity(name as EntityName, req.params.id, req.body ?? {})
      if (!item) return notFound(res)
      return ok(res, item)
    })
    r.delete(`/${name}/:id`, (req, res) => {
      if (!deleteEntity(name as EntityName, req.params.id)) return notFound(res)
      return ok(res, null, 'Supprime')
    })
  }

  return r
}

// =============================================
// Main App
// =============================================
export function createApp(): Router {
  const app = makeRouter()

  // Health
  app.get('/health', (_req, res) => res.json({ success: true, message: 'mock-api up', donnees: null }))

  // Domain 1: Auth
  app.use('/auth', authRouter())
  app.use('/me', meRouter())

  // Domain 2: Organizations
  app.use('/organizations', orgRouter())

  // Domain 3: Sites
  app.use('/sites', sitesRouter())

  // Domain 4: Users & RBAC
  app.use('/users', usersRouter())
  app.use('/user-assignments', userAssignmentsRouter())
  app.use('/custom-roles', customRolesRouter())
  app.use('/user-custom-roles', userCustomRolesRouter())

  // Domain 5: Vehicles & Drivers
  app.use('/vehicles', vehiclesRouter())
  app.use('/drivers', driversRouter())

  // Domain 6: Equipment
  app.use('/pda-devices', pdaRouter())
  app.use('/pda-sync', pdaSyncRouter())
  app.use('/rfid-tags', rfidTagsRouter())

  // Domain 7: Pickups
  app.use('/pickups', pickupsRouter())

  // Domain 8: Tours
  app.use('/tours', toursRouter())
  app.use('/checkpoints', checkpointsRouter())
  app.use('/scans', scansRouter())

  // Domain 9: Declarations & Perequation
  app.use('/declarations', declarationsRouter())
  app.use('/reconciliations', reconciliationsRouter())
  app.use('/redressements', redressementsRouter())

  // Domain 10: Risk, Anomalies & Notifications
  app.use('/anomalies', anomaliesRouter())
  app.use('/risks', risksRouter())
  app.use('/notification-groups', notificationGroupsRouter())
  app.use('/notification-rules', notificationRulesRouter())

  // Domain 11: Reports & Dashboards
  app.use('/reports', reportsRouter())
  app.use('/dashboard', dashboardRouter())

  // Domain 12: System
  app.use('/system', systemRouter())

  // Generic fallback CRUD
  app.use('/', genericResourceRouter())

  return app
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
