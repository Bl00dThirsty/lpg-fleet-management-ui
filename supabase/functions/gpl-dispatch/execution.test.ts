import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateLoading, recordLoading, recordDelivery } from './execution.ts'
const mission = (type = 'VRAC') => ({
  id: 'pickup',
  mission_kind: 'PICKUP',
  pickup_status: 'VALIDATED',
  status: 'PLANNED',
  type,
  requested_quantity: 2,
  checkpoints: [
    { id: 'depot', sequence: 1, status: 'PENDING' },
    { id: 'destination', sequence: 2, status: 'PENDING', expected_quantity: 2 },
  ],
})
test('pickup needs a receipt image, including bottled LPG', () => {
  assert.throws(() => validateLoading(mission(), [], false), /photo/)
  assert.throws(
    () => validateLoading(mission('BOUTEILLES50KG'), ['A', 'B'], false),
    /photo/,
  )
  assert.throws(
    () => validateLoading(mission('BOUTEILLES50KG'), ['A'], true),
    /bouteilles/,
  )
  assert.deepEqual(
    validateLoading(mission('BOUTEILLES50KG'), ['A', 'B'], true),
    ['A', 'B'],
  )
})
test('pickup loading persists proof and starts the mission', () => {
  const row: any = mission()
  recordLoading(row, [], 'pickup/photo.jpg', 'driver', '2026-10-04T10:00:00Z')
  assert.equal(row.pickup_status, 'INPROGRESS')
  assert.equal(row.status, 'INPROGRESS')
  assert.equal(row.loading.order_image_path, 'pickup/photo.jpg')
  assert.equal(row.loaded_quantity, 2)
  recordDelivery(
    row,
    { checkpoint_id: 'destination', quantity: 2 },
    'driver',
    '2026-10-04T11:00:00Z',
  )
  assert.equal(row.delivered_quantity, 2)
  assert.equal(row.checkpoints[1].status, 'COMPLETED')
  recordDelivery(
    row,
    { checkpoint_id: 'destination', quantity: 2 },
    'driver',
    '2026-10-04T11:01:00Z',
  )
  assert.equal(row.delivered_quantity, 2)
})
test('a delivery tour still starts on its first delivery, not loading', () => {
  const row: any = { ...mission(), mission_kind: 'DELIVERY' }
  recordLoading(row, [], 'tour/photo.jpg', 'driver', '2026-10-04T10:00:00Z')
  assert.equal(row.status, 'PLANNED')
  assert.equal(row.started_at, undefined)
  recordDelivery(
    row,
    { checkpoint_id: 'destination', quantity: 2 },
    'driver',
    '2026-10-04T11:00:00Z',
  )
  assert.equal(row.status, 'INPROGRESS')
})
test('delivery without loading, excessive quantities and reused bottles are refused', () => {
  assert.throws(
    () =>
      recordDelivery(
        mission(),
        { checkpoint_id: 'destination', quantity: 2 },
        'driver',
        'now',
      ),
    /chargement/,
  )
  const row: any = mission('BOUTEILLES50KG')
  recordLoading(row, ['A', 'B'], 'pickup/photo.jpg', 'driver', 'now')
  assert.throws(
    () =>
      recordDelivery(
        row,
        { checkpoint_id: 'destination', tags: ['C'] },
        'driver',
        'now',
      ),
    /chargement/,
  )
  assert.throws(
    () =>
      recordDelivery(
        row,
        { checkpoint_id: 'destination', tags: ['A', 'A'] },
        'driver',
        'now',
      ),
    /deux fois/,
  )
})
