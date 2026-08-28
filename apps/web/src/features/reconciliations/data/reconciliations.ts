import { reconciliations, declarations, organizations, getSettingNumber } from '@lpg/mock-data'
import type { Reconciliation, ReconciliationStatus } from '@lpg/types'

export type { ReconciliationStatus }

export interface ReconciliationView {
  id: string
  reference: string
  declaration_reference: string
  marketeur_name: string
  declared_volume: number
  tracked_volume: number
  volume_gap: number
  gap_percentage: number
  subsidy_impact: number
  status: ReconciliationStatus
  status_label: string
  verified_at: string | null
}

export const reconciliationStatusLabels: Record<ReconciliationStatus, string> = {
  PENDING: 'En attente',
  VERIFIED: 'Vérifiée',
  REDRESSEMENTAPPLIED: 'Redressement appliqué',
}

export const reconciliationStatusOptions: readonly { label: string; value: ReconciliationStatus }[] = (
  Object.keys(reconciliationStatusLabels) as ReconciliationStatus[]
).map((value) => ({ label: reconciliationStatusLabels[value], value }))

function orgName(id: string): string {
  return organizations.find((o) => o.id === id)?.name ?? id
}

export function reconciliationsToViews(
  list: readonly Reconciliation[],
): ReconciliationView[] {
  const declByRef = new Map(
    declarations.map((d, i) => [d.id, `DEC-${String(i + 1).padStart(3, '0')}`]),
  )
  const declById = new Map(declarations.map((d) => [d.id, d]))

  return list
    .map((r, i) => {
      const decl = declById.get(r.declaration_id)
      const declared = decl?.declared_volume ?? 0
      const gapPct = declared > 0 ? Math.abs((r.volume_gap / declared) * 100) : 0
      return {
        id: r.id,
        reference: `REC-${String(i + 1).padStart(3, '0')}`,
        declaration_reference: declByRef.get(r.declaration_id) ?? '—',
        marketeur_name: decl ? orgName(decl.marketeur_org_id) : '—',
        declared_volume: declared,
        tracked_volume: r.tracked_volume,
        volume_gap: r.volume_gap,
        gap_percentage: gapPct,
        subsidy_impact: r.subsidy_impact,
        status: r.status,
        status_label: reconciliationStatusLabels[r.status],
        verified_at: r.verified_at ?? null,
      }
    })
    .sort((a, b) => b.gap_percentage - a.gap_percentage)
}

export function getReconciliations(): ReconciliationView[] {
  return reconciliationsToViews(reconciliations)
}

export function gapToleranceThreshold(): number {
  return getSettingNumber('reconciliation.volume_gap_tolerance_percent') ?? 2.5
}

export function getReconciliationSummary(rows: ReconciliationView[]) {
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'PENDING').length,
    verified: rows.filter((r) => r.status === 'VERIFIED').length,
    redressement: rows.filter((r) => r.status === 'REDRESSEMENTAPPLIED').length,
    flagged: rows.filter((r) => r.gap_percentage > gapToleranceThreshold()).length,
    totalGap: rows.reduce((acc, r) => acc + Math.abs(r.volume_gap), 0),
    totalSubsidy: rows.reduce((acc, r) => acc + r.subsidy_impact, 0),
  }
}