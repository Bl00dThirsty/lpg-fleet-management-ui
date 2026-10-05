import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
let handler: (request: Request) => Promise<Response>
let profile: any
let saved: any
let signBody: any
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
  if (url.pathname.endsWith('/dispatch_profiles')) return Response.json([profile])
  if (url.pathname.endsWith('/dispatch_resources')) {
    if (url.searchParams.get('kind') === 'eq.settings') return Response.json([{ payload: { setting_value: '420' } }])
    if (url.searchParams.get('kind') === 'eq.client-sites') return Response.json([])
    const id = url.searchParams.get('id')?.replace('eq.', '')
    return Response.json(id && resources[id] ? [{ payload: resources[id] }] : [])
  }
  if (url.pathname.endsWith('/dispatch_tours')) {
    if (init?.method === 'POST') { saved = JSON.parse(String(init.body)); return Response.json([saved]) }
    return Response.json(profile.system_role === 'LIVREUR' ? [] : [{ payload: { id: 'mission', loading: { order_image_path: 'mission/proof.png' } }, revision: 1 }])
  }
  if (url.pathname.includes('/object/sign/')) { signBody = JSON.parse(String(init?.body)); return Response.json({ signedURL: '/object/sign/proof?token=test' }) }
  throw new Error(`Unexpected request: ${url.pathname}`)
}
await import('./index.ts')
beforeEach(() => { profile = { account_id: 'planner', org_id: 'sctm', org_type: 'MARKETEUR', system_role: 'MARKETEUR', details: { site_ids: ['destination'] } }; saved = null; signBody = null })
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
