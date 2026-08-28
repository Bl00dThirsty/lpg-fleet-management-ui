import { redressements, reconciliations, declarations, organizations } from '@lpg/mock-data'
import type { Redressement, RedressementStatus } from '@lpg/types'

export type { RedressementStatus }

export interface RedressementView {
  id: string
  reference: string
  reconciliation_reference: string
  marketeur_name: string
  amount: number
  amount_label: string
  currency: string
  status: RedressementStatus
  status_label: string
  issued_at: string
  due_date: string | null
  paid_at: string | null
  transaction_ref: string | null
}

export const redressementStatusLabels: Record<RedressementStatus, string> = {
  ISSUED: 'Émis',
  PAID: 'Payé',
  WAIVED: 'Annulé',
}

export const redressementStatusOptions: readonly { label: string; value: RedressementStatus }[] = (
  Object.keys(redressementStatusLabels) as RedressementStatus[]
).map((value) => ({ label: redressementStatusLabels[value], value }))

function orgName(id: string): string {
  return organizations.find((o) => o.id === id)?.name ?? id
}

export function redressementsToViews(
  list: readonly Redressement[],
): RedressementView[] {
  const reconIndex = new Map(reconciliations.map((r, i) => [r.id, `REC-${String(i + 1).padStart(3, '0')}`]))
  const reconById = new Map(reconciliations.map((r) => [r.id, r]))
  const declById = new Map(declarations.map((d) => [d.id, d]))

  return list
    .map((r, i) => {
      const recon = reconById.get(r.reconciliation_id)
      const decl = recon ? declById.get(recon.declaration_id) : undefined
      return {
        id: r.id,
        reference: `RED-${String(i + 1).padStart(3, '0')}`,
        reconciliation_reference: reconIndex.get(r.reconciliation_id) ?? '—',
        marketeur_name: decl ? orgName(decl.marketeur_org_id) : '—',
        amount: r.amount,
        amount_label: `${r.amount.toLocaleString('fr-FR')} XAF`,
        currency: 'XAF',
        status: r.status,
        status_label: redressementStatusLabels[r.status],
        issued_at: r.issued_at ?? r.created_at ?? '',
        due_date: r.due_date ?? null,
        paid_at: r.paid_at ?? null,
        transaction_ref: r.transaction_ref ?? null,
      }
    })
    .sort((a, b) => b.issued_at.localeCompare(a.issued_at))
}

export function getRedressements(): RedressementView[] {
  return redressementsToViews(redressements)
}

export function getRedressementSummary(rows: RedressementView[]) {
  return {
    total: rows.length,
    issued: rows.filter((r) => r.status === 'ISSUED').length,
    paid: rows.filter((r) => r.status === 'PAID').length,
    waived: rows.filter((r) => r.status === 'WAIVED').length,
    totalOutstanding: rows
      .filter((r) => r.status === 'ISSUED')
      .reduce((acc, r) => acc + r.amount, 0),
  }
}