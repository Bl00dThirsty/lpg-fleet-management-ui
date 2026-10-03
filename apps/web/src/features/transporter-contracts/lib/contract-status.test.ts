import { describe, expect, it } from 'vitest'
import {
  CONTRACT_STATUS_CLASSES,
  CONTRACT_STATUS_LABELS,
  contractsEligibleForExternal,
  deriveContractStatus,
  type ContractStatusInput,
  type ContractStatus,
} from './contract-status'

const now = new Date('2026-08-18T12:00:00Z')

const contract = (
  overrides: Partial<ContractStatusInput> = {},
): ContractStatusInput => ({
  is_active: true,
  contract_document_url: 'https://example.test/contract.pdf',
  transporter_accepted_at: '2026-08-01T09:00:00Z',
  started_at: '2026-01-01T00:00:00Z',
  ended_at: '2026-12-31T23:59:59Z',
  deleted_at: null,
  ...overrides,
})

const eligibleContract = (
  overrides: Partial<ContractStatusInput & { id: string; marketeur_org_id: string }> = {},
) => ({
  id: 'contract-1',
  marketeur_org_id: 'marketeur-1',
  ...contract(overrides),
  ...overrides,
})

describe('deriveContractStatus', () => {
  const cases: Array<[ContractStatus, Partial<Parameters<typeof contract>[0]>]> = [
    ['CANCELLED', { deleted_at: '2026-01-01T00:00:00Z' }],
    ['SUSPENDED', { is_active: false }],
    ['PENDING', { contract_document_url: null }],
    ['PENDINGTRANSPORTERACK', { transporter_accepted_at: null }],
    ['EXPIRED', { ended_at: '2026-08-18T11:59:59Z' }],
    ['UPCOMING', { started_at: '2026-08-18T12:00:01Z' }],
    ['ACTIVE', {}],
  ]

  it.each(cases)('derives %s', (expected, overrides) => {
    expect(deriveContractStatus(contract(overrides), now)).toBe(expected)
  })

  it('defaults now when omitted', () => {
    expect(
      deriveContractStatus(contract({ started_at: null, ended_at: null })),
    ).toBe('ACTIVE')
  })

  it('applies precedence when multiple conditions match', () => {
    expect(
      deriveContractStatus(
        contract({
          deleted_at: '2026-01-01T00:00:00Z',
          is_active: false,
          contract_document_url: null,
          transporter_accepted_at: null,
          ended_at: '2026-01-01T00:00:00Z',
          started_at: '2027-01-01T00:00:00Z',
        }),
        now,
      ),
    ).toBe('CANCELLED')
  })
})

describe('contractsEligibleForExternal', () => {
  it('returns only ACTIVE contracts for the requested marketeur organization', () => {
    const eligible = contractsEligibleForExternal(
      [
        eligibleContract({}),
        eligibleContract({ id: 'other-org', marketeur_org_id: 'marketeur-2' }),
        eligibleContract({ id: 'pending', transporter_accepted_at: null }),
        eligibleContract({ id: 'expired', ended_at: '2026-01-01T00:00:00Z' }),
        eligibleContract({ id: 'upcoming', started_at: '2027-01-01T00:00:00Z' }),
      ],
      'marketeur-1',
      now,
    )

    expect(eligible).toEqual(['contract-1'])
  })

  it('accepts readonly contracts and defaults now when omitted', () => {
    const contracts = [eligibleContract()] as const

    expect(contractsEligibleForExternal(contracts, 'marketeur-1')).toEqual([
      'contract-1',
    ])
  })
})

describe('contract status metadata', () => {
  it('defines a label and class for every status', () => {
    const statuses: ContractStatus[] = [
      'CANCELLED',
      'SUSPENDED',
      'PENDING',
      'PENDINGTRANSPORTERACK',
      'EXPIRED',
      'UPCOMING',
      'ACTIVE',
    ]

    for (const status of statuses) {
      expect(CONTRACT_STATUS_LABELS[status]).toBeTruthy()
      expect(CONTRACT_STATUS_CLASSES[status]).toBeTruthy()
    }
  })
})
