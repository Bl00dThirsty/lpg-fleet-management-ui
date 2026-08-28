import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useComplianceStore } from '@/store/compliance-store'
import type { RedressementView } from '../data/redressements'

const PAY_PERMISSION = 'redressements.write'
const WAIVE_PERMISSION = 'redressements.write'

export function RedressementActions({ redressement }: { redressement: RedressementView }) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const markRedressementPaid = useComplianceStore((s) => s.markRedressementPaid)
  const waiveRedressement = useComplianceStore((s) => s.waiveRedressement)

  const canPay = useMemo(
    () => hasPermission(activeRole, PAY_PERMISSION) && redressement.status === 'ISSUED',
    [activeRole, redressement.status],
  )

  const canWaive = useMemo(
    () => hasPermission(activeRole, WAIVE_PERMISSION) && redressement.status === 'ISSUED',
    [activeRole, redressement.status],
  )

  if (!canPay && !canWaive) return null

  function handlePay() {
    try {
      const ref = markRedressementPaid(redressement.id)
      toast.success(`${redressement.reference} - Marque paye (${ref})`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  function handleWaive() {
    try {
      waiveRedressement(redressement.id)
      toast.success(`${redressement.reference} - Redressement annule`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  return (
    <div className='flex flex-wrap justify-end gap-2 border-t pt-3'>
      {canPay && <Button onClick={handlePay}>Marquer paye</Button>}
      {canWaive && <Button variant='outline' onClick={handleWaive}>Annuler</Button>}
    </div>
  )
}