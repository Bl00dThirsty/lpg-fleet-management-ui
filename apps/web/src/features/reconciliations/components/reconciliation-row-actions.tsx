import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useComplianceStore } from '@/store/compliance-store'
import type { ReconciliationView } from '../data/reconciliations'

export function ReconciliationRowActions({ row }: { row: ReconciliationView }) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const reconcileDeclaration = useComplianceStore((s) => s.reconcileDeclaration)
  const verifyReconciliation = useComplianceStore((s) => s.verifyReconciliation)

  const canReconcile = useMemo(
    () => hasPermission(activeRole, 'reconciliations.write') && row.status === 'PENDING',
    [activeRole, row.status],
  )

  const canVerify = useMemo(
    () => hasPermission(activeRole, 'reconciliations.manage') && row.status === 'PENDING',
    [activeRole, row.status],
  )

  if (!canReconcile && !canVerify) return null

  function handleReconcile() {
    try {
      reconcileDeclaration(row.id)
      toast.success(`${row.reference} - Reconciliation effectuee`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  function handleVerify() {
    try {
      verifyReconciliation(row.id)
      toast.success(`${row.reference} - Reconciliation verifiee`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  return (
    <div className='flex gap-2'>
      {canReconcile && <Button size='sm' onClick={handleReconcile}>Reconcilier</Button>}
      {canVerify && <Button size='sm' variant='outline' onClick={handleVerify}>Verifier</Button>}
    </div>
  )
}