import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useComplianceStore } from '@/store/compliance-store'
import type { RedressementView } from '../data/redressements'

export function RedressementRowActions({ row }: { row: RedressementView }) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const markRedressementPaid = useComplianceStore((s) => s.markRedressementPaid)
  const waiveRedressement = useComplianceStore((s) => s.waiveRedressement)

  const canPay = useMemo(
    () => hasPermission(activeRole, 'redressements.write') && row.status === 'ISSUED',
    [activeRole, row.status],
  )

  const canWaive = useMemo(
    () => hasPermission(activeRole, 'redressements.write') && row.status === 'ISSUED',
    [activeRole, row.status],
  )

  if (!canPay && !canWaive) return null

  function handlePay() {
    try {
      const ref = markRedressementPaid(row.id)
      toast.success(`${row.reference} - Marque paye (${ref})`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  function handleWaive() {
    try {
      waiveRedressement(row.id)
      toast.success(`${row.reference} - Redressement annule`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  return (
    <div className='flex gap-2'>
      {canPay && <Button size='sm' onClick={handlePay}>Marquer paye</Button>}
      {canWaive && <Button size='sm' variant='outline' onClick={handleWaive}>Annuler</Button>}
    </div>
  )
}