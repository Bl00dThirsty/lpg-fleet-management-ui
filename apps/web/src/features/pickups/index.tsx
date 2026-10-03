import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@lpg/ui'
import { vehicles as vehiclesData } from '@lpg/mock-data'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { PickupsTable } from './components/pickups-table'
import { PickupsCreateWizard } from './components/pickups-create-wizard'
import { PickupsValidateDialog } from './components/pickups-validate-dialog'
import { getPickups, getPickupSummary, type Pickup } from './data/pickups'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { usePickupsStore } from '@/store/pickups-store'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'
import { hasPermission } from '@lpg/permissions'
import type { PickupRequest } from '@lpg/types'
import type { Role } from '@/config/rbac/roles'

export function PickupsPage({ role }: { role: Role }) {
  // The store is the single source of truth (seeded fixtures + created /
  // validated / cancelled requests); the page reads it reactively.
  const storeRows = usePickupsStore((s) => s.pickups)
  const user = useAuthStore((s) => s.user)
  const scope = useMemo(() => getScope(user), [user])
  const rows = useMemo(() => getPickups(scope, storeRows), [scope, storeRows])
  const [createOpen, setCreateOpen] = useState(false)
  const [assignedVehicles, setAssignedVehicles] = useState<Record<string, string[]>>({})
  const [validateOpen, setValidateOpen] = useState<Pickup | null>(null)
  const [detailOpen, setDetailOpen] = useState<Pickup | null>(null)

  const canCreate = hasPermission(role, 'pickups.create')
  const canValidate = hasPermission(role, 'pickups.validate')
  const canWrite = hasPermission(role, 'pickups.write')

  const summary = getPickupSummary(rows)

  const handleCreated = (created: PickupRequest, vehicleIds: string[]) => {
    setAssignedVehicles((prev) => ({ ...prev, [created.id]: vehicleIds }))
  }

  const handleValidate = (row: Pickup, qty: number) => {
    try {
      usePickupsStore.getState().validatePickup(row.id, qty)
      toast.success(`${row.reference} validée pour ${qty.toLocaleString('fr-FR')} TM`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleCancel = (row: Pickup) => {
    try {
      usePickupsStore.getState().cancelPickup(row.id)
      toast.warning(`${row.reference} annulée`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const detailVehicleIds = detailOpen ? assignedVehicles[detailOpen.id] ?? [] : []
  const detailVehicles = detailVehicleIds
    .map((vid) => vehiclesData.find((v) => v.id === vid)?.license_plate ?? vid)
    .join(', ')

  return (
    <PageShell>
      <PageHeader
        title='Approvisionnements (Flux 1)'
        description={`${summary.total} requêtes — ${summary.draft} brouillon(s), ${summary.validated} validée(s), ${summary.inProgress} en cours, ${summary.completed} terminée(s).`}
        actions={
          canCreate ? (
            <Button className='gap-2' onClick={() => setCreateOpen(true)}>
              <Plus className='size-4' /> Nouvelle requête
            </Button>
          ) : null
        }
      />
      <SectionCard>
        <PickupsTable
          rows={rows}
          onOpenDetails={(row) => {
            if (canValidate && row.pickup_status === 'DRAFT') {
              setValidateOpen(row)
            } else {
              setDetailOpen(row)
            }
          }}
        />
      </SectionCard>

      <PickupsCreateWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <PickupsValidateDialog
        pickup={validateOpen}
        open={validateOpen !== null}
        onOpenChange={(o) => { if (!o) setValidateOpen(null) }}
        onValidate={(qty) => validateOpen && handleValidate(validateOpen, qty)}
      />

      <Dialog open={detailOpen !== null && validateOpen === null} onOpenChange={(o) => { if (!o) setDetailOpen(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailOpen?.reference ?? '—'}</DialogTitle>
          </DialogHeader>
          {detailOpen && (
            <div className='space-y-2 py-2 text-sm'>
              <p>Marketeur: {detailOpen.marketeur_name}</p>
              <p>Source: {detailOpen.source_name}</p>
              <p>Destination: {detailOpen.destination_name}</p>
              <p>Quantité demandée: {detailOpen.requested_quantity.toLocaleString('fr-FR')} TM</p>
              <p>Quantité approuvée: {detailOpen.approved_quantity?.toLocaleString('fr-FR') ?? '—'}</p>
              <p>Statut: {detailOpen.pickup_status}</p>
              {detailVehicleIds.length > 0 && (
                <p>Véhicules: {detailVehicles}</p>
              )}
            </div>
          )}
          {canWrite && detailOpen?.pickup_status !== 'CANCELLED' && detailOpen?.pickup_status !== 'COMPLETED' ? (
            <DialogFooter>
              <Button variant='destructive' onClick={() => { if (detailOpen) handleCancel(detailOpen); setDetailOpen(null) }}>
                Annuler la requête
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}