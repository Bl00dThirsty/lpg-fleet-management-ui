import { organizations } from '@lpg/mock-data'
import type { TransporterContract } from '@lpg/types'
import { getScope, isRegulateurView, type UserScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { useContractsStore } from '@/store/contracts-store'
import { deriveContractStatus, type ContractStatus } from '../lib/contract-status'

export interface TransporterContractView {
  id: string
  reference: string
  marketeur_org_id: string
  transporter_org_id: string
  marketeur_name: string
  transporter_name: string
  start_date: string
  end_date: string | null
  is_primary: boolean
  is_active: boolean
  has_proof: boolean
  status: ContractStatus
}

function orgName(id: string): string {
  return organizations.find((o) => o.id === id)?.name ?? id
}

export function getTransporterContracts(
  contracts: TransporterContract[] = useContractsStore.getState().all(),
  scope: UserScope = getScope(useAuthStore.getState().user),
): TransporterContractView[] {
  return contracts
    .filter((tc) => isRegulateurView(scope)
      || (scope.view === 'site' && tc.marketeur_org_id === scope.orgId)
      || (scope.view === 'transporter' && tc.transporter_org_id === scope.orgId))
    .map((tc) => ({
      id: tc.id,
      reference: tc.contract_reference ?? tc.id,
      marketeur_org_id: tc.marketeur_org_id,
      transporter_org_id: tc.transporter_org_id,
      marketeur_name: orgName(tc.marketeur_org_id),
      transporter_name: orgName(tc.transporter_org_id),
      start_date: (tc.started_at ?? tc.created_at ?? '').slice(0, 10),
      end_date: tc.ended_at ? tc.ended_at.slice(0, 10) : null,
      is_primary: tc.is_primary,
      is_active: tc.is_active,
      has_proof: Boolean(tc.contract_document_url),
      status: deriveContractStatus(tc),
    }))
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
}

export function getTransporterContractSummary(rows: TransporterContractView[]) {
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === 'ACTIVE').length,
    primary: rows.filter((r) => r.is_primary).length,
    inactive: rows.filter((r) => !r.is_active).length,
    pending: rows.filter((r) => r.status === 'PENDING' || r.status === 'PENDINGTRANSPORTERACK').length,
  }
}
