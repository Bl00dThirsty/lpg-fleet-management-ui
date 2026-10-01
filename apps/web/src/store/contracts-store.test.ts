import type { AuthUser } from '@lpg/api-client'
import { curated } from '@lpg/mock-data'
import { beforeEach, describe, expect, it } from 'vitest'
import { PERMISSION_DENIED } from '@/lib/security/guards'
import { useAuthStore } from './auth-store'
import { useContractsStore } from './contracts-store'

const MARKETEUR = 'org-0002-sctm-0000-000000000001'
const OTHER_MARKETEUR = 'org-0003-total-0000-000000000001'
const EXPRESS = 'org-0011-expressgpl--000000000001'

function user(system_role: AuthUser['system_role'], org_id?: string): AuthUser {
  return {
    id: `u-${system_role}`,
    email: 'x@y.cm',
    first_name: 'X',
    last_name: 'Y',
    system_role,
    org_id,
    site_ids: [],
  }
}

function seed() {
  useContractsStore.setState({
    contracts: curated.transporter_contracts.map((contract) => ({ ...contract })),
  })
}

describe('contracts store', () => {
  beforeEach(() => {
    seed()
    useAuthStore.setState({ user: user('SUPERADMIN'), status: 'authenticated' })
  })

  it('seeds fixture contracts and hides deleted rows from reads', () => {
    expect(useContractsStore.getState().all()).toHaveLength(curated.transporter_contracts.length)
  })

  it('creates a contract within scope and enforces pair uniqueness', () => {
    const draft = {
      marketeur_org_id: MARKETEUR,
      transporter_org_id: 'org-0012-sahelgpl-000000000001',
      is_primary: false,
    }
    const created = useContractsStore.getState().createContract(draft)

    expect(useContractsStore.getState().viewById(created.id)).toEqual(created)
    expect(() => useContractsStore.getState().createContract(draft)).toThrow(/existe déjà/)
  })

  it('denies a marketeur creating for another marketeur org', () => {
    useAuthStore.setState({ user: user('MARKETEUR', MARKETEUR) })

    expect(() =>
      useContractsStore.getState().createContract({
        marketeur_org_id: OTHER_MARKETEUR,
        transporter_org_id: 'org-0012-sahelgpl-000000000001',
        is_primary: false,
      }),
    ).toThrow(PERMISSION_DENIED)
  })

  it('scopes marketeur reads to its own organization', () => {
    useAuthStore.setState({ user: user('MARKETEUR', MARKETEUR) })

    expect(useContractsStore.getState().all()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ marketeur_org_id: MARKETEUR }),
      ]),
    )
    expect(useContractsStore.getState().all()).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ marketeur_org_id: OTHER_MARKETEUR }),
      ]),
    )
    expect(useContractsStore.getState().viewById('tc-003-total-translog')).toBeUndefined()
  })

  it('scopes transporteur reads to its own organization', () => {
    useAuthStore.setState({ user: user('TRANSPORTEUR', EXPRESS) })

    expect(useContractsStore.getState().all()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ transporter_org_id: EXPRESS }),
      ]),
    )
    expect(useContractsStore.getState().all()).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ transporter_org_id: 'org-0010-translog----000000000001' }),
      ]),
    )
    expect(useContractsStore.getState().viewById('tc-001-sctm-translog')).toBeUndefined()
  })

  it('rejects an invalid PDF proof when creating a contract', () => {
    expect(() =>
      useContractsStore.getState().createContract({
        marketeur_org_id: MARKETEUR,
        transporter_org_id: 'org-0012-sahelgpl-000000000001',
        is_primary: false,
        contract_document_url: 'data:text/plain;base64,BBBB',
      }),
    ).toThrow(/preuve PDF/)
  })

  it('attaches a PDF proof with the write permission', () => {
    const contract = useContractsStore.getState().viewById('tc-004-total-express')!
    const updated = useContractsStore.getState().attachProof(contract.id, 'data:application/pdf;base64,BBBB')

    expect(updated.contract_document_url).toBe('data:application/pdf;base64,BBBB')
    expect(useContractsStore.getState().viewById(contract.id)?.contract_document_url).toBe(
      'data:application/pdf;base64,BBBB',
    )
  })

  it('denies a marketeur attaching proof outside its organization', () => {
    useAuthStore.setState({ user: user('MARKETEUR', OTHER_MARKETEUR) })

    expect(() =>
      useContractsStore.getState().attachProof('tc-001-sctm-translog', 'data:application/pdf;base64,BBBB'),
    ).toThrow(PERMISSION_DENIED)
  })

  it('rejects non-PDF proof data URLs', () => {
    expect(() =>
      useContractsStore.getState().attachProof('tc-001-sctm-translog', 'data:text/plain;base64,BBBB'),
    ).toThrow(/preuve PDF/)
  })

  it('rejects empty or invalid base64 proofs and accepts a valid proof', () => {
    const contractId = 'tc-004-total-express'
    const attachProof = useContractsStore.getState().attachProof

    expect(() => attachProof(contractId, 'data:application/pdf;base64,')).toThrow(/preuve PDF/)
    expect(() => attachProof(contractId, 'data:application/pdf;base64,%%%')).toThrow(/preuve PDF/)

    const proof = 'data:application/pdf;base64,JVBERi0xLjQ='
    expect(attachProof(contractId, proof).contract_document_url).toBe(proof)

    useAuthStore.setState({ user: user('TRANSPORTEUR', EXPRESS) })
    expect(useContractsStore.getState().accept(contractId).transporter_accepted_at).toBeTruthy()
  })

  it('requires a PDF before a transporter can accept', () => {
    useAuthStore.setState({ user: user('TRANSPORTEUR', EXPRESS) })

    expect(() => useContractsStore.getState().accept('tc-004-total-express')).toThrow(/preuve PDF/)
  })

  it('refuses every mutation for a deleted contract', () => {
    const store = useContractsStore.getState()
    store.remove('tc-001-sctm-translog')

    expect(() => store.attachProof('tc-001-sctm-translog', 'data:application/pdf;base64,BBBB')).toThrow(
      /introuvable/,
    )
    expect(() => store.accept('tc-001-sctm-translog')).toThrow(/introuvable/)
    expect(() => store.suspend('tc-001-sctm-translog')).toThrow(/introuvable/)
    expect(() => store.reactivate('tc-001-sctm-translog')).toThrow(/introuvable/)
    expect(() => store.setPrimary('tc-001-sctm-translog')).toThrow(/introuvable/)
    expect(() => store.remove('tc-001-sctm-translog')).toThrow(/introuvable/)
  })

  it('refuses acceptance of an inactive contract', () => {
    useContractsStore.getState().suspend('tc-002-sctm-express')
    useAuthStore.setState({ user: user('TRANSPORTEUR', EXPRESS) })

    expect(() => useContractsStore.getState().accept('tc-002-sctm-express')).toThrow(/inactive|suspendu/i)
  })

  it('allows only the owning transporter with validate permission to accept', () => {
    useAuthStore.setState({ user: user('TRANSPORTEUR', EXPRESS) })
    const accepted = useContractsStore.getState().accept('tc-002-sctm-express')
    expect(accepted.transporter_accepted_at).toBeTruthy()

    useAuthStore.setState({ user: user('TRANSPORTEUR', EXPRESS) })
    expect(() => useContractsStore.getState().accept('tc-001-sctm-translog')).toThrow(PERMISSION_DENIED)
  })

  it('restricts suspend and reactivate to the regulateur org view', () => {
    useAuthStore.setState({ user: user('MARKETEUR', MARKETEUR) })
    expect(() => useContractsStore.getState().suspend('tc-001-sctm-translog')).toThrow(PERMISSION_DENIED)

    useAuthStore.setState({ user: user('SUPERADMIN') })
    expect(useContractsStore.getState().suspend('tc-001-sctm-translog').is_active).toBe(false)
    expect(useContractsStore.getState().reactivate('tc-001-sctm-translog').is_active).toBe(true)
  })

  it('keeps one primary contract per marketeur', () => {
    const updated = useContractsStore.getState().setPrimary('tc-002-sctm-express')
    const rows = useContractsStore
      .getState()
      .all()
      .filter((contract) => contract.marketeur_org_id === MARKETEUR)

    expect(updated.is_primary).toBe(true)
    expect(rows.filter((contract) => contract.is_primary)).toHaveLength(1)
  })

  it('soft-deletes a contract without removing its row', () => {
    useContractsStore.getState().remove('tc-001-sctm-translog')

    expect(useContractsStore.getState().viewById('tc-001-sctm-translog')).toBeUndefined()
    expect(useContractsStore.getState().all()).not.toContainEqual(
      expect.objectContaining({ id: 'tc-001-sctm-translog' }),
    )
    expect(useContractsStore.getState().contracts).toContainEqual(
      expect.objectContaining({ id: 'tc-001-sctm-translog', deleted_at: expect.any(String) }),
    )
  })

  it('denies a marketeur removing a contract outside its organization', () => {
    useAuthStore.setState({ user: user('MARKETEUR', OTHER_MARKETEUR) })

    expect(() => useContractsStore.getState().remove('tc-001-sctm-translog')).toThrow(PERMISSION_DENIED)
  })

  it('updates editable contract fields and emits the updated contract', () => {
    const original = useContractsStore.getState().viewById('tc-001-sctm-translog')!
    const updated = useContractsStore.getState().updateContract(original.id, {
      contract_reference: 'CTR-UPDATED',
      started_at: '2026-02-01T00:00:00Z',
      ended_at: '2027-02-01T23:59:59Z',
      is_primary: true,
      contract_document_url: 'data:application/pdf;base64,JVBERi0xLjQ=',
    })

    expect(updated).toMatchObject({
      id: original.id,
      contract_reference: 'CTR-UPDATED',
      started_at: '2026-02-01T00:00:00Z',
      ended_at: '2027-02-01T23:59:59Z',
      is_primary: true,
      contract_document_url: 'data:application/pdf;base64,JVBERi0xLjQ=',
    })
    expect(useContractsStore.getState().all().filter((row) => row.marketeur_org_id === original.marketeur_org_id && row.is_primary)).toHaveLength(1)
  })

  it('allows only a contract-writing owner to update and never changes a non-regulateur marketeur', () => {
    useAuthStore.setState({ user: user('MARKETEUR', MARKETEUR) })
    const id = 'tc-001-sctm-translog'

    expect(() => useContractsStore.getState().updateContract(id, { marketeur_org_id: OTHER_MARKETEUR })).toThrow(PERMISSION_DENIED)
    expect(() => useContractsStore.getState().updateContract('tc-003-total-translog', { contract_reference: 'NOPE' })).toThrow(PERMISSION_DENIED)

    const updated = useContractsStore.getState().updateContract(id, { contract_reference: 'OWNER-EDIT' })
    expect(updated.contract_reference).toBe('OWNER-EDIT')
    expect(updated.marketeur_org_id).toBe(MARKETEUR)
  })

  it('refuses updating a deleted contract', () => {
    useContractsStore.getState().remove('tc-001-sctm-translog')

    expect(() => useContractsStore.getState().updateContract('tc-001-sctm-translog', { contract_reference: 'NOPE' })).toThrow(
      /introuvable/,
    )
  })
})
