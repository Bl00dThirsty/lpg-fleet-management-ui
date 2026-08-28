import { describe, expect, it, beforeEach } from 'vitest'
import { useToursStore } from './tours-store'
import { useAuthStore } from './auth-store'
import { PERMISSION_DENIED } from '@/lib/security/guards'
import { curated } from '@lpg/mock-data'
import type { DeliveryTour } from '@lpg/types'
import { tourStatusLabels, getTourCargo, getTourVolume } from '@/features/tours/data/tour-activity'
import { useContractsStore } from './contracts-store'

const MARKETEUR_ORG = 'org-0002-sctm-0000-000000000001'
const TRANSPORTEUR_ORG = 'org-0011-expressgpl--000000000001'
const VEHICLE_ID = 'veh-0001-lt1123ub'
const DRIVER_ID = 'driver-0003-youssouf-hamadou'
const LIVREUR_ID = 'user-0010-sctm-livreur1'

const SUPERADMIN_USER = {
  id: 'u-super',
  email: 's@csph.cm',
  first_name: 'S',
  last_name: 'A',
  system_role: 'SUPERADMIN' as const,
  org_type: 'REGULATEUR' as const,
  site_ids: [] as string[],
}

function setAuthUser(system_role: 'SUPERADMIN' | 'AGENT') {
  useAuthStore.setState({ user: { ...SUPERADMIN_USER, id: `u-${system_role.toLowerCase()}`, system_role } })
}

function freshSeed() {
  return {
    tours: curated.delivery_tours.map((t) => ({ ...t })),
    checkpoints: curated.checkpoints.map((c) => ({ ...c })),
  }
}

function freshCuratedWithActiveCerts() {
  const oneYearFromNow = new Date(
    Date.now() + 365 * 24 * 3600 * 1000,
  ).toISOString()
  return {
    ...curated,
    vehicles: curated.vehicles.map((v) =>
      v.type === 'VRAC'
        ? {
            ...v,
            certificate_number: v.certificate_number ?? 'CERT-VRAC-TEST-001',
            certificate_url:
              v.certificate_url ?? 'https://certifs.test/cert.pdf',
            certificate_issued_at:
              v.certificate_issued_at ?? new Date().toISOString(),
            certificate_expiry_at: oneYearFromNow,
          }
        : v,
    ),
  }
}

function inject(tour: Partial<DeliveryTour> & Pick<DeliveryTour, 'id'>) {
  useToursStore.setState((s) => ({ tours: [...s.tours, { ...tour } as DeliveryTour] }))
}

describe('tours store', () => {
  beforeEach(() => {
    useToursStore.setState(freshSeed())
    useContractsStore.setState((state) => ({
      contracts: state.contracts.map((contract) =>
        contract.transporter_org_id === TRANSPORTEUR_ORG
          ? { ...contract, transporter_accepted_at: '2026-01-01T00:00:00.000Z' }
          : contract,
      ),
    }))
    // Guards read the live auth state: a SUPERADMIN clears every permission
    // check so the mutation tests exercise the business logic, not the guard.
    setAuthUser('SUPERADMIN')
    // Validate against a copy of curated with VRAC certs refreshed to one year
    // out — the seeded fixture has expired dates (the demo data simulates
    // renewals due, which would otherwise fail the cert check).
    Object.assign(curated, freshCuratedWithActiveCerts())
  })

  describe('permission guards', () => {
    it('throws PERMISSION_DENIED for createTour when the role lacks tours.create', () => {
      // AGENT holds only tours.read (packages/permissions AGENT_GRANTS); it is
      // genuinely denied tours.create, unlike LIVREUR whose tours.write implies
      // tours.create.
      setAuthUser('AGENT')
      expect(() =>
        useToursStore.getState().createTour({
          marketeur_org_id: MARKETEUR_ORG,
          execution_mode: 'INTERNAL',
          type: 'VRAC',
          requested_quantity: 1000,
          vehicle_id: VEHICLE_ID,
          driver_id: DRIVER_ID,
          livreur_user_id: LIVREUR_ID,
        }),
      ).toThrow(PERMISSION_DENIED)
    })

    it('throws PERMISSION_DENIED for performAction when the role lacks the action permission', () => {
      setAuthUser('AGENT')
      expect(() => useToursStore.getState().performAction('tour-005', 'acknowledge')).toThrow(
        PERMISSION_DENIED,
      )
    })

    it('throws PERMISSION_DENIED when a MARKETEUR creates a tour for another org', () => {
      // MARKETEUR holds tours.create, so the permission guard passes; the site
      // scope guard (spec §8.1) must reject the cross-org draft.
      useAuthStore.setState({
        user: {
          id: 'u-marketeur',
          email: 'm@total.cm',
          first_name: 'M',
          last_name: 'K',
          system_role: 'MARKETEUR',
          org_type: 'MARKETEUR',
          org_id: 'org-0003-total-0000-000000000001',
          site_ids: ['site-0009-total-bonaberi'],
        },
      })
      expect(() =>
        useToursStore.getState().createTour({
          marketeur_org_id: MARKETEUR_ORG,
          execution_mode: 'INTERNAL',
          type: 'VRAC',
          requested_quantity: 5000,
          vehicle_id: VEHICLE_ID,
          driver_id: DRIVER_ID,
          livreur_user_id: LIVREUR_ID,
        }),
      ).toThrow(PERMISSION_DENIED)
    })

    it('allows a MARKETEUR to create a tour for their own org', () => {
      useAuthStore.setState({
        user: {
          id: 'u-marketeur',
          email: 'm@sctm.cm',
          first_name: 'M',
          last_name: 'K',
          system_role: 'MARKETEUR',
          org_type: 'MARKETEUR',
          org_id: MARKETEUR_ORG,
          site_ids: ['site-0001-sctm-bonaberi'],
        },
      })
      const view = useToursStore.getState().createTour({
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'INTERNAL',
        type: 'VRAC',
        requested_quantity: 5000,
        vehicle_id: VEHICLE_ID,
        driver_id: DRIVER_ID,
        livreur_user_id: LIVREUR_ID,
      })
      expect(view.tourneeStatus).toBe('PLANNED')
    })
  })

  describe('createTour', () => {
    it('creates a valid INTERNAL tour pre-filled with crew', () => {
      const countBefore = useToursStore.getState().tours.length
      const view = useToursStore.getState().createTour({
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'INTERNAL',
        type: 'VRAC',
        requested_quantity: 5000,
        vehicle_id: VEHICLE_ID,
        driver_id: DRIVER_ID,
        livreur_user_id: LIVREUR_ID,
      })

      expect(view.tourneeStatus).toBe('PLANNED')
      expect(view.execution_mode).toBe('INTERNAL')
      expect(tourStatusLabels[view.tourneeStatus]).toBe('Planifiée')
      expect(getTourCargo(view)).toBe('GPL vrac')
      expect(view.reference).toBe('TRP-2401')
      expect(view.originSite.id).toBeDefined()
      expect(typeof view.progressPercent).toBe('number')
      expect(useToursStore.getState().tours.length).toBe(countBefore + 1)
      expect(useToursStore.getState().tours.find((t) => t.id === view.id)).toBeDefined()
    })

    it('creates a valid EXTERNAL tour without crew (transporter assigns later)', () => {
      const view = useToursStore.getState().createTour({
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'EXTERNAL',
        type: 'BOUTEILLES50KG',
        requested_quantity: 200,
        transporter_org_id: TRANSPORTEUR_ORG,
      })

      expect(view.tourneeStatus).toBe('PENDINGTRANSPORTERACK')
      expect(view.execution_mode).toBe('EXTERNAL')
      expect(tourStatusLabels[view.tourneeStatus]).toBe('En attente transporteur')
      expect(getTourCargo(view)).toBe('Bouteilles 50 kg')
      expect(getTourVolume(view)).toBe('200 btl')
    })

    it('throws chk_tournee_internal for an INTERNAL draft without vehicle/driver/livreur', () => {
      expect(() =>
        useToursStore.getState().createTour({
          marketeur_org_id: MARKETEUR_ORG,
          execution_mode: 'INTERNAL',
          type: 'VRAC',
          requested_quantity: 3000,
        }),
      ).toThrow(/chk_tournee_internal/)
    })

    it('throws chk_tournee_external for an EXTERNAL draft without a transporter', () => {
      expect(() =>
        useToursStore.getState().createTour({
          marketeur_org_id: MARKETEUR_ORG,
          execution_mode: 'EXTERNAL',
          type: 'BOUTEILLES50KG',
          requested_quantity: 120,
        }),
      ).toThrow(/chk_tournee_external/)
    })

    it('does not mutate the shared curated fixture', () => {
      const originalLength = curated.delivery_tours.length
      useToursStore.getState().createTour({
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'INTERNAL',
        type: 'VRAC',
        requested_quantity: 1000,
        vehicle_id: VEHICLE_ID,
        driver_id: DRIVER_ID,
        livreur_user_id: LIVREUR_ID,
      })
      expect(curated.delivery_tours.length).toBe(originalLength)
    })

    it('creates PENDING checkpoint rows from the draft checkpoints', () => {
      const view = useToursStore.getState().createTour({
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'INTERNAL',
        type: 'VRAC',
        requested_quantity: 5000,
        vehicle_id: VEHICLE_ID,
        driver_id: DRIVER_ID,
        livreur_user_id: LIVREUR_ID,
        checkpoints: [
          { site_id: 'site-0001-sctm-bonaberi', sequence: 1, expected_quantity: 3000 },
          { client_site_id: 'csite-0001-shc-principal', sequence: 2, expected_quantity: 2000 },
        ],
      })

      const stored = useToursStore
        .getState()
        .checkpoints.filter((cp) => cp.tournee_id === view.id)
      expect(stored).toHaveLength(2)
      expect(stored[0]!.status).toBe('PENDING')
      expect(stored[0]!.site_id).toBe('site-0001-sctm-bonaberi')
      expect(stored[0]!.client_site_id).toBeNull()
      expect(stored[0]!.sequence).toBe(1)
      expect(stored[0]!.expected_quantity).toBe(3000)
      expect(stored[1]!.site_id).toBeNull()
      expect(stored[1]!.client_site_id).toBe('csite-0001-shc-principal')
      expect(view.checkpoint_count).toBe(2)
    })

    it('throws chk_checkpoint_exclusive when a checkpoint has no destination site', () => {
      expect(() =>
        useToursStore.getState().createTour({
          marketeur_org_id: MARKETEUR_ORG,
          execution_mode: 'INTERNAL',
          type: 'VRAC',
          requested_quantity: 5000,
          vehicle_id: VEHICLE_ID,
          driver_id: DRIVER_ID,
          livreur_user_id: LIVREUR_ID,
          checkpoints: [{ sequence: 1, expected_quantity: 5000 }],
        }),
      ).toThrow(/chk_checkpoint_exclusive/)
    })

    it('throws chk_checkpoint_quantity when a checkpoint quantity is not positive', () => {
      expect(() =>
        useToursStore.getState().createTour({
          marketeur_org_id: MARKETEUR_ORG,
          execution_mode: 'INTERNAL',
          type: 'VRAC',
          requested_quantity: 5000,
          vehicle_id: VEHICLE_ID,
          driver_id: DRIVER_ID,
          livreur_user_id: LIVREUR_ID,
          checkpoints: [{ site_id: 'site-0001-sctm-bonaberi', sequence: 1, expected_quantity: 0 }],
        }),
      ).toThrow(/chk_checkpoint_quantity/)
    })

    it('throws chk_checkpoint_sequence when a checkpoint sequence is < 1', () => {
      expect(() =>
        useToursStore.getState().createTour({
          marketeur_org_id: MARKETEUR_ORG,
          execution_mode: 'INTERNAL',
          type: 'VRAC',
          requested_quantity: 5000,
          vehicle_id: VEHICLE_ID,
          driver_id: DRIVER_ID,
          livreur_user_id: LIVREUR_ID,
          checkpoints: [
            { site_id: 'site-0001-sctm-bonaberi', sequence: 0, expected_quantity: 3000 },
          ],
        }),
      ).toThrow(/chk_checkpoint_sequence/)
    })
  })

  describe('performAction', () => {
    it('acknowledges an EXTERNAL PENDINGTRANSPORTERACK tour with the transporter crew and stamps the assignment time', () => {
      const view = useToursStore.getState().performAction('tour-005', 'acknowledge', {
        vehicle_id: 'veh-0026-lt3346eg',
        driver_id: 'driver-0002-anastlere-mousso',
        livreur_user_id: 'user-0028-express-chauffeur',
        assigned_by_transporter_user_id: 'user-0028-express-chauffeur',
      })
      expect(view.tourneeStatus).toBe('ACKNOWLEDGED')
      expect(tourStatusLabels[view.tourneeStatus]).toBe('Accusée')
      const stored = useToursStore.getState().tours.find((t) => t.id === 'tour-005')!
      expect(stored.status).toBe('ACKNOWLEDGED')
      expect(typeof stored.transporter_assigned_at).toBe('string')
      expect(stored.transporter_assigned_at).toBeTruthy()
      expect(stored.vehicle_id).toBe('veh-0026-lt3346eg')
      expect(stored.driver_id).toBe('driver-0002-anastlere-mousso')
      expect(stored.livreur_user_id).toBe('user-0028-express-chauffeur')
    })

    it('rejects an acknowledge without a transporter crew (no bare status flip)', () => {
      expect(() =>
        useToursStore.getState().performAction('tour-005', 'acknowledge'),
      ).toThrow(/équipage/)
    })

    it('starts an ACKNOWLEDGED tour and stamps started_at', () => {
      const view = useToursStore.getState().performAction('tour-009', 'start')
      expect(view.tourneeStatus).toBe('INPROGRESS')
      expect(tourStatusLabels[view.tourneeStatus]).toBe('En transit')
      const stored = useToursStore.getState().tours.find((t) => t.id === 'tour-009')!
      expect(stored.status).toBe('INPROGRESS')
      expect(typeof stored.started_at).toBe('string')
      expect(stored.started_at).toBeTruthy()
    })

    it('throws when the action is not legal from the current status', () => {
      // tour-005 is PENDINGTRANSPORTERACK: `start` targets INPROGRESS, which is not the
      // immediate next on the EXTERNAL chain, so it is disallowed.
      expect(() => useToursStore.getState().performAction('tour-005', 'start')).toThrow(
        /Transition interdite/,
      )
    })

    it('throws when the tour id does not exist', () => {
      expect(() => useToursStore.getState().performAction('does-not-exist', 'cancel')).toThrow(
        /Tournée introuvable/,
      )
    })

    it('blocks a non-cancel action when the tour fails validation', () => {
      // Craft an EXTERNAL INPROGRESS tour whose closed_at precedes started_at.
      // `close` is legal (next on EXTERNAL chain) but validation must guard it.
      const bad: DeliveryTour = {
        id: 'synthetic-bad',
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'EXTERNAL',
        transporter_org_id: TRANSPORTEUR_ORG,
        vehicle_id: null,
        driver_id: null,
        livreur_user_id: null,
        assigned_by_transporter_user_id: null,
        transporter_assigned_at: null,
        type: 'VRAC',
        status: 'CHECKPOINTACTIVE',
        requested_quantity: 1000,
        loaded_quantity: null,
        delivered_quantity: null,
        started_at: '2026-06-01T10:00:00.000Z',
        closed_at: '2026-06-01T09:00:00.000Z',
        created_at: '2026-05-30T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      }
      inject(bad)
      expect(() => useToursStore.getState().performAction('synthetic-bad', 'close')).toThrow(
        /chk_tournee_dates/,
      )
    })

    it('still permits cancel on an invalid tour (validation is skipped for cancel)', () => {
      const bad: DeliveryTour = {
        id: 'synthetic-cancel-ok',
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'EXTERNAL',
        transporter_org_id: TRANSPORTEUR_ORG,
        vehicle_id: null,
        driver_id: null,
        livreur_user_id: null,
        assigned_by_transporter_user_id: null,
        transporter_assigned_at: null,
        type: 'VRAC',
        status: 'ACKNOWLEDGED',
        requested_quantity: 1000,
        loaded_quantity: null,
        delivered_quantity: null,
        started_at: '2026-06-01T10:00:00.000Z',
        closed_at: '2026-06-01T09:00:00.000Z',
        created_at: '2026-05-30T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      }
      inject(bad)
      const view = useToursStore.getState().performAction('synthetic-cancel-ok', 'cancel')
      expect(view.tourneeStatus).toBe('CANCELLED')
      expect(tourStatusLabels[view.tourneeStatus]).toBe('Annulée')
    })

    it('acknowledge with a transporter-org crew patch assigns vehicle/driver/livreur', () => {
      const created = useToursStore.getState().createTour({
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'EXTERNAL',
        type: 'VRAC',
        requested_quantity: 5000,
        transporter_org_id: 'org-0010-translog----000000000001',
      })
      const id = created.id
      expect(created.tourneeStatus).toBe('PENDINGTRANSPORTERACK')

      const ack = useToursStore.getState().performAction(id, 'acknowledge', {
        vehicle_id: 'veh-0022-lt9902tl',
        driver_id: 'driver-0001-samuel-abanda',
        livreur_user_id: 'user-0025-translog-dispatcher',
        assigned_by_transporter_user_id: 'user-0024-translog-admin',
      })
      expect(ack.tourneeStatus).toBe('ACKNOWLEDGED')

      const stored = useToursStore.getState().tours.find((t) => t.id === id)!
      expect(stored.status).toBe('ACKNOWLEDGED')
      expect(stored.vehicle_id).toBe('veh-0022-lt9902tl')
      expect(stored.driver_id).toBe('driver-0001-samuel-abanda')
      expect(stored.livreur_user_id).toBe('user-0025-translog-dispatcher')
      expect(stored.assigned_by_transporter_user_id).toBe('user-0024-translog-admin')
      expect(typeof stored.transporter_assigned_at).toBe('string')
    })

    it('rejects an acknowledge whose vehicle is outside the transporter org (rolls back)', () => {
      const created = useToursStore.getState().createTour({
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'EXTERNAL',
        type: 'VRAC',
        requested_quantity: 5000,
        transporter_org_id: 'org-0010-translog----000000000001',
      })
      const id = created.id
      expect(() =>
        useToursStore.getState().performAction(id, 'acknowledge', {
          vehicle_id: 'veh-0001-lt1123ub',
          driver_id: 'driver-0001-samuel-abanda',
          livreur_user_id: 'user-0025-translog-dispatcher',
        }),
      ).toThrow(/n'appartient pas à l'organisation du transporteur/)

      // The optimistic write was rolled back: the tour stays pending.
      const stored = useToursStore.getState().tours.find((t) => t.id === id)!
      expect(stored.status).toBe('PENDINGTRANSPORTERACK')
      expect(stored.vehicle_id).toBeNull()
    })
  })

  describe('views (slice filtering)', () => {
    it('returns all tours for the ALL slice', () => {
      expect(useToursStore.getState().views('ALL').length).toBe(curated.delivery_tours.length)
    })

    it('partitions INTERNAL vs EXTERNAL', () => {
      expect(useToursStore.getState().views('INTERNAL').length).toBe(7)
      expect(useToursStore.getState().views('EXTERNAL').length).toBe(3)
    })

    it('surfaces only PENDINGTRANSPORTERACK tours', () => {
      expect(useToursStore.getState().views('PENDING').length).toBe(1)
      expect(useToursStore.getState().views('PENDING')[0]!.tourneeStatus).toBe('PENDINGTRANSPORTERACK')
    })

    it('surfaces in-progress tours (INPROGRESS or CHECKPOINTACTIVE)', () => {
      expect(useToursStore.getState().views('ACTIVE').length).toBe(4)
    })

    it('surfaces history (CLOSED / CANCELLED)', () => {
      expect(useToursStore.getState().views('HISTORY').length).toBe(2)
    })
  })

  describe('viewById', () => {
    it('returns an enriched view for a known id', () => {
      const view = useToursStore.getState().viewById('tour-001')
      expect(view).toBeDefined()
      expect(tourStatusLabels[view!.tourneeStatus]).toBe('Livrée')
      expect(view!.execution_mode).toBe('INTERNAL')
      expect(view!.checkpoint_count).toBeGreaterThanOrEqual(0)
    })

    it('returns undefined for a missing id', () => {
      expect(useToursStore.getState().viewById('no-such-tour')).toBeUndefined()
    })

    it('reflects subsequent store mutations', () => {
      expect(useToursStore.getState().viewById('tour-005')!.tourneeStatus).toBe('PENDINGTRANSPORTERACK')
      useToursStore.getState().performAction('tour-005', 'acknowledge', {
        vehicle_id: 'veh-0026-lt3346eg',
        driver_id: 'driver-0002-anastlere-mousso',
        livreur_user_id: 'user-0028-express-chauffeur',
        assigned_by_transporter_user_id: 'user-0028-express-chauffeur',
      })
      expect(useToursStore.getState().viewById('tour-005')!.tourneeStatus).toBe('ACKNOWLEDGED')
    })
  })

  describe('end-to-end click-through (EXTERNAL lifecycle)', () => {
    it('walks PENDINGTRANSPORTERACK → ACKNOWLEDGED → INPROGRESS via the store', () => {
      const created = useToursStore.getState().createTour({
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'EXTERNAL',
        type: 'BOUTEILLES50KG',
        requested_quantity: 120,
        transporter_org_id: TRANSPORTEUR_ORG,
      })
      const id = created.id

      // 0. EXTERNAL creation lands already awaiting transporter acknowledgement.
      expect(created.tourneeStatus).toBe('PENDINGTRANSPORTERACK')

      // 1. TRANSPORTEUR acknowledges, assigning their own crew+vehicle.
      const ack = useToursStore.getState().performAction(id, 'acknowledge', {
        vehicle_id: 'veh-0026-lt3346eg',
        driver_id: 'driver-0002-anastlere-mousso',
        livreur_user_id: 'user-0028-express-chauffeur',
        assigned_by_transporter_user_id: 'user-0028-express-chauffeur',
      })
      expect(ack.tourneeStatus).toBe('ACKNOWLEDGED')

      // 2. LIVREUR starts the mission on the PDA.
      const started = useToursStore.getState().performAction(id, 'start')
      expect(started.tourneeStatus).toBe('INPROGRESS')
      expect(started.startedAt).toBeTruthy()

      // 3. The enriched view reflects the running state.
      const stored = useToursStore.getState().viewById(id)
      expect(stored?.tourneeStatus).toBe('INPROGRESS')
    })

    it('closes a CHECKPOINTACTIVE tour and guards it from further actions', () => {
      // tour-008 is seeded CHECKPOINTACTIVE (INTERNAL, crew assigned).
      const closed = useToursStore.getState().performAction('tour-008', 'close')
      expect(closed.tourneeStatus).toBe('CLOSED')
      expect(tourStatusLabels[closed.tourneeStatus]).toBe('Livrée')
      const stored = useToursStore.getState().tours.find((t) => t.id === 'tour-008')!
      expect(stored.status).toBe('CLOSED')
      expect(typeof stored.closed_at).toBe('string')
      expect(stored.closed_at).toBeTruthy()

      expect(() => useToursStore.getState().performAction('tour-008', 'cancel')).toThrow(
        /Transition interdite/,
      )
    })

    it('throws when a button action is not legal at the current status (no skip-ahead)', () => {
      const created = useToursStore.getState().createTour({
        marketeur_org_id: MARKETEUR_ORG,
        execution_mode: 'EXTERNAL',
        type: 'VRAC',
        requested_quantity: 5000,
        transporter_org_id: TRANSPORTEUR_ORG,
      })
      const id = created.id

      // An EXTERNAL tour lands in PENDINGTRANSPORTERACK: `start` targets
      // INPROGRESS, which is not the immediate next on the EXTERNAL chain, so
      // it is disallowed until the transporter acknowledges.
      expect(() => useToursStore.getState().performAction(id, 'start')).toThrow(
        /Transition interdite/,
      )
    })
  })
})
