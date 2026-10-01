import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@lpg/ui'
import { PackageCheck } from 'lucide-react'
import type { Pickup } from '../data/pickups'

export function PickupsValidateDialog({
  pickup,
  open,
  onOpenChange,
  onValidate,
}: {
  pickup: Pickup | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onValidate: (approvedQuantity: number) => void
}) {
  const [qty, setQty] = useState('')
  if (!pickup) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valider {pickup.reference}</DialogTitle>
        </DialogHeader>
        <div className='space-y-3 py-2'>
          <p className='text-sm text-muted-foreground'>
            Quantité demandée: <strong>{pickup.requested_quantity.toLocaleString('fr-FR')} TM</strong>
          </p>
          <label className='block text-sm'>
            <span>Quantité approuvée (TM)</span>
            <input
              type='number'
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className='mt-1 w-full rounded-md border px-2 py-1'
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            className='gap-2'
            disabled={qty.trim() === ''}
            onClick={() => {
              const n = Number(qty)
              if (!Number.isFinite(n) || n <= 0) return
              onValidate(n)
              onOpenChange(false)
            }}
          >
            <PackageCheck className='size-4' /> Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}