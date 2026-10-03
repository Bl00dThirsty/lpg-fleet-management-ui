import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Eye, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useComplianceStore } from '@/store/compliance-store'
import type { DeclarationView } from '../data/declarations'
import { DeclarationDetail } from './declaration-detail'

export function DeclarationRowActions({ row }: { row: DeclarationView }) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const submitDeclaration = useComplianceStore((s) => s.submitDeclaration)
  const [detailOpen, setDetailOpen] = useState(false)

  const canSubmit = useMemo(
    () =>
      hasPermission(activeRole, 'declarations.write') &&
      (row.status === 'DRAFT' || row.status === 'DISPUTED'),
    [activeRole, row.status],
  )

  function handleSubmit() {
    try {
      submitDeclaration(row.id)
      toast.success(`${row.reference} — déclaration soumise`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  return (
    <>
      <div className='flex justify-end gap-1.5'>
        <Button size='sm' variant='outline' onClick={() => setDetailOpen(true)}>
          <Eye className='mr-1 size-3.5' /> Détails
        </Button>
        {canSubmit && (
          <Button size='sm' onClick={handleSubmit}>
            <Send className='mr-1 size-3.5' /> Soumettre
          </Button>
        )}
      </div>
      <DeclarationDetail
        declaration={row}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}