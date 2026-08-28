import { describe, expect, it, beforeEach } from 'vitest'
import { usePickupsStore } from './pickups-store'
import { useAuthStore } from './auth-store'
import { PERMISSION_DENIED } from '@/lib/security/guards'
import { curated } from '@lpg/mock-data'

const MARKETEUR_ORG = 'org-0002-sctm-0000-000000000001'
const SOURCE_SITE = 'site-0001-sctm-bonaberi'
const DEST_SITE = 'site-0004-sctm-garoua'

const SUPERADMIN_USER = {
  id: 'u-super',
  email: 's@csph.cm',
  first_name: 'S',
  last_name: 'A',
  system_role: 'SUPERADMIN' as const,
  org_type: 'REGULATEUR' as const,
  site_ids: [] as string[],
}

function setAuthUser(system_role: 'SUPERADMIN' | 'AGENT' | 'MARKETEUR', site_ids: string[] = []) {
  const org_type =
    system_role === 'MARKETEUR' ? ('MARKETEUR' as const) : ('REGULATEUR' as const)
  useAuthStore.setState({
    user: { ...SUPERADMIN_USER, id: `u-${system_role.toLowerCase()}`, system_role, org_type, site_ids },
  })
}

function freshSeed() {
  return {
    pickups: [...curated.pickup_requests, ...demoSeedRows()].map((p) => ({ ...p })),
  }
}

// Mirrors the store's own demo seed (DRAFT / VALIDATED / CANCELLED rows).
function demoSeedRows() {
  return [
    {
      id: 'pickup-extra-0',
      marketeur_org_id: MARKETEUR_ORG,
      source_site_id: SOURCE_SITE,
      destination_site_id: DEST_SITE,
      requested_quantity: 18,
      approved_quantity: null,
      status: 'DRAFT' as const,
      created_at: '2024-10-02T08:00:00Z',
      updated_at: '2024-10-02T08:00:00Z',
      deleted_at: null,
      created_by: null,
      updated_by: null,
    },
    {
      id: 'pickup-extra-1',
      marketeur_org_id: MARKETEUR_ORG,
      source_site_id: SOURCE_SITE,
      destination_site_id: DEST_SITE,
      requested_quantity: 18,
      approved_quantity: 18,
      status: 'VALIDATED' as const,
      created_at: '2024-10-08T08:00:00Z',
      updated_at: '2024-10-09T09:00:00Z',
      deleted_at: null,
      created_by: null,
      updated_by: null,
    },
    {
      id: 'pickup-extra-2',
      marketeur_org_id: MARKETEUR_ORG,
      source_site_id: SOURCE_SITE,
      destination_site_id: DEST_SITE,
      requested_quantity: 16,
      approved_quantity: null,
      status: 'CANCELLED' as const,
      created_at: '2024-09-20T08:00:00Z',
      updated_at: '2024-09-20T08:00:00Z',
      deleted_at: null,
      created_by: null,
      updated_by: null,
    },
  ]
}

function createDraft(): string {
  const created = usePickupsStore.getState().createPickup({
    marketeur_org_id: MARKETEUR_ORG,
    source_site_id: SOURCE_SITE,
    destination_site_id: DEST_SITE,
    requested_quantity: 9000,
  })
  return created.id
}

describe('pickups store', () => {
  beforeEach(() => {
    usePickupsStore.setState(freshSeed())
    // Guards read the live auth state: a SUPERADMIN clears every permission
    // check so the mutation tests exercise the business logic, not the guard.
    setAuthUser('SUPERADMIN')
  })

  it('seeds with the curated pickup requests plus the demo rows', () => {
    expect(usePickupsStore.getState().all().length).toBe(
      curated.pickup_requests.length + 3,
    )
  })

  describe('permission guards', () => {
    it('throws PERMISSION_DENIED for createPickup when the role lacks pickups.create', () => {
      // AGENT holds no pickups.* grants (packages/permissions AGENT_GRANTS); it
      // is genuinely denied pickups.create, unlike MARKETEUR whose pickups.write
      // implies pickups.create.
      setAuthUser('AGENT')
      expect(() =>
        usePickupsStore.getState().createPickup({
          marketeur_org_id: MARKETEUR_ORG,
          source_site_id: SOURCE_SITE,
          destination_site_id: DEST_SITE,
          requested_quantity: 9000,
        }),
      ).toThrow(PERMISSION_DENIED)
    })

    it('throws PERMISSION_DENIED for a MARKETEUR whose scope excludes the source site', () => {
      setAuthUser('MARKETEUR', ['site-other'])
      expect(() =>
        usePickupsStore.getState().createPickup({
          marketeur_org_id: MARKETEUR_ORG,
          source_site_id: SOURCE_SITE,
          destination_site_id: DEST_SITE,
          requested_quantity: 9000,
        }),
      ).toThrow(PERMISSION_DENIED)
    })

    it('allows a MARKETEUR whose scope includes the source site', () => {
      setAuthUser('MARKETEUR', [SOURCE_SITE])
      expect(() =>
        usePickupsStore.getState().createPickup({
          marketeur_org_id: MARKETEUR_ORG,
          source_site_id: SOURCE_SITE,
          destination_site_id: DEST_SITE,
          requested_quantity: 9000,
        }),
      ).not.toThrow(PERMISSION_DENIED)
    })
  })

  describe('createPickup', () => {
    it('creates a DRAFT request and prepends it to the list', () => {
      const countBefore = usePickupsStore.getState().all().length
      const created = usePickupsStore.getState().createPickup({
        marketeur_org_id: MARKETEUR_ORG,
        source_site_id: SOURCE_SITE,
        destination_site_id: DEST_SITE,
        requested_quantity: 9000,
      })

      expect(created.status).toBe('DRAFT')
      expect(created.requested_quantity).toBe(9000)
      expect(created.approved_quantity).toBeNull()
      expect(usePickupsStore.getState().all().length).toBe(countBefore + 1)
      expect(usePickupsStore.getState().viewById(created.id)?.status).toBe('DRAFT')
    })

    it('throws chk_pickup_sites_different when source equals destination', () => {
      expect(() =>
        usePickupsStore.getState().createPickup({
          marketeur_org_id: MARKETEUR_ORG,
          source_site_id: SOURCE_SITE,
          destination_site_id: SOURCE_SITE,
          requested_quantity: 9000,
        }),
      ).toThrow(/chk_pickup_sites_different/)
    })

    it('throws chk_pickup_quantity when quantity is not positive', () => {
      expect(() =>
        usePickupsStore.getState().createPickup({
          marketeur_org_id: MARKETEUR_ORG,
          source_site_id: SOURCE_SITE,
          destination_site_id: DEST_SITE,
          requested_quantity: 0,
        }),
      ).toThrow(/chk_pickup_quantity/)
    })

    it('throws when required fields are missing', () => {
      expect(() =>
        usePickupsStore.getState().createPickup({
          marketeur_org_id: '',
          source_site_id: '',
          destination_site_id: '',
          requested_quantity: 1000,
        }),
      ).toThrow(/mandatory|requires/)
    })

    it('does not mutate the shared curated fixture', () => {
      const originalLength = curated.pickup_requests.length
      usePickupsStore.getState().createPickup({
        marketeur_org_id: MARKETEUR_ORG,
        source_site_id: SOURCE_SITE,
        destination_site_id: DEST_SITE,
        requested_quantity: 5000,
      })
      expect(curated.pickup_requests.length).toBe(originalLength)
    })
  })

  describe('validatePickup', () => {
    it('validates a DRAFT request and stamps the approved quantity', () => {
      const id = createDraft()
      const updated = usePickupsStore.getState().validatePickup(id, 8000)
      expect(updated.status).toBe('VALIDATED')
      expect(updated.approved_quantity).toBe(8000)
      expect(usePickupsStore.getState().viewById(id)?.status).toBe('VALIDATED')
    })

    it('throws when the request is not DRAFT', () => {
      const completedId = curated.pickup_requests[0]!.id
      expect(() =>
        usePickupsStore.getState().validatePickup(completedId, 8000),
      ).toThrow(/brouillon/)
    })

    it('throws when the approved quantity is not positive', () => {
      const id = createDraft()
      expect(() => usePickupsStore.getState().validatePickup(id, 0)).toThrow(
        /positive/,
      )
    })

    it('throws PERMISSION_DENIED for a role without pickups.validate', () => {
      const id = createDraft()
      setAuthUser('AGENT')
      expect(() =>
        usePickupsStore.getState().validatePickup(id, 8000),
      ).toThrow(PERMISSION_DENIED)
    })
  })

  describe('cancelPickup', () => {
    it('cancels a DRAFT request', () => {
      const id = createDraft()
      const updated = usePickupsStore.getState().cancelPickup(id)
      expect(updated.status).toBe('CANCELLED')
    })

    it('cancels a VALIDATED request', () => {
      const id = createDraft()
      usePickupsStore.getState().validatePickup(id, 8000)
      const updated = usePickupsStore.getState().cancelPickup(id)
      expect(updated.status).toBe('CANCELLED')
    })

    it('throws for a terminal (COMPLETED) request', () => {
      const completedId = curated.pickup_requests[0]!.id
      expect(() => usePickupsStore.getState().cancelPickup(completedId)).toThrow(
        /ne peut pas être annulée/,
      )
    })

    it('throws PERMISSION_DENIED for a role without pickups.write', () => {
      const id = createDraft()
      setAuthUser('AGENT')
      expect(() => usePickupsStore.getState().cancelPickup(id)).toThrow(
        PERMISSION_DENIED,
      )
    })
  })
})