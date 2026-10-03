import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useComplianceStore } from '@/store/compliance-store'
import { gapToleranceThreshold, type ReconciliationView } from '../data/reconciliations'

export function ReconciliationRowActions({ row }: { row: ReconciliationView }) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const reconcileDeclaration = useComplianceStore((s) => s.reconcileDeclaration)
  const verifyReconciliation = useComplianceStore((s) => s.verifyReconciliation)
  const issueRedressement = useComplianceStore((s) => s.issueRedressement)

  const canReconcile = useMemo(
    () => hasPermission(activeRole, 'reconciliations.write') && row.status === 'PENDING',
    [activeRole, row.status],
  )

  const canVerify = useMemo(
    () => hasPermission(activeRole, 'reconciliations.manage') && row.status === 'PENDING',
    [activeRole, row.status],
  )

  const canRedress = useMemo(
    () =>
      hasPermission(activeRole, 'redressements.write') &&
      row.status === 'VERIFIED' &&
      row.gap_percentage > gapToleranceThreshold(),
    [activeRole, row.status, row.gap_percentage],
  )

  if (!canReconcile && !canVerify && !canRedress) return null

  function handleReconcile() {
    try {
      reconcileDeclaration(row.declaration_id)
      toast.success(`${row.reference} — Réconciliation effectuée`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  function handleVerify() {
    try {
      verifyReconciliation(row.id)
      toast.success(`${row.reference} — Réconciliation vérifiée`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  function handleRedress() {
    try {
      issueRedressement(row.id, row.subsidy_impact)
      toast.success(`${row.reference} — Redressement de ${row.subsidy_impact.toLocaleString('fr-FR')} XAF émis`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  return (
    <div className='flex gap-2'>
      {canReconcile && <Button size='sm' onClick={handleReconcile}>Réconcilier</Button>}
      {canVerify && <Button size='sm' variant='outline' onClick={handleVerify}>Vérifier</Button>}
      {canRedress && (
        <Button size='sm' variant='destructive' onClick={handleRedress}>
          Redressement
        </Button>
      )}
    </div>
  )
}