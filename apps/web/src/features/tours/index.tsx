import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@lpg/ui'
import { hasPermission } from '@lpg/permissions'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { TourActiveHeader } from './components/tour-active-header'
import { TourCreateWizard } from './components/tour-create-wizard'
import { ToursTable } from './components/tours-table'
import { getTourActivity, type TourSlice } from './data/tour-activity'
import { getScope } from '@/features/scope/scope'
import { useRoleStore } from '@/store/role-store'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'

const SLICES: { value: TourSlice; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'INTERNAL', label: 'Internes' },
  { value: 'EXTERNAL', label: 'Externalisees' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACTIVE', label: 'Actives' },
  { value: 'HISTORY', label: 'Historique' },
]

export function ToursPage() {
  const navigate = useNavigate()
  const activeRole = useRoleStore((s) => s.activeRole)
  const canCreate = hasPermission(activeRole, 'tours.create')
  const [slice, setSlice] = useState<TourSlice>('ALL')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  // Subscribe to the tours store so created / updated tours surface in the
  // table and header (the store is the single source of truth, seeded from
  // the curated fixtures).
  const storeTours = useToursStore((s) => s.tours)
  const storeCheckpoints = useToursStore((s) => s.checkpoints)
  const user = useAuthStore((s) => s.user)
  const scope = useMemo(() => getScope(user), [user])
  const tours = useMemo(
    () => getTourActivity(slice, scope),
    [slice, scope, storeTours, storeCheckpoints],
  )
  const selectedTrip = tours.find((t) => t.id === selectedId) ?? tours[0]

  function openDetail(id: string) {
    navigate({ to: '/tour-tracking/$tourId', params: { tourId: id } })
  }

  return (
    <PageShell>
      <PageHeader
        title='Tournées de livraison'
        description='Flux 2 — livraisons creees par les marketeurs et executees en interne ou par un transporteur.'
        actions={
          canCreate ? (
            <Button onClick={() => setWizardOpen(true)} className='gap-1'>
              <Plus className='size-4' /> Nouvelle tournée
            </Button>
          ) : undefined
        }
      />
      <TourCreateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={() => {
          /* The tour is written into the tours store, which the page reads
             reactively — the new tour surfaces in the table automatically. */
        }}
      />
      {selectedTrip && (
        <TourActiveHeader
          trip={selectedTrip}
          trips={tours}
          onSelectTrip={(id) => setSelectedId(id)}
        />
      )}
      <SectionCard>
        <div className='mb-4 flex flex-wrap gap-2'>
          {SLICES.map((s) => (
            <button
              key={s.value}
              type='button'
              onClick={() => { setSlice(s.value); setSelectedId(undefined) }}
              className={
                slice === s.value
                  ? 'rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
                  : 'rounded-full border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted'
              }
            >
              {s.label}
            </button>
          ))}
        </div>
        <ToursTable
          rows={tours}
          selectedTripId={selectedTrip?.id}
          onOpenDetails={(row) => openDetail(row.id)}
        />
      </SectionCard>
    </PageShell>
  )
}