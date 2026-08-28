import { declarations, organizations } from '@lpg/mock-data'
import type { Declaration, DeclarationStatus } from '@lpg/types'
import type { UserScope } from '@/features/scope/scope'
import { scopeBySiteOrCreator, scopeWithOrgId } from '@/features/scope/site-creator'

export type { DeclarationStatus }

export interface DeclarationView {
  id: string
  reference: string
  marketeur_name: string
  period: string
  declared_volume: number
  volume_label: string
  status: DeclarationStatus
  status_label: string
  submitted_at: string
  reconciled_at: string | null
}

export const declarationStatusLabels: Record<DeclarationStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  RECONCILED: 'Réconciliée',
  DISPUTED: 'Contestée',
}

export const declarationStatusOptions: readonly { label: string; value: DeclarationStatus }[] = (
  Object.keys(declarationStatusLabels) as DeclarationStatus[]
).map((value) => ({ label: declarationStatusLabels[value], value }))

function orgName(id: string): string {
  return organizations.find((o) => o.id === id)?.name ?? id
}

export function declarationsToViews(
  list: readonly Declaration[],
  scope?: UserScope,
): DeclarationView[] {
  const source = scope
    ? scopeBySiteOrCreator(
        [...list],
        scopeWithOrgId(scope),
        (d) => d.marketeur_org_id,
        (d) => d.created_by ?? undefined,
      )
    : list
  return source
    .map((d, i) => ({
      id: d.id,
      reference: `DEC-${String(i + 1).padStart(3, '0')}`,
      marketeur_name: orgName(d.marketeur_org_id),
      period: `${d.period_start.slice(0, 10)} au ${d.period_end.slice(0, 10)}`,
      declared_volume: d.declared_volume,
      volume_label: `${d.declared_volume.toLocaleString('fr-FR')} TM`,
      status: d.status,
      status_label: declarationStatusLabels[d.status],
      submitted_at: d.created_at ?? '',
      reconciled_at: d.status === 'RECONCILED' ? (d.updated_at ?? null) : null,
    }))
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
}

export function getDeclarations(scope?: UserScope): DeclarationView[] {
  return declarationsToViews(declarations, scope)
}

export function getDeclarationSummary(rows: DeclarationView[]) {
  return {
    total: rows.length,
    draft: rows.filter((r) => r.status === 'DRAFT').length,
    submitted: rows.filter((r) => r.status === 'SUBMITTED').length,
    reconciled: rows.filter((r) => r.status === 'RECONCILED').length,
    disputed: rows.filter((r) => r.status === 'DISPUTED').length,
  }
}