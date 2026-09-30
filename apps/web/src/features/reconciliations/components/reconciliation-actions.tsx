import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useComplianceStore } from '@/store/compliance-store'
import { gapToleranceThreshold, type ReconciliationView } from '../data/reconciliations'

export function ReconciliationActions({ reconciliation }: { reconciliation: ReconciliationView }) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const reconcileDeclaration = useComplianceStore((s) => s.reconcileDeclaration)
  const verifyReconciliation = useComplianceStore((s) => s.verifyReconciliation)
  const issueRedressement = useComplianceStore((s) => s.issueRedressement)

  const canReconcile = useMemo(
    () => hasPermission(activeRole, 'reconciliations.write') && reconciliation.status === 'PENDING',
    [activeRole, reconciliation.status],
  )

  const canVerify = useMemo(
    () => hasPermission(activeRole, 'reconciliations.manage') && reconciliation.status === 'PENDING',
    [activeRole, reconciliation.status],
  )

  const canRedress = useMemo(
    () =>
      hasPermission(activeRole, 'redressements.write') &&
      reconciliation.status === 'VERIFIED' &&
      reconciliation.gap_percentage > gapToleranceThreshold(),
    [activeRole, reconciliation.status, reconciliation.gap_percentage],
  )

  if (!canReconcile && !canVerify && !canRedress) return null

  function handleReconcile() {
    try {
      reconcileDeclaration(reconciliation.declaration_id)
      toast.success(`${reconciliation.reference} — Réconciliation effectuée`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  function handleVerify() {
    try {
      verifyReconciliation(reconciliation.id)
      toast.success(`${reconciliation.reference} — Réconciliation vérifiée`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  function handleRedress() {
    try {
      issueRedressement(reconciliation.id, reconciliation.subsidy_impact)
      toast.success(
        `${reconciliation.reference} — Redressement de ${reconciliation.subsidy_impact.toLocaleString('fr-FR')} XAF émis`,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  return (
    <div className='flex flex-wrap justify-end gap-2 border-t pt-3'>
      {canReconcile && <Button onClick={handleReconcile}>Réconcilier</Button>}
      {canVerify && <Button variant='outline' onClick={handleVerify}>Vérifier</Button>}
      {canRedress && (
        <Button variant='destructive' onClick={handleRedress}>
          Émettre un redressement
        </Button>
      )}
    </div>
  )
}