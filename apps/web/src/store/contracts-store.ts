import { curated } from '@lpg/mock-data'
import type { Role } from '@lpg/permissions'
import { create } from 'zustand'
import type { TransporterContract } from '@lpg/types'
import { getScope, isRegulateurView } from '@/features/scope/scope'
import { assertPermission, PERMISSION_DENIED } from '@/lib/security/guards'
import { emitWs } from '@/lib/ws/mock-ws'
import { useAuthStore } from '@/store/auth-store'

export interface ContractDraft {
  marketeur_org_id: string
  transporter_org_id: string
  is_primary: boolean
  contract_reference?: string
  started_at?: string
  ended_at?: string
  contract_document_url?: string
}

export interface ContractPatch {
  marketeur_org_id?: string
  transporter_org_id?: string
  is_primary?: boolean
  contract_reference?: string
  started_at?: string
  ended_at?: string
  contract_document_url?: string
}

interface ContractsState {
  contracts: TransporterContract[]
  createContract: (draft: ContractDraft) => TransporterContract
  updateContract: (id: string, patch: ContractPatch) => TransporterContract
  attachProof: (id: string, dataUrl: string) => TransporterContract
  accept: (id: string) => TransporterContract
  suspend: (id: string) => TransporterContract
  reactivate: (id: string) => TransporterContract
  setPrimary: (id: string) => TransporterContract
  remove: (id: string) => void
  all: () => TransporterContract[]
  viewById: (id: string) => TransporterContract | undefined
}

function actor() {
  const user = useAuthStore.getState().user
  return { user, role: (user?.system_role ?? 'LIVREUR') as Role }
}

function now(): string {
  return new Date().toISOString()
}

function contractId(): string {
  return `tc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function cloneContracts(contracts: TransporterContract[]): TransporterContract[] {
  return contracts.map((contract) => ({ ...contract }))
}

const PDF_DATA_URL_PREFIX = 'data:application/pdf;base64,'

function isValidPdfDataUrl(dataUrl: string): boolean {
  if (!dataUrl.startsWith(PDF_DATA_URL_PREFIX)) return false

  const payload = dataUrl.slice(PDF_DATA_URL_PREFIX.length)
  return payload.length > 0 && payload.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(payload)
}

function assertMarketeurOwnership(contract: TransporterContract, user: ReturnType<typeof actor>['user']): void {
  const scope = getScope(user)
  if (!isRegulateurView(scope) && contract.marketeur_org_id !== scope.orgId) {
    throw new Error(PERMISSION_DENIED)
  }
}

function isInReadScope(contract: TransporterContract, user: ReturnType<typeof actor>['user']): boolean {
  const scope = getScope(user)
  if (isRegulateurView(scope)) return true
  if (scope.view === 'site') return contract.marketeur_org_id === scope.orgId
  if (scope.view === 'transporter') return contract.transporter_org_id === scope.orgId
  return false
}

function findActiveContract(contracts: TransporterContract[], id: string): TransporterContract {
  const contract = contracts.find((row) => row.id === id && !row.deleted_at)
  if (!contract) throw new Error(`Contrat introuvable : ${id}`)
  return contract
}

export const useContractsStore = create<ContractsState>()((set, get) => {
  function mutate(
    id: string,
    update: (contract: TransporterContract, userId?: string) => TransporterContract,
  ): TransporterContract {
    const { user } = actor()
    const previous = cloneContracts(get().contracts)
    const index = previous.findIndex((contract) => contract.id === id)
    if (index === -1 || previous[index]!.deleted_at) throw new Error(`Contrat introuvable : ${id}`)

    try {
      const next = update(previous[index]!, user?.id)
      const contracts = [...previous]
      contracts[index] = next
      set({ contracts })
      emitWs('contract:update', { id }, user?.id)
      return next
    } catch (error) {
      set({ contracts: previous })
      throw error
    }
  }

  return {
    contracts: curated.transporter_contracts.map((contract) => ({ ...contract })),

    createContract(draft) {
      const { user, role } = actor()
      assertPermission(role, 'contracts.create')
      const scope = getScope(user)
      if (!isRegulateurView(scope) && draft.marketeur_org_id !== scope.orgId) {
        throw new Error(PERMISSION_DENIED)
      }
      if (draft.contract_document_url && !isValidPdfDataUrl(draft.contract_document_url)) {
        throw new Error('La preuve PDF doit être un fichier valide')
      }
      if (get().contracts.some(
        (contract) =>
          !contract.deleted_at &&
          contract.marketeur_org_id === draft.marketeur_org_id &&
          contract.transporter_org_id === draft.transporter_org_id,
      )) {
        throw new Error('Un contrat existe déjà entre ce marketeur et ce transporteur')
      }

      const timestamp = now()
      const contract: TransporterContract = {
        id: contractId(),
        marketeur_org_id: draft.marketeur_org_id,
        transporter_org_id: draft.transporter_org_id,
        is_primary: draft.is_primary,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        created_by: user?.id,
        ...(draft.contract_reference ? { contract_reference: draft.contract_reference } : {}),
        ...(draft.started_at ? { started_at: draft.started_at } : {}),
        ...(draft.ended_at ? { ended_at: draft.ended_at } : {}),
        ...(draft.contract_document_url ? { contract_document_url: draft.contract_document_url } : {}),
      }
      const previous = cloneContracts(get().contracts)

      try {
        const contracts = contract.is_primary
          ? previous.map((row) =>
              !row.deleted_at && row.marketeur_org_id === contract.marketeur_org_id
                ? { ...row, is_primary: false }
                : row,
            )
          : previous
        set({ contracts: [contract, ...contracts] })
        emitWs('contract:update', { id: contract.id }, user?.id)
        return contract
      } catch (error) {
        set({ contracts: previous })
        throw error
      }
    },

    updateContract(id, patch) {
      const { user, role } = actor()
      assertPermission(role, 'contracts.write')
      const current = findActiveContract(get().contracts, id)
      const scope = getScope(user)
      assertMarketeurOwnership(current, user)
      if (!isRegulateurView(scope) && patch.marketeur_org_id && patch.marketeur_org_id !== current.marketeur_org_id) {
        throw new Error(PERMISSION_DENIED)
      }

      const marketeurOrgId = patch.marketeur_org_id ?? current.marketeur_org_id
      const transporterOrgId = patch.transporter_org_id ?? current.transporter_org_id
      const startedAt = patch.started_at ?? current.started_at
      const endedAt = patch.ended_at ?? current.ended_at
      if (startedAt && endedAt && endedAt < startedAt) {
        throw new Error('La date de fin doit être postérieure ou égale à la date de début')
      }
      if (patch.contract_document_url && !isValidPdfDataUrl(patch.contract_document_url)) {
        throw new Error('La preuve PDF doit être un fichier valide')
      }
      if (get().contracts.some(
        (contract) =>
          contract.id !== id &&
          !contract.deleted_at &&
          contract.marketeur_org_id === marketeurOrgId &&
          contract.transporter_org_id === transporterOrgId,
      )) {
        throw new Error('Un contrat existe déjà entre ce marketeur et ce transporteur')
      }

      const previous = cloneContracts(get().contracts)
      try {
        const timestamp = now()
        const contracts = previous.map((contract) => {
          if (contract.id === id) {
            return {
              ...contract,
              ...patch,
              marketeur_org_id: marketeurOrgId,
              transporter_org_id: transporterOrgId,
              updated_at: timestamp,
              updated_by: user?.id,
            }
          }
          return patch.is_primary
            ? contract.marketeur_org_id === marketeurOrgId && !contract.deleted_at
              ? { ...contract, is_primary: false }
              : contract
            : contract
        })
        set({ contracts })
        emitWs('contract:update', { id }, user?.id)
        return contracts.find((contract) => contract.id === id)!
      } catch (error) {
        set({ contracts: previous })
        throw error
      }
    },

    attachProof(id, dataUrl) {
      const { user, role } = actor()
      assertPermission(role, 'contracts.write')
      const contract = findActiveContract(get().contracts, id)
      assertMarketeurOwnership(contract, user)
      if (!isValidPdfDataUrl(dataUrl)) {
        throw new Error('La preuve PDF doit être un fichier valide')
      }
      return mutate(id, (contract, userId) => ({
        ...contract,
        contract_document_url: dataUrl,
        updated_at: now(),
        updated_by: userId,
      }))
    },

    accept(id) {
      const { user, role } = actor()
      assertPermission(role, 'contracts.validate')
      const scope = getScope(user)
      const contract = findActiveContract(get().contracts, id)
      if (!isRegulateurView(scope) && contract.transporter_org_id !== scope.orgId) {
        throw new Error(PERMISSION_DENIED)
      }
      if (!contract.is_active) throw new Error('Impossible d’accepter un contrat inactif ou suspendu')
      if (!contract.contract_document_url) {
        throw new Error('Impossible d’accepter un contrat sans preuve PDF')
      }
      if (!isValidPdfDataUrl(contract.contract_document_url)) {
        throw new Error('Impossible d’accepter une preuve non PDF')
      }
      if (contract.transporter_accepted_at) throw new Error('Contrat déjà accepté')
      return mutate(id, (current, userId) => ({
        ...current,
        transporter_accepted_at: now(),
        updated_at: now(),
        updated_by: userId,
      }))
    },

    suspend(id) {
      const { user, role } = actor()
      assertPermission(role, 'contracts.suspend')
      if (!isRegulateurView(getScope(user))) throw new Error(PERMISSION_DENIED)
      return mutate(id, (contract, userId) => ({
        ...contract,
        is_active: false,
        updated_at: now(),
        updated_by: userId,
      }))
    },

    reactivate(id) {
      const { user, role } = actor()
      assertPermission(role, 'contracts.suspend')
      if (!isRegulateurView(getScope(user))) throw new Error(PERMISSION_DENIED)
      return mutate(id, (contract, userId) => ({
        ...contract,
        is_active: true,
        updated_at: now(),
        updated_by: userId,
      }))
    },

    setPrimary(id) {
      const { user, role } = actor()
      assertPermission(role, 'contracts.write')
      const scope = getScope(user)
      const current = findActiveContract(get().contracts, id)
      if (!isRegulateurView(scope) && current.marketeur_org_id !== scope.orgId) {
        throw new Error(PERMISSION_DENIED)
      }
      const previous = cloneContracts(get().contracts)
      try {
        const timestamp = now()
        const contracts = previous.map((contract) =>
          !contract.deleted_at && contract.marketeur_org_id === current.marketeur_org_id
            ? {
                ...contract,
                is_primary: contract.id === id,
                ...(contract.id === id ? { updated_at: timestamp, updated_by: user?.id } : {}),
              }
            : contract,
        )
        set({ contracts })
        emitWs('contract:update', { id }, user?.id)
        return contracts.find((contract) => contract.id === id)!
      } catch (error) {
        set({ contracts: previous })
        throw error
      }
    },

    remove(id) {
      const { user, role } = actor()
      assertPermission(role, 'contracts.delete')
      const contract = findActiveContract(get().contracts, id)
      assertMarketeurOwnership(contract, user)
      mutate(id, (contract, userId) => ({
        ...contract,
        deleted_at: now(),
        updated_at: now(),
        updated_by: userId,
      }))
    },

    all() {
      const { user } = actor()
      return cloneContracts(get().contracts)
        .filter((contract) => !contract.deleted_at && isInReadScope(contract, user))
        .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
    },

    viewById(id) {
      const { user } = actor()
      const contract = get().contracts.find((row) => row.id === id)
      return contract && !contract.deleted_at && isInReadScope(contract, user) ? { ...contract } : undefined
    },
  }
})

export function newContractId(): string {
  return contractId()
}
