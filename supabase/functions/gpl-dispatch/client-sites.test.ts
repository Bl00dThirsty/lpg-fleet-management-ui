import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canEditClientSite, buildClientSitePatch } from './client-sites.ts'
const site = { id: 'site', client_org_id: 'client', current_marketeur_org_id: 'sctm', name: 'Bastos', geo_point: [11.5, 3.8], is_verified: true, verified_at: 'old', verified_by: 'agent', geo_confidence_score: 90, delivery_count: 78 }
test('preserves history and resets verification only when coordinates change', () => {
  const next = buildClientSitePatch(site, { geo_point: [11.509708527395427, 3.8931714687015564], is_verified: true, delivery_count: 0 }, 'actor', 'now')
  assert.equal(next.delivery_count, 78)
  assert.equal(next.is_verified, false)
  assert.equal(next.verified_at, null)
  assert.equal(buildClientSitePatch(site, { name: 'DOVV Bastos' }, 'actor', 'now').is_verified, true)
})
test('rejects invalid GPS and reassignment to another client', () => {
  assert.throws(() => buildClientSitePatch(site, { geo_point: [11, 100] }, 'actor', 'now'), /GPS/)
  assert.throws(() => buildClientSitePatch(site, { client_org_id: 'other' }, 'actor', 'now'), /client/)
})
test('enforces own marketer scope and custom permissions', () => {
  assert.equal(canEditClientSite({ system_role: 'MARKETEUR', org_id: 'other' }, site), false)
  assert.equal(canEditClientSite({ system_role: 'MARKETEUR', org_id: 'sctm' }, site), true)
  assert.equal(canEditClientSite({ system_role: 'AGENT', org_id: 'sctm', details: { custom_roles: [{ is_active: true, permissions_json: { 'clients.write': true } }] } }, site), true)
  assert.equal(canEditClientSite({ system_role: 'AGENT', org_id: 'sctm' }, site), false)
})
