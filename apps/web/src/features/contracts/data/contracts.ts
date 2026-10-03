import { transporter_contracts, organizations } from '@lpg/mock-data'

export interface ContractByTransporter {
  transporterId: string
  transporterName: string
  contractCount: number
  activeCount: number
  primaryCount: number
  marketeurs: string[]
}

function orgName(id: string): string {
  return organizations.find((o) => o.id === id)?.name ?? id
}

export function getContractsByTransporter(): ContractByTransporter[] {
  const groups = new Map<string, {
    transporterId: string
    transporterName: string
    contractCount: number
    activeCount: number
    primaryCount: number
    marketeurs: Set<string>
  }>()

  for (const tc of transporter_contracts) {
    const current = groups.get(tc.transporter_org_id) ?? {
      transporterId: tc.transporter_org_id,
      transporterName: orgName(tc.transporter_org_id),
      contractCount: 0,
      activeCount: 0,
      primaryCount: 0,
      marketeurs: new Set<string>(),
    }
    current.contractCount += 1
    if (tc.is_active) current.activeCount += 1
    if (tc.is_primary) current.primaryCount += 1
    current.marketeurs.add(orgName(tc.marketeur_org_id))
    groups.set(tc.transporter_org_id, current)
  }

  return Array.from(groups.values())
    .map((g) => ({
      transporterId: g.transporterId,
      transporterName: g.transporterName,
      contractCount: g.contractCount,
      activeCount: g.activeCount,
      primaryCount: g.primaryCount,
      marketeurs: Array.from(g.marketeurs),
    }))
    .sort((a, b) => b.contractCount - a.contractCount)
}

export function getContractSummary() {
  const rows = getContractsByTransporter()
  const totalContracts = transporter_contracts.length
  return {
    transporters: rows.length,
    totalContracts,
    active: transporter_contracts.filter((c) => c.is_active).length,
    primary: transporter_contracts.filter((c) => c.is_primary).length,
  }
}