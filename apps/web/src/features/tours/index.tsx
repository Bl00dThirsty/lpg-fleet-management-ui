import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Smartphone } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import { Button } from '@lpg/ui'
import { useToursStore } from '@/store/tours-store'
import { TourActiveHeader } from './components/tour-active-header'
import { ToursTable } from './components/tours-table'
import { TourCreateDialog } from './components/tour-create-dialog'
import { TourPdaSimulatorModal } from './components/tour-pda-simulator-modal'
import { type TourSlice } from './data/tour-activity'
import { useTourLiveRefresh } from './lib/use-tour-live-refresh'

const SLICES: { value: TourSlice; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'INTERNAL', label: 'Internes' },
  { value: 'EXTERNAL', label: 'Externalisées' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACTIVE', label: 'Actives' },
  { value: 'HISTORY', label: 'Historique' },
]

export function ToursPage() {
  const navigate = useNavigate()
  const [slice, setSlice] = useState<TourSlice>('ALL')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [pdaModalOpen, setPdaModalOpen] = useState(false)
  const storeTours = useToursStore((s) => s.tours)
  const storeCheckpoints = useToursStore((s) => s.checkpoints)
  const allTours = useMemo(
    () =>
      useToursStore
        .getState()
        .views(slice)
        .filter((t) => t.mission_kind !== 'PICKUP'),
    [slice, storeTours, storeCheckpoints]
  )

  const tours = allTours

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const selectedTrip = tours.find((t) => t.id === selectedId) ?? tours[0]

  useEffect(() => {
    useToursStore.getState().fetchTours()
  }, [])

  useTourLiveRefresh()

  function openDetail(id: string) {
    navigate({ to: '/tour-tracking/$tourId', params: { tourId: id } })
  }

  return (
    <PageShell>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <PageHeader
          title='Suivi des tournées'
          description='Flux 2 — livraisons créées par les marketeurs et exécutées en interne ou par un transporteur.'
        />
        <div className='flex items-center gap-2'>
          {selectedTrip && import.meta.env.VITE_API_MODE !== 'http' && (
            <Button
              variant='outline'
              onClick={() => setPdaModalOpen(true)}
              className='flex items-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400'
            >
              <Smartphone className='h-4 w-4' />
              Simulateur PDA ({selectedTrip.reference})
            </Button>
          )}
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            Nouvelle tournée
          </Button>
        </div>
      </div>

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
              onClick={() => {
                setSlice(s.value)
                setSelectedId(undefined)
              }}
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

      <TourCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setSelectedId(undefined)
        }}
      />

      {selectedTrip && (
        <TourPdaSimulatorModal
          open={pdaModalOpen}
          onOpenChange={setPdaModalOpen}
          trip={selectedTrip}
        />
      )}
    </PageShell>
  )
}
