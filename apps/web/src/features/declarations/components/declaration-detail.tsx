import { useMemo } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Scale, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { hasPermission } from '@lpg/permissions'
import { useRoleStore } from '@/store/role-store'
import { useComplianceStore } from '@/store/compliance-store'
import { computeReconciliation } from '@/features/reconciliations/data/reconciliation'
import {
  declarationStatusLabels,
  type DeclarationView,
} from '../data/declarations'

const STATUS_CLASS: Record<DeclarationView['status'], string> = {
  DRAFT: 'bg-slate-200 text-slate-800',
  SUBMITTED: 'bg-sky-100 text-sky-800',
  RECONCILED: 'bg-emerald-600 text-white',
  DISPUTED: 'bg-rose-100 text-rose-900',
}

export function DeclarationDetail({
  declaration,
  open,
  onOpenChange,
}: {
  declaration: DeclarationView
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const activeRole = useRoleStore((s) => s.activeRole)
  const declarations = useComplianceStore((s) => s.declarations)
  const reconcileDeclaration = useComplianceStore((s) => s.reconcileDeclaration)

  const raw = useMemo(
    () => declarations.find((d) => d.id === declaration.id),
    [declarations, declaration.id],
  )
  const comp = useMemo(() => (raw ? computeReconciliation(raw) : null), [raw])
  const canReconcile = useMemo(
    () =>
      hasPermission(activeRole, 'reconciliations.write') &&
      declaration.status === 'SUBMITTED',
    [activeRole, declaration.status],
  )

  function handleReconcile() {
    if (!raw) return
    try {
      reconcileDeclaration(raw.id)
      toast.success(`${declaration.reference} — réconciliation calculée`)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {declaration.reference}
            <Badge className={STATUS_CLASS[declaration.status]}>
              {declarationStatusLabels[declaration.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {declaration.marketeur_name} · {declaration.period}
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-3'>
          <InfoItem label='Volume déclaré' value={declaration.volume_label} />
          <InfoItem label='Soumise le' value={formatDate(declaration.submitted_at)} />
          {declaration.reconciled_at && (
            <InfoItem label='Réconciliée le' value={formatDate(declaration.reconciled_at)} />
          )}
        </div>

        {comp && (
          <div className='space-y-2 rounded-lg border bg-muted/30 p-3'>
            <p className='flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              <Scale className='size-3.5' /> Réconciliation
            </p>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              <InfoItem label='Volume suivi' value={`${comp.tracked_volume.toLocaleString('fr-FR')} TM`} />
              <InfoItem label='Écart' value={`${comp.volume_gap.toLocaleString('fr-FR')} TM`} />
              <InfoItem
                label='Écart (%)'
                value={`${comp.gap_pct.toLocaleString('fr-FR')}%`}
              />
              <InfoItem
                label='Impact subvention'
                value={`${comp.subsidy_impact.toLocaleString('fr-FR')} FCFA`}
              />
            </div>
            <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Timer className='size-3.5' /> Tolérance appliquée : {comp.tolerance_pct}%
              {comp.within_tolerance ? ' — dans la tolérance' : ' — hors tolérance'}
              {comp.within_tolerance && <CheckCircle2 className='size-3.5 text-emerald-500' />}
            </p>
          </div>
        )}

        {canReconcile && (
          <DialogFooter>
            <Button onClick={handleReconcile}>Calculer la réconciliation</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='text-sm font-medium'>{value}</p>
    </div>
  )
}

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR')
}