import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'
import { useEffect, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { SectionCard } from '@/components/layout/page'
import { getTourActivityById } from '@/features/tours/data/tour-activity'
import { TourDetailView } from '@/features/tours/components/tour-detail-view'
import { useToursStore } from '@/store/tours-store'
import { useTourLiveRefresh } from '@/features/tours/lib/use-tour-live-refresh'

function TourTrackingDetailPage() {
  const { tourId } = Route.useParams()
  const tours = useToursStore((s) => s.tours)
  const storeCheckpoints = useToursStore((s) => s.checkpoints)
  const checkpointsLoading = useToursStore(
    (s) => s.checkpointsLoading[tourId] ?? false
  )
  const toursLoading = useToursStore((s) => s.loading)
  const hasLoaded = useToursStore((s) => s.hasLoaded)
  const isPending = toursLoading || checkpointsLoading || !hasLoaded

  useEffect(() => {
    useToursStore.getState().fetchTours()
    useToursStore
      .getState()
      .fetchCheckpoints(tourId)
      .catch((err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Points de contrôle indisponibles'
        )
      })
  }, [tourId])

  useTourLiveRefresh(tourId)

  const trip = useMemo(
    () => getTourActivityById(tourId, { checkpoints: storeCheckpoints }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tourId, tours, storeCheckpoints]
  )

  if (!trip) {
    return (
      <PageShell>
        <PageHeader
          title={isPending ? 'Chargement de la tournée' : 'Tournée introuvable'}
          description={
            isPending
              ? 'Lecture en cours des données temps réel…'
              : `Aucune tournée ne correspond à l'identifiant ${tourId}.`
          }
        />
        <SectionCard>
          <Button asChild variant='outline'>
            <Link to='/tour-tracking' data-icon='inline-start'>
              <ArrowLeft />
              Retour au suivi
            </Link>
          </Button>
        </SectionCard>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title='Suivi de la tournée'
        description={`Lecture temps réel du niveau GPL, du volume estimé, des étapes et des alertes terrain pour la tournée ${trip.reference}.`}
      />
      <TourDetailView trip={trip} />
    </PageShell>
  )
}

export const Route = createFileRoute('/_authenticated/tour-tracking/$tourId')({
  component: TourTrackingDetailPage,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})
