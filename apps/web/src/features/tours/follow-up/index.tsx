import { useNavigate } from '@tanstack/react-router'
import { PageShell } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { SectionCard } from '@/components/layout/page'
import { TourActiveHeader } from '../components/tour-active-header'
import { ToursTable } from '../components/tours-table'
import { getTourActivity, type TourActivity } from '../data/tour-activity'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'

function isActive(tour: TourActivity): boolean {
  return tour.tourneeStatus === 'INPROGRESS' || tour.tourneeStatus === 'CHECKPOINTACTIVE'
}

export function FollowUpPage() {
  const allTours = getTourActivity('ALL', getScope(useAuthStore.getState().user))
  const tours = allTours.filter(isActive)
  const navigate = useNavigate()
  const selectedTrip = tours[0]
  const selectedTripId = selectedTrip?.id

  function openDetail(id: string) {
    navigate({ to: '/tour-tracking/$tourId', params: { tourId: id } })
  }

  return (
    <PageShell>
      <PageHeader
        title='Suivi des tournées'
        description='Tournées en cours de livraison.'
      />
      {selectedTrip && (
        <TourActiveHeader
          trip={selectedTrip}
          trips={tours}
          onSelectTrip={(id) => navigate({
            to: '/tour-tracking/$tourId',
            params: { tourId: id },
          })}
        />
      )}
      <SectionCard>
        <ToursTable
          rows={tours}
          selectedTripId={selectedTripId}
          onOpenDetails={(row) => openDetail(row.id)}
        />
      </SectionCard>
    </PageShell>
  )
}
