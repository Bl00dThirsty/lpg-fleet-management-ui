import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useComplianceStore } from '@/store/compliance-store'
import type { ReconciliationView } from '../data/reconciliations'

export function ReconciliationActions({ reconciliation }: { reconciliation: ReconciliationView }) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const reconcileDeclaration = useComplianceStore((s) => s.reconcileDeclaration)
  const verifyReconciliation = useComplianceStore((s) => s.verifyReconciliation)

  const canReconcile = useMemo(
    () => hasPermission(activeRole, 'reconciliations.write') && reconciliation.status === 'PENDING',
    [activeRole, reconciliation.status],
  )

  const canVerify = useMemo(
    () => hasPermission(activeRole, 'reconciliations.manage') && reconciliation.status === 'PENDING',
    [activeRole, reconciliation.status],
  )

  if (!canReconcile && !canVerify) return null

  function handleReconcile() {
    try {
      reconcileDeclaration(reconciliation.id)
      toast.success(`${reconciliation.reference} - Reconciliation effectuee`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  function handleVerify() {
    try {
      verifyReconciliation(reconciliation.id)
      toast.success(`${reconciliation.reference} - Reconciliation verifiee`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  return (
    <div className='flex flex-wrap justify-end gap-2 border-t pt-3'>
      {canReconcile && <Button onClick={handleReconcile}>Reconcilier</Button>}
      {canVerify && <Button variant='outline' onClick={handleVerify}>Verifier</Button>}
    </div>
  )
}