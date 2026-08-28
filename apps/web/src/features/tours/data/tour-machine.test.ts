import { describe, expect, it } from 'vitest'
import {
  canTransition,
  nextStatuses,
  tourActions,
  validateTour,
  resolveSlaThresholds,
  tourSlaFlags,
  applyAction,
  TOUR_ACTION_LABELS,
} from './tour-machine'
import type { DeliveryTour, Setting, TransporterContract } from '@lpg/types'
import { curated } from '@lpg/mock-data'

const THRESHOLDS = { transporterAckTimeoutHours: 4, unassignedAlertHours: 12 }

function baseExternal(over: Partial<DeliveryTour> = {}): DeliveryTour {
  return {
    id: 't-1',
    marketeur_org_id: 'org-0002-sctm-0000-000000000001',
    execution_mode: 'EXTERNAL',
    transporter_org_id: 'org-0010-translog----000000000001',
    vehicle_id: null,
    driver_id: null,
    livreur_user_id: null,
    assigned_by_transporter_user_id: null,
    transporter_assigned_at: null,
    type: 'VRAC',
    status: 'DRAFT',
    requested_quantity: 10,
    loaded_quantity: null,
    delivered_quantity: null,
    started_at: null,
    closed_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
    created_by: null,
    updated_by: null,
    ...over,
  }
}

describe('tour-machine transitions', () => {
  describe('canTransition', () => {
    it('allows INTERNAL forward chain DRAFT→PLANNED→INPROGRESS→CHECKPOINTACTIVE→CLOSED', () => {
      expect(canTransition('DRAFT', 'PLANNED', 'INTERNAL')).toBe(true)
      expect(canTransition('PLANNED', 'INPROGRESS', 'INTERNAL')).toBe(true)
      expect(canTransition('INPROGRESS', 'CHECKPOINTACTIVE', 'INTERNAL')).toBe(true)
      expect(canTransition('CHECKPOINTACTIVE', 'CLOSED', 'INTERNAL')).toBe(true)
    })

    it('allows EXTERNAL forward chain DRAFT→PENDINGTRANSPORTERACK→ACKNOWLEDGED→INPROGRESS→CHECKPOINTACTIVE→CLOSED', () => {
      expect(canTransition('DRAFT', 'PENDINGTRANSPORTERACK', 'EXTERNAL')).toBe(true)
      expect(canTransition('PENDINGTRANSPORTERACK', 'ACKNOWLEDGED', 'EXTERNAL')).toBe(true)
      expect(canTransition('ACKNOWLEDGED', 'INPROGRESS', 'EXTERNAL')).toBe(true)
      expect(canTransition('INPROGRESS', 'CHECKPOINTACTIVE', 'EXTERNAL')).toBe(true)
      expect(canTransition('CHECKPOINTACTIVE', 'CLOSED', 'EXTERNAL')).toBe(true)
    })

    it('disallows skip-ahead on either chain', () => {
      expect(canTransition('DRAFT', 'CLOSED', 'EXTERNAL')).toBe(false)
      expect(canTransition('PLANNED', 'CLOSED', 'EXTERNAL')).toBe(false)
    })

    it('disallows backward transitions', () => {
      expect(canTransition('CLOSED', 'CHECKPOINTACTIVE', 'EXTERNAL')).toBe(false)
      expect(canTransition('CHECKPOINTACTIVE', 'INPROGRESS', 'EXTERNAL')).toBe(false)
      expect(canTransition('ACKNOWLEDGED', 'PENDINGTRANSPORTERACK', 'EXTERNAL')).toBe(false)
    })

    it('disallows EXTERNAL from skipping acknowledgement', () => {
      expect(canTransition('PENDINGTRANSPORTERACK', 'INPROGRESS', 'EXTERNAL')).toBe(false)
    })

    it('allows cancel only from pre-rollout states', () => {
      const cancellable = ['DRAFT', 'PLANNED', 'PENDINGTRANSPORTERACK', 'ACKNOWLEDGED'] as const
      for (const from of cancellable) {
        expect(canTransition(from, 'CANCELLED', 'EXTERNAL')).toBe(true)
      }
      for (const from of ['DRAFT', 'PLANNED'] as const) {
        expect(canTransition(from, 'CANCELLED', 'INTERNAL')).toBe(true)
      }
    })

    it('disallows cancel once the tour is underway', () => {
      for (const mode of ['INTERNAL', 'EXTERNAL'] as const) {
        expect(canTransition('INPROGRESS', 'CANCELLED', mode)).toBe(false)
        expect(canTransition('CHECKPOINTACTIVE', 'CANCELLED', mode)).toBe(false)
      }
    })

    it('disallows transitions out of terminal states (closed/cancelled)', () => {
      expect(canTransition('CLOSED', 'CANCELLED', 'EXTERNAL')).toBe(false)
      expect(canTransition('CANCELLED', 'PLANNED', 'EXTERNAL')).toBe(false)
    })
  })

  describe('nextStatuses', () => {
    it('lists legal next statuses for an EXTERNAL DRAFT', () => {
      expect(nextStatuses('DRAFT', 'EXTERNAL')).toEqual(
        expect.arrayContaining(['PENDINGTRANSPORTERACK', 'CANCELLED']),
      )
      expect(nextStatuses('DRAFT', 'EXTERNAL')).not.toContain('CLOSED')
    })

    it('lists PLANNED next statuses for INTERNAL', () => {
      expect(nextStatuses('PLANNED', 'INTERNAL')).toEqual(
        expect.arrayContaining(['INPROGRESS', 'CANCELLED']),
      )
    })

    it('exposes close only from CHECKPOINTACTIVE', () => {
      expect(nextStatuses('CHECKPOINTACTIVE', 'EXTERNAL')).toEqual(['CLOSED'])
    })
  })

  describe('tourActions', () => {
    it('offers send-to-transporter + cancel on an EXTERNAL DRAFT', () => {
      const actions = tourActions(baseExternal({ status: 'DRAFT' }))
      expect(actions).toEqual(['cancel', 'send-to-transporter'])
    })

    it('offers acknowledge + cancel on PENDINGTRANSPORTERACK', () => {
      const actions = tourActions(baseExternal({ status: 'PENDINGTRANSPORTERACK' }))
      expect(actions).toEqual(['acknowledge', 'cancel'])
    })

    it('offers start + cancel on ACKNOWLEDGED', () => {
      const actions = tourActions(baseExternal({ status: 'ACKNOWLEDGED' }))
      expect(actions).toEqual(['cancel', 'start'])
    })

    it('offers plan + cancel on an INTERNAL DRAFT', () => {
      const actions = tourActions(baseExternal({ execution_mode: 'INTERNAL', status: 'DRAFT' }))
      expect(actions).toEqual(['cancel', 'plan'])
    })

    it('exposes no actions on terminal CLOSED', () => {
      expect(tourActions(baseExternal({ status: 'CLOSED' }))).toEqual([])
    })

    it('has French labels for every action', () => {
      for (const key of Object.keys(TOUR_ACTION_LABELS)) {
        expect(TOUR_ACTION_LABELS[key as keyof typeof TOUR_ACTION_LABELS]).toBeTruthy()
      }
    })
  })
})

describe('tour-machine validation', () => {
  it.each([
    ['suspended', { is_active: false }],
    ['unaccepted', { transporter_accepted_at: null }],
    ['expired', { ended_at: '2026-01-01T00:00:00.000Z' }],
    ['without proof', { contract_document_url: null }],
  ])('rejects EXTERNAL with a %s contract', (_name, overrides) => {
    const contract = {
      ...curated.transporter_contracts[0],
      ...overrides,
      marketeur_org_id: 'org-0002-sctm-0000-000000000001',
      transporter_org_id: 'org-0010-translog----000000000001',
    } as TransporterContract
    const result = validateTour(baseExternal(), { contracts: [contract] })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Aucun contrat actif avec ce transporteur.')
  })

  it('accepts EXTERNAL with a derived ACTIVE contract', () => {
    const result = validateTour(baseExternal(), { contracts: [curated.transporter_contracts[0]!] })
    expect(result.valid).toBe(true)
  })

  it('passes a fully-populated INTERNAL tour', () => {
    const tour = {
      execution_mode: 'INTERNAL',
      vehicle_id: 'v-1',
      driver_id: 'd-1',
      livreur_user_id: 'u-1',
      assigned_by_transporter_user_id: null,
      started_at: '2026-01-01T01:00:00.000Z',
      closed_at: '2026-01-01T02:00:00.000Z',
    }
    expect(validateTour(tour as DeliveryTour).valid).toBe(true)
  })

  it('flags chk_tournee_internal when INTERNAL lacks vehicle/driver/livreur', () => {
    const tour = baseExternal({
      execution_mode: 'INTERNAL',
      vehicle_id: null,
      driver_id: null,
      livreur_user_id: null,
      assigned_by_transporter_user_id: null,
    })
    const res = validateTour(tour)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('chk_tournee_internal'))).toBe(true)
  })

  it('flags chk_tournee_external when EXTERNAL has no transporter', () => {
    const tour = baseExternal({ transporter_org_id: null })
    const res = validateTour(tour)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('chk_tournee_external'))).toBe(true)
  })

  it('rejects EXTERNAL without an active contract', () => {
    const tour = baseExternal({ transporter_org_id: 'org-none' })
    const res = validateTour(tour)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('Aucun contrat actif'))).toBe(true)
  })

  it('accepts EXTERNAL with an active contract', () => {
    const tour = baseExternal({
      marketeur_org_id: 'org-0002-sctm-0000-000000000001',
      transporter_org_id: 'org-0010-translog----000000000001',
    })
    expect(validateTour(tour).valid).toBe(true)
  })

  it('rejects EXTERNAL carrying a crew before acknowledge', () => {
    const tour = baseExternal({
      vehicle_id: 'veh-0001-lt1123ub',
      driver_id: 'driver-0003-youssouf-hamadou',
      livreur_user_id: 'user-0010-sctm-livreur1',
    })
    const res = validateTour(tour)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('chk_tournee_external_crew'))).toBe(true)
  })

  it('allows transporter-assigned crew once acknowledged', () => {
    const tour = baseExternal({
      status: 'ACKNOWLEDGED',
      type: 'BOUTEILLES50KG',
      vehicle_id: 'veh-0022-lt9902tl',
      driver_id: 'driver-0001-samuel-abanda',
      assigned_by_transporter_user_id: 'user-0025-translog-dispatcher',
      transporter_assigned_at: '2024-11-25T08:00:00Z',
    })
    expect(validateTour(tour).valid).toBe(true)
  })

  it('flags chk_tournee_no_double_assign when INTERNAL has assigned_by_transporter_user_id', () => {
    const tour = baseExternal({
      execution_mode: 'INTERNAL',
      vehicle_id: 'v-1',
      driver_id: 'd-1',
      livreur_user_id: 'u-1',
      assigned_by_transporter_user_id: 'u-assign',
    })
    const res = validateTour(tour)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('chk_tournee_no_double_assign'))).toBe(true)
  })

  it('flags chk_tournee_dates when closed before started', () => {
    const tour = baseExternal({
      started_at: '2026-01-01T02:00:00.000Z',
      closed_at: '2026-01-01T01:00:00.000Z',
    })
    const res = validateTour(tour)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('chk_tournee_dates'))).toBe(true)
  })

  it('passes draft checkpoints with exactly one destination per stop', () => {
    const tour = baseExternal()
    const res = validateTour(tour, {
      checkpoints: [
        { site_id: 'site-a', sequence: 1, expected_quantity: 3000 },
        { client_site_id: 'csite-a', sequence: 2, expected_quantity: 2000 },
      ],
    })
    expect(res.valid).toBe(true)
  })

  it('flags chk_checkpoint_exclusive when a stop has both site_ids', () => {
    const tour = baseExternal()
    const res = validateTour(tour, {
      checkpoints: [{ site_id: 'site-a', client_site_id: 'csite-a', sequence: 1, expected_quantity: 3000 }],
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('chk_checkpoint_exclusive'))).toBe(true)
  })

  it('flags chk_checkpoint_exclusive when a stop has no destination', () => {
    const tour = baseExternal()
    const res = validateTour(tour, {
      checkpoints: [{ sequence: 1, expected_quantity: 3000 }],
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('chk_checkpoint_exclusive'))).toBe(true)
  })

  it('flags chk_checkpoint_sequence for a sequence < 1', () => {
    const tour = baseExternal()
    const res = validateTour(tour, {
      checkpoints: [{ site_id: 'site-a', sequence: 0, expected_quantity: 3000 }],
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('chk_checkpoint_sequence'))).toBe(true)
  })

  it('flags chk_checkpoint_quantity for a non-positive quantity', () => {
    const tour = baseExternal()
    const res = validateTour(tour, {
      checkpoints: [{ site_id: 'site-a', sequence: 1, expected_quantity: 0 }],
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('chk_checkpoint_quantity'))).toBe(true)
  })
})

describe('tour-machine SLA', () => {
  const settings: Setting[] = [
    { id: 's1', setting_key: 'tournee.transporter_ack_timeout_hours', setting_value: '4', value_type: 'INTEGER', category: 'TOURNEE', description: '', is_encrypted: false, requires_restart: false },
    { id: 's2', setting_key: 'tournee.unassigned_alert_hours', setting_value: '12', value_type: 'INTEGER', category: 'TOURNEE', description: '', is_encrypted: false, requires_restart: false },
  ]

  it('resolveSlaThresholds reads by key from settings', () => {
    const t = resolveSlaThresholds(settings)
    expect(t.transporterAckTimeoutHours).toBe(4)
    expect(t.unassignedAlertHours).toBe(12)
  })

  it('flags TRANSPORTERNOACK when PENDINGTRANSPORTERACK older than timeout', () => {
    const tooOld = '2026-01-01T00:00:00.000Z'
    const tour = baseExternal({
      status: 'PENDINGTRANSPORTERACK',
      created_at: tooOld,
      transporter_assigned_at: tooOld,
    })
    const now = new Date('2026-01-01T05:00:00.000Z')
    expect(tourSlaFlags(tour, THRESHOLDS, now).transporterNoAck).toBe(true)
  })

  it('does not flag TRANSPORTERNOACK within the window', () => {
    const recent = '2026-01-01T00:00:00.000Z'
    const tour = baseExternal({
      status: 'PENDINGTRANSPORTERACK',
      created_at: recent,
      transporter_assigned_at: recent,
    })
    const now = new Date('2026-01-01T02:00:00.000Z')
    expect(tourSlaFlags(tour, THRESHOLDS, now).transporterNoAck).toBe(false)
  })

  it('flags TOURNEEUNASSIGNEDTOOLONG for an EXTERNAL DRAFT without transporter older than threshold', () => {
    const tooOld = '2026-01-01T00:00:00.000Z'
    const tour = baseExternal({
      execution_mode: 'EXTERNAL',
      status: 'DRAFT',
      transporter_org_id: null,
      created_at: tooOld,
    })
    const now = new Date('2026-01-02T02:00:00.000Z')
    expect(tourSlaFlags(tour, THRESHOLDS, now).unassignedTooLong).toBe(true)
  })

  it('does not flag unassigned when already assigned', () => {
    const recent = '2026-01-01T00:00:00.000Z'
    const tour = baseExternal({
      status: 'DRAFT',
      created_at: recent,
    })
    const now = new Date('2026-01-02T02:00:00.000Z')
    expect(tourSlaFlags(tour, THRESHOLDS, now).unassignedTooLong).toBe(false)
  })
})

describe('tour-machine SLA disabled-by-zero', () => {
  const disabled = { transporterAckTimeoutHours: 0, unassignedAlertHours: 0 }

  it('never flags transporterNoAck when the ack timeout is 0', () => {
    const old = '2025-01-01T00:00:00.000Z'
    const tour = baseExternal({
      status: 'PENDINGTRANSPORTERACK',
      created_at: old,
      transporter_assigned_at: old,
    })
    const now = new Date('2026-12-31T00:00:00.000Z')
    expect(tourSlaFlags(tour, disabled, now).transporterNoAck).toBe(false)
  })

  it('never flags unassignedTooLong when the unassigned threshold is 0', () => {
    const old = '2025-01-01T00:00:00.000Z'
    const tour = baseExternal({
      execution_mode: 'EXTERNAL',
      status: 'DRAFT',
      transporter_org_id: null,
      created_at: old,
    })
    const now = new Date('2026-12-31T00:00:00.000Z')
    expect(tourSlaFlags(tour, disabled, now).unassignedTooLong).toBe(false)
  })
})

describe('tour-machine mode isolation', () => {
  it('rejects EXTERNAL-only transitions on the INTERNAL chain', () => {
    // DRAFT on INTERNAL may only go to PLANNED, never to PENDINGTRANSPORTERACK.
    expect(canTransition('DRAFT', 'PENDINGTRANSPORTERACK', 'INTERNAL')).toBe(false)
    expect(canTransition('DRAFT', 'ACKNOWLEDGED', 'INTERNAL')).toBe(false)
  })

  it('rejects INTERNAL-only transitions on the EXTERNAL chain', () => {
    // DRAFT on EXTERNAL may only go to PENDINGTRANSPORTERACK, never to PLANNED.
    expect(canTransition('DRAFT', 'PLANNED', 'EXTERNAL')).toBe(false)
    // PLANNED is not on the EXTERNAL chain at all.
    expect(canTransition('PLANNED', 'INPROGRESS', 'EXTERNAL')).toBe(false)
  })
})

describe('tour-machine applyAction', () => {
  const now = new Date('2026-03-01T08:00:00.000Z')

  it('start stamps started_at when absent', () => {
    const tour = baseExternal({ status: 'ACKNOWLEDGED', started_at: null })
    const next = applyAction(tour, 'start', now)
    expect(next.status).toBe('INPROGRESS')
    expect(next.started_at).toBe(now.toISOString())
  })

  it('start preserves an existing started_at (idempotent)', () => {
    const original = '2026-02-28T10:00:00.000Z'
    const tour = baseExternal({ status: 'ACKNOWLEDGED', started_at: original })
    const next = applyAction(tour, 'start', now)
    expect(next.started_at).toBe(original)
  })

  it('close stamps closed_at and backfills started_at when missing', () => {
    const tour = baseExternal({ status: 'CHECKPOINTACTIVE', started_at: null, closed_at: null })
    const next = applyAction(tour, 'close', now)
    expect(next.status).toBe('CLOSED')
    expect(next.closed_at).toBe(now.toISOString())
    expect(next.started_at).toBe(now.toISOString())
  })

  it('close preserves an existing started_at', () => {
    const original = '2026-02-28T10:00:00.000Z'
    const tour = baseExternal({ status: 'CHECKPOINTACTIVE', started_at: original, closed_at: null })
    const next = applyAction(tour, 'close', now)
    expect(next.started_at).toBe(original)
    expect(next.closed_at).toBe(now.toISOString())
  })

  it('acknowledge stamps transporter_assigned_at when absent', () => {
    const tour = baseExternal({ status: 'PENDINGTRANSPORTERACK', transporter_assigned_at: null })
    const next = applyAction(tour, 'acknowledge', now)
    expect(next.status).toBe('ACKNOWLEDGED')
    expect(next.transporter_assigned_at).toBe(now.toISOString())
  })

  it('acknowledge preserves an existing transporter_assigned_at (idempotent)', () => {
    const original = '2026-02-27T09:00:00.000Z'
    const tour = baseExternal({ status: 'PENDINGTRANSPORTERACK', transporter_assigned_at: original })
    const next = applyAction(tour, 'acknowledge', now)
    expect(next.transporter_assigned_at).toBe(original)
  })

  it('send-to-transporter stamps sent_to_transporter_at and nothing else', () => {
    const tour = baseExternal({ status: 'DRAFT', started_at: null, closed_at: null })
    const send = applyAction(tour, 'send-to-transporter', now)
    expect(send.status).toBe('PENDINGTRANSPORTERACK')
    expect(send.sent_to_transporter_at).toBe(now.toISOString())
    // applyAction is a patch-producer: it only emits the fields a given action
    // touches. start/close/acknowledge carry their timestamp; other fields are
    // left undefined so the store merges `{...tour, ...patch}`.
    expect(send.started_at).toBeUndefined()
    expect(send.closed_at).toBeUndefined()
    expect(send.transporter_assigned_at).toBeUndefined()
  })

  it('send-to-transporter is idempotent for sent_to_transporter_at', () => {
    const original = '2026-02-25T09:00:00.000Z'
    const tour = baseExternal({ status: 'DRAFT', sent_to_transporter_at: original })
    const send = applyAction(tour, 'send-to-transporter', now)
    expect(send.sent_to_transporter_at).toBe(original)
  })

  it('plan transitions an INTERNAL DRAFT to PLANNED', () => {
    const tour = baseExternal({ execution_mode: 'INTERNAL', status: 'DRAFT' })
    const planned = applyAction(tour, 'plan', now)
    expect(planned.status).toBe('PLANNED')
  })

  it('cancel returns a status-only patch', () => {
    const tour = baseExternal({ status: 'ACKNOWLEDGED' })
    const cancel = applyAction(tour, 'cancel', now)
    expect(cancel.status).toBe('CANCELLED')
    expect(cancel.started_at).toBeUndefined()
    expect(cancel.closed_at).toBeUndefined()
    expect(cancel.transporter_assigned_at).toBeUndefined()
  })

  it('rejects an action that is not legal for the current status', () => {
    const underway = baseExternal({ status: 'INPROGRESS' })
    expect(() => applyAction(underway, 'cancel', now)).toThrow(/Transition interdite/)
    const external = baseExternal({ status: 'DRAFT' })
    expect(() => applyAction(external, 'plan', now)).toThrow(/Transition interdite/)
  })

  it('acknowledge with a transporter-org crew patch assigns the crew', () => {
    const tour = baseExternal({
      status: 'PENDINGTRANSPORTERACK',
      transporter_org_id: 'org-0010-translog----000000000001',
    })
    const next = applyAction(tour, 'acknowledge', now, {
      vehicle_id: 'veh-0022-lt9902tl',
      driver_id: 'driver-0001-samuel-abanda',
      livreur_user_id: 'user-0025-translog-dispatcher',
      assigned_by_transporter_user_id: 'user-0024-translog-admin',
    })
    expect(next.status).toBe('ACKNOWLEDGED')
    expect(next.transporter_assigned_at).toBe(now.toISOString())
    expect(next.vehicle_id).toBe('veh-0022-lt9902tl')
    expect(next.driver_id).toBe('driver-0001-samuel-abanda')
    expect(next.livreur_user_id).toBe('user-0025-translog-dispatcher')
    expect(next.assigned_by_transporter_user_id).toBe('user-0024-translog-admin')
  })

  it('acknowledge rejects a vehicle outside the transporter org', () => {
    const tour = baseExternal({
      status: 'PENDINGTRANSPORTERACK',
      transporter_org_id: 'org-0010-translog----000000000001',
    })
    // veh-0001-lt1123ub belongs to org-0002 (marketeur), not org-10.
    expect(() =>
      applyAction(tour, 'acknowledge', now, {
        vehicle_id: 'veh-0001-lt1123ub',
        driver_id: 'driver-0001-samuel-abanda',
        livreur_user_id: 'user-0025-translog-dispatcher',
      }),
    ).toThrow(/n'appartient pas à l'organisation du transporteur/)
  })

  it('acknowledge rejects a missing crew id', () => {
    const tour = baseExternal({ status: 'PENDINGTRANSPORTERACK' })
    expect(() =>
      applyAction(tour, 'acknowledge', now, {
        vehicle_id: 'veh-does-not-exist',
        driver_id: 'driver-0001-samuel-abanda',
        livreur_user_id: 'user-0025-translog-dispatcher',
      }),
    ).toThrow(/Véhicule introuvable/)
  })

  it('acknowledge with a patch only sets the provided crew fields', () => {
    const tour = baseExternal({ status: 'PENDINGTRANSPORTERACK' })
    const next = applyAction(tour, 'acknowledge', now, { vehicle_id: 'veh-0022-lt9902tl' })
    expect(next.vehicle_id).toBe('veh-0022-lt9902tl')
    expect(next.driver_id).toBeUndefined()
    expect(next.livreur_user_id).toBeUndefined()
    expect(next.assigned_by_transporter_user_id).toBeUndefined()
  })
})
