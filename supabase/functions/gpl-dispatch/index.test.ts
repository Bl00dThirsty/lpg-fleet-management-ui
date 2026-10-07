import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
let handler: (request: Request) => Promise<Response>
let profile: any
let saved: any
let signBody: any
let resourcesPosted: Record<string, any>
let profilePosted: any
let authUserCreated: any
const resources: Record<string, any> = {
  source: { id: 'source', org_id: 'snh', name: 'SNH dépôt' },
  destination: { id: 'destination', org_id: 'sctm', name: 'SCTM dépôt' },
  snh: { id: 'snh', code: 'SNH', type: 'FOURNISSEUR' },
  truck: { id: 'truck', org_id: 'sctm', type: 'VRAC' },
  driver: { id: 'driver', org_id: 'sctm' },
  courier: { id: 'courier', org_id: 'sctm', system_role: 'LIVREUR' },
}
;(globalThis as any).Deno = { env: { get: (key: string) => key === 'SUPABASE_URL' ? 'https://dispatch.test' : 'test-key' }, serve: (callback: typeof handler) => { handler = callback } }
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input))
  if (url.pathname === '/auth/v1/user') return Response.json({ id: 'auth-test' })
  if (url.pathname === '/auth/v1/admin/users') {
    if (init?.method === 'POST') {
      authUserCreated = { ...JSON.parse(String(init.body)), id: 'auth-new' }
      return Response.json(authUserCreated)
    }
    if (init?.method === 'DELETE') return Response.json({})
    return Response.json({ users: [{ id: 'auth-test', email: 'planner@sctm.cm' }] })
  }
  if (url.pathname.endsWith('/activity_statuses'))
    return Response.json([
      {
        activity: 'TOUR',
        status_value: 'DRAFT',
        code: 'BRN',
        label: 'Brouillon',
        description: 'Tournée en cours de préparation, non encore transmise.',
        tone: 'slate',
        sort_order: 1,
        is_active: true,
      },
    ])
  if (url.pathname.endsWith('/dispatch_profiles')) {
    if (init?.method === 'POST') {
      profilePosted = JSON.parse(String(init.body))
      return Response.json([profilePosted])
    }
    if (url.searchParams.has('account_id')) return Response.json([])
    return Response.json([profile])
  }
  if (url.pathname.endsWith('/dispatch_resources')) {
    if (init?.method === 'POST') {
      const row = JSON.parse(String(init.body))
      resourcesPosted[row.kind] = row
      return Response.json([row])
    }
    if (url.searchParams.get('kind') === 'eq.settings') return Response.json([{ payload: { setting_value: '420' } }])
    if (url.searchParams.get('kind') === 'eq.client-sites') return Response.json([])
    const id = url.searchParams.get('id')?.replace('eq.', '')
    return Response.json(id && resources[id] ? [{ payload: resources[id] }] : [])
  }
  if (url.pathname.endsWith('/dispatch_tours')) {
    if (init?.method === 'POST') {
      saved = JSON.parse(String(init.body))
      return Response.json([saved])
    }
    if (init?.method === 'PATCH') {
      saved = JSON.parse(String(init.body))
      return Response.json([saved])
    }
    const id = url.searchParams.get('id')?.replace('eq.', '')
    if (id && toursById[id]) {
      return Response.json([
        { payload: toursById[id], revision: toursById[id].revision || 1 },
      ])
    }
    return Response.json(
      profile.system_role === 'LIVREUR'
        ? []
        : [
            {
              payload: {
                id: 'mission',
                loading: { order_image_path: 'mission/proof.png' },
              },
              revision: 1,
            },
          ],
    )
  }
  if (url.pathname.includes('/object/sign/')) { signBody = JSON.parse(String(init?.body)); return Response.json({ signedURL: '/object/sign/proof?token=test' }) }
  throw new Error(`Unexpected request: ${url.pathname}`)
}
await import('./index.ts')
let toursById: Record<string, any> = {}
beforeEach(() => {
  profile = { account_id: 'planner', auth_id: 'auth-test', org_id: 'sctm', org_type: 'MARKETEUR', system_role: 'MARKETEUR', details: { site_ids: ['destination'] } }
  saved = null
  signBody = null
  resourcesPosted = {}
  profilePosted = null
  authUserCreated = null
  toursById = {}
})
const plan = { tour_code: 'TEST-ENL', marketeur_org_id: 'sctm', type: 'VRAC', execution_mode: 'INTERNAL', requested_quantity: 2, vehicle_id: 'truck', driver_id: 'driver', livreur_user_id: 'courier', source_site_id: 'source', destination_site_id: 'destination', scheduled_at: '2026-10-06T10:00:00Z' }
const request = (path: string, body?: unknown, authenticated = true) => handler(new Request(`https://dispatch.test/gpl-dispatch${path}`, { method: body ? 'POST' : 'GET', headers: { ...(authenticated ? { Authorization: 'Bearer test-user-token' } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }))
test('unauthenticated callers cannot read missions', async () => { assert.equal((await request('/tours', undefined, false)).status, 401) })
test('driver cannot obtain planning crew options', async () => { profile.system_role = 'LIVREUR'; assert.equal((await request('/pickup-options')).status, 403) })
test('pickup creation persists schedule and two checkpoints', async () => {
  const response = await request('/pickups', plan)
  assert.equal(response.status, 201)
  assert.equal(saved.payload.mission_kind, 'PICKUP')
  assert.equal(saved.payload.pickup_status, 'VALIDATED')
  assert.equal(saved.payload.checkpoints.length, 2)
  assert.equal(saved.payload.livreur_user_id, 'courier')
  assert.equal(saved.payload.scheduled_at, '2026-10-06T10:00:00.000Z')
})
test('unassigned destinations and foreign organizations are refused', async () => {
  profile.details.site_ids = ['other-site']
  assert.equal((await request('/pickups', plan)).status, 403)
  assert.equal((await request('/pickups', { ...plan, marketeur_org_id: 'foreign' })).status, 403)
  assert.equal(saved, null)
})
test('fractional bottle plans and unknown suppliers are refused', async () => {
  assert.equal((await request('/pickups', { ...plan, type: 'BOUTEILLES50KG', requested_quantity: 1.5 })).status, 400)
  assert.equal((await request('/pickups', { ...plan, source_site_id: 'destination' })).status, 400)
  assert.equal(saved, null)
})
test('document links use configured expiry after mission access check', async () => {
  assert.equal((await request('/tours/mission/documents')).status, 200)
  assert.equal(signBody.expiresIn, 420)
  signBody = null
  profile.system_role = 'LIVREUR'
  assert.equal((await request('/tours/mission/documents')).status, 404)
  assert.equal(signBody, null)
})
test('account directory is public and shaped for the login picker', async () => {
  const response = await request('/auth/accounts', undefined, false)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.success, true)
  assert.equal(body.data[0].id, 'planner')
  assert.equal(body.data[0].email, 'planner@sctm.cm')
  assert.equal(body.data[0].system_role, 'MARKETEUR')
  assert.equal(body.data[0].org_type, 'MARKETEUR')
  assert.equal(body.data[0].org_id, 'sctm')
})
test('organization creation is refused outside the CSPH administration', async () => {
  const response = await request('/organizations', {
    name: 'TransLog',
    type: 'TRANSPORTEUR',
  })
  assert.equal(response.status, 403)
  assert.equal(resourcesPosted.organizations, undefined)
})
test('CSPH administration creates a transporter organization', async () => {
  profile = {
    account_id: 'csph-super',
    org_id: 'org-csph',
    org_type: 'REGULATEUR',
    system_role: 'SUPERADMIN',
    details: {},
  }
  const response = await request('/organizations', {
    name: 'TransLog Nouveau',
    type: 'TRANSPORTEUR',
    registration_number: 'RC/2026',
    tax_id: 'NIU/9',
    primary_contact_name: 'Paul',
    payment_terms: 45,
  })
  assert.equal(response.status, 201)
  const body = await response.json()
  assert.equal(body.data.type, 'TRANSPORTEUR')
  assert.equal(body.data.is_active, true)
  assert.equal(body.data.created_by, 'csph-super')
  assert.equal(body.data.registration_number, 'RC/2026')
  assert.equal(body.data.primary_contact_name, 'Paul')
  assert.equal(body.data.payment_terms, 45)
  assert.ok(String(body.data.id).startsWith('org-'))
  assert.equal(resourcesPosted.organizations.kind, 'organizations')
  assert.equal(resourcesPosted.organizations.payload.type, 'TRANSPORTEUR')
})
test('marketeur may onboard a CLIENT organization only', async () => {
  const refused = await request('/organizations', {
    name: 'TransExpress',
    type: 'TRANSPORTEUR',
  })
  assert.equal(refused.status, 403)
  const allowed = await request('/organizations', {
    name: 'Fondation Avenir',
    type: 'CLIENT',
  })
  assert.equal(allowed.status, 201)
  assert.equal((await allowed.json()).data.type, 'CLIENT')
})
test('client profile requires a CLIENT-type organization', async () => {
  resources['org-trans'] = { id: 'org-trans', type: 'TRANSPORTEUR', name: 'Trans' }
  resources['org-client'] = { id: 'org-client', type: 'CLIENT', name: 'Fondation' }
  const refused = await request('/clients', { org_id: 'org-trans' })
  assert.equal(refused.status, 400)
  assert.equal(resourcesPosted.clients, undefined)
  const response = await request('/clients', {
    org_id: 'org-client',
    primary_contact_name: 'Amina',
    payment_terms: 45,
  })
  assert.equal(response.status, 201)
  const body = await response.json()
  assert.equal(body.data.org_id, 'org-client')
  assert.equal(body.data.payment_terms, 45)
  assert.equal(resourcesPosted.clients.kind, 'clients')
})
test('account provisioning enforces hierarchy and returns a one-time password', async () => {
  profile = {
    account_id: 'csph-admin',
    org_id: 'org-csph',
    org_type: 'REGULATEUR',
    system_role: 'ADMIN',
    details: {},
  }
  resources['org-trans'] = { id: 'org-trans', type: 'TRANSPORTEUR', name: 'Trans' }
  const escalated = await request('/users/with-auth', {
    email: 'boss@csph.cm',
    first_name: 'Big',
    last_name: 'Boss',
    system_role: 'SUPERADMIN',
    org_id: 'org-trans',
  })
  assert.equal(escalated.status, 403)
  const response = await request('/users/with-auth', {
    email: 'Nouveau@Translog.cm',
    first_name: 'Jean',
    last_name: 'MUKAM',
    system_role: 'TRANSPORTEUR',
    org_id: 'org-trans',
  })
  assert.equal(response.status, 201)
  const body = await response.json()
  assert.ok(body.data.password)
  assert.equal(body.data.email, 'nouveau@translog.cm')
  assert.equal(body.data.system_role, 'TRANSPORTEUR')
  assert.equal(body.data.org_id, 'org-trans')
  assert.equal(authUserCreated.email, 'nouveau@translog.cm')
  assert.equal(authUserCreated.email_confirm, true)
  assert.equal(profilePosted.account_id, body.data.id)
  assert.equal(profilePosted.org_type, 'TRANSPORTEUR')
  assert.equal(profilePosted.system_role, 'TRANSPORTEUR')
  assert.equal(profilePosted.details.email, 'nouveau@translog.cm')
  assert.equal(profilePosted.details.org_name, 'Trans')
  assert.equal(resourcesPosted.users.kind, 'users')
  assert.equal(resourcesPosted.users.payload.id, body.data.id)
})
test('activity statuses are served from the reference table', async () => {
  const response = await request('/activity-statuses')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.success, true)
  assert.equal(body.data[0].activity, 'TOUR')
  assert.equal(body.data[0].status_value, 'DRAFT')
  assert.equal(body.pagination.total, 1)
})
test('send-to-transporter transitions external tour to PENDINGTRANSPORTERACK and is idempotent', async () => {
  toursById['tour-ext-1'] = {
    id: 'tour-ext-1',
    marketeur_org_id: 'sctm',
    execution_mode: 'EXTERNAL',
    transporter_org_id: 'org-trans',
    status: 'PLANNED',
    revision: 1,
  }
  const response = await request('/tours/tour-ext-1/send-to-transporter', {})
  assert.equal(response.status, 200)
  assert.equal(saved.payload.status, 'PENDINGTRANSPORTERACK')
  assert.ok(saved.payload.sent_to_transporter_at)

  // Idempotent call
  toursById['tour-ext-1'].status = 'PENDINGTRANSPORTERACK'
  const repeat = await request('/tours/tour-ext-1/send-to-transporter', {})
  assert.equal(repeat.status, 200)
})
test('transporter acknowledges tour and assigns their own crew', async () => {
  toursById['tour-ext-2'] = {
    id: 'tour-ext-2',
    marketeur_org_id: 'sctm',
    execution_mode: 'EXTERNAL',
    transporter_org_id: 'org-trans',
    type: 'VRAC',
    status: 'PENDINGTRANSPORTERACK',
    revision: 1,
  }
  resources['veh-trans'] = {
    id: 'veh-trans',
    org_id: 'org-trans',
    type: 'VRAC',
    is_active: true,
  }
  resources['driver-trans'] = {
    id: 'driver-trans',
    org_id: 'org-trans',
    is_active: true,
  }
  resources['livreur-trans'] = {
    id: 'livreur-trans',
    org_id: 'org-trans',
    system_role: 'LIVREUR',
    is_active: true,
  }

  // Caller is transporter
  profile = {
    account_id: 'transporter-admin',
    org_id: 'org-trans',
    org_type: 'TRANSPORTEUR',
    system_role: 'TRANSPORTEUR',
    details: {},
  }

  const response = await request('/tours/tour-ext-2/acknowledge', {
    vehicle_id: 'veh-trans',
    driver_id: 'driver-trans',
    livreur_user_id: 'livreur-trans',
  })
  assert.equal(response.status, 200)
  assert.equal(saved.payload.status, 'ACKNOWLEDGED')
  assert.equal(saved.payload.vehicle_id, 'veh-trans')
  assert.ok(saved.payload.transporter_assigned_at)
})
test('PUT /tours/:id updates editable properties and rejects non-editable tours', async () => {
  toursById['tour-mod-1'] = {
    id: 'tour-mod-1',
    marketeur_org_id: 'sctm',
    execution_mode: 'INTERNAL',
    type: 'VRAC',
    requested_quantity: 10,
    status: 'PLANNED',
    revision: 1,
  }
  profile = {
    account_id: 'planner',
    org_id: 'sctm',
    org_type: 'MARKETEUR',
    system_role: 'MARKETEUR',
    details: { site_ids: ['destination'] },
  }

  const putReq = new Request(
    'https://dispatch.test/gpl-dispatch/tours/tour-mod-1',
    {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-user-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requested_quantity: 25 }),
    },
  )
  const response = await handler(putReq)
  assert.equal(response.status, 200)
  assert.equal(saved.payload.requested_quantity, 25)

  // Refuses modification on closed tour
  toursById['tour-mod-1'].status = 'CLOSED'
  const closedReq = new Request(
    'https://dispatch.test/gpl-dispatch/tours/tour-mod-1',
    {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-user-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requested_quantity: 30 }),
    },
  )
  const refused = await handler(closedReq)
  assert.equal(refused.status, 409)
})

