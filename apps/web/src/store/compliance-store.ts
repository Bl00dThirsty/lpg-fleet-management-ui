import { create } from 'zustand'
import {
  declarations as mockDeclarations,
  reconciliations as mockReconciliations,
  redressements as mockRedressements,
} from '@lpg/mock-data'
import type { Role } from '@lpg/permissions'
import type {
  Declaration,
  Reconciliation,
  Redressement,
  DeclarationStatus,
  ReconciliationStatus,
  RedressementStatus,
} from '@lpg/types'
import { computeReconciliation, reconciliationFromDeclaration } from '@/features/reconciliations/data/reconciliation'
import { assertPermission } from '@/lib/security/guards'
import { useAuthStore } from '@/store/auth-store'

function currentRole(): Role {
  return (useAuthStore.getState().user?.system_role ?? 'LIVREUR') as Role
}

interface ComplianceState {
  declarations: Declaration[]
  reconciliations: Reconciliation[]
  redressements: Redressement[]
  submitDeclaration: (id: string) => void
  reconcileDeclaration: (declarationId: string) => Reconciliation
  verifyReconciliation: (id: string) => void
  issueRedressement: (reconciliationId: string, amount: number) => Redressement
  markRedressementPaid: (id: string) => string
  waiveRedressement: (id: string) => void
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}`
}

export const useComplianceStore = create<ComplianceState>()((set, get) => ({
  declarations: mockDeclarations.map((d) => ({ ...d })),
  reconciliations: mockReconciliations.map((r) => ({ ...r })),
  redressements: mockRedressements.map((r) => ({ ...r })),

  submitDeclaration(id) {
    assertPermission(currentRole(), 'declarations.write')
    const list = get().declarations
    const idx = list.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error('Declaration introuvable')
    const current = list[idx]!
    if (current.status !== 'DRAFT' && current.status !== 'DISPUTED') {
      throw new Error('Seules les declarations en brouillon ou contestees peuvent etre soumises')
    }
    const updated: Declaration = {
      ...current,
      status: 'SUBMITTED' as DeclarationStatus,
      updated_at: new Date().toISOString(),
    }
    const next = [...list]
    next[idx] = updated
    set({ declarations: next })
  },

  reconcileDeclaration(declarationId) {
    assertPermission(currentRole(), 'reconciliations.write')
    const decl = get().declarations.find((d) => d.id === declarationId)
    if (!decl) throw new Error('Declaration introuvable')
    if (decl.status !== 'SUBMITTED') {
      throw new Error('Seules les declarations soumises peuvent etre reconciliees')
    }
    const existing = get().reconciliations.find((r) => r.declaration_id === declarationId)
    const computed = reconciliationFromDeclaration(decl, existing)
    const reconciliation = existing
      ? { ...existing, ...computed, updated_at: new Date().toISOString() }
      : { ...computed, id: genId('rec') }

    const recs = existing
      ? get().reconciliations.map((r) => (r.id === reconciliation.id ? reconciliation : r))
      : [...get().reconciliations, reconciliation]

    const decls = get().declarations.map((d) =>
      d.id === declarationId
        ? { ...d, status: 'RECONCILED' as DeclarationStatus, updated_at: new Date().toISOString() }
        : d,
    )

    set({ reconciliations: recs, declarations: decls })
    return reconciliation
  },

  verifyReconciliation(id) {
    assertPermission(currentRole(), 'reconciliations.write')
    const list = get().reconciliations
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Reconciliation introuvable')
    const current = list[idx]!
    if (current.status !== 'PENDING') {
      throw new Error('Seules les reconciliations en attente peuvent etre verifiees')
    }
    const updated: Reconciliation = {
      ...current,
      status: 'VERIFIED' as ReconciliationStatus,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const next = [...list]
    next[idx] = updated
    set({ reconciliations: next })
  },

  issueRedressement(reconciliationId, amount) {
    assertPermission(currentRole(), 'redressements.write')
    const rec = get().reconciliations.find((r) => r.id === reconciliationId)
    if (!rec) throw new Error('Reconciliation introuvable')
    if (rec.status !== 'VERIFIED') {
      throw new Error('Seules les reconciliations verifiees peuvent donner lieu a un redressement')
    }
    const computation = computeReconciliation(
      get().declarations.find((d) => d.id === rec.declaration_id)!,
      rec.tracked_volume,
    )
    const finalAmount = amount > 0 ? amount : computation.subsidy_impact
    const now = new Date().toISOString()
    const redressement: Redressement = {
      id: genId('rdr'),
      reconciliation_id: reconciliationId,
      amount: finalAmount,
      due_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      status: 'ISSUED' as RedressementStatus,
      issued_at: now,
      paid_at: null,
      transaction_ref: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }
    const recs = get().reconciliations.map((r) =>
      r.id === reconciliationId
        ? { ...r, status: 'REDRESSEMENTAPPLIED' as ReconciliationStatus, updated_at: now }
        : r,
    )
    set({ redressements: [...get().redressements, redressement], reconciliations: recs })
    return redressement
  },

  markRedressementPaid(id) {
    assertPermission(currentRole(), 'redressements.write')
    const list = get().redressements
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Redressement introuvable')
    const current = list[idx]!
    if (current.status !== 'ISSUED') {
      throw new Error('Seuls les redressements emis peuvent etre marques payes')
    }
    // Transaction references are generated by the data layer, never by the
    // component — the backend owns the financial reference scheme.
    const transactionRef = genId('txn')
    const now = new Date().toISOString()
    const updated: Redressement = {
      ...current,
      status: 'PAID' as RedressementStatus,
      paid_at: now,
      transaction_ref: transactionRef,
      updated_at: now,
    }
    const next = [...list]
    next[idx] = updated
    set({ redressements: next })
    return transactionRef
  },

  waiveRedressement(id) {
    assertPermission(currentRole(), 'redressements.write')
    const list = get().redressements
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Redressement introuvable')
    const current = list[idx]!
    if (current.status === 'PAID') {
      throw new Error('Un redressement paye ne peut etre annule')
    }
    const updated: Redressement = {
      ...current,
      status: 'WAIVED' as RedressementStatus,
      updated_at: new Date().toISOString(),
    }
    const next = [...list]
    next[idx] = updated
    set({ redressements: next })
  },
}))