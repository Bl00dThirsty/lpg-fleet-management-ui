export type ContractStatus =
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'PENDING'
  | 'PENDINGTRANSPORTERACK'
  | 'EXPIRED'
  | 'UPCOMING'
  | 'ACTIVE'

export type ContractStatusInput = {
  deleted_at?: string | null
  is_active: boolean
  contract_document_url?: string | null
  transporter_accepted_at?: string | null
  started_at?: string | null
  ended_at?: string | null
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  PENDING: 'Preuve manquante',
  PENDINGTRANSPORTERACK: 'En attente du transporteur',
  ACTIVE: 'Actif',
  UPCOMING: 'À venir',
  EXPIRED: 'Expiré',
  SUSPENDED: 'Suspendu',
  CANCELLED: 'Annulé',
}

export const CONTRACT_STATUS_CLASSES: Record<ContractStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  PENDINGTRANSPORTERACK: 'bg-amber-100 text-amber-900',
  ACTIVE: 'bg-emerald-100 text-emerald-900',
  UPCOMING: 'bg-sky-100 text-sky-900',
  EXPIRED: 'bg-rose-100 text-rose-900',
  SUSPENDED: 'bg-slate-200 text-slate-800',
  CANCELLED: 'bg-slate-200 text-slate-800 line-through',
}

export function deriveContractStatus(
  contract: ContractStatusInput,
  now: Date = new Date(),
): ContractStatus {
  if (contract.deleted_at) return 'CANCELLED'
  if (!contract.is_active) return 'SUSPENDED'
  if (!contract.contract_document_url) return 'PENDING'
  if (!contract.transporter_accepted_at) return 'PENDINGTRANSPORTERACK'

  const nowTime = now.getTime()
  if (contract.ended_at && new Date(contract.ended_at).getTime() < nowTime) {
    return 'EXPIRED'
  }
  if (contract.started_at && new Date(contract.started_at).getTime() > nowTime) {
    return 'UPCOMING'
  }
  return 'ACTIVE'
}

export function contractsEligibleForExternal(
  contracts: readonly (ContractStatusInput & {
    id: string
    marketeur_org_id: string
  })[],
  marketeurOrgId: string,
  now: Date = new Date(),
): string[] {
  return contracts
    .filter(
      (contract) =>
        contract.marketeur_org_id === marketeurOrgId &&
        deriveContractStatus(contract, now) === 'ACTIVE',
    )
    .map((contract) => contract.id)
}
