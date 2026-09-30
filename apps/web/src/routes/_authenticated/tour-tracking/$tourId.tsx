import { useEffect, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { SectionCard } from '@/components/layout/page'
import { getTourActivityById } from '@/features/tours/data/tour-activity'
import { TourActiveHeader } from '@/features/tours/components/tour-active-header'
import { TourDetailView } from '@/features/tours/components/tour-detail-view'
import { useToursStore } from '@/store/tours-store'

function TourTrackingDetailPage() {
  const { tourId } = Route.useParams()
  const tours = useToursStore((s) => s.tours)
  const storeCheckpoints = useToursStore((s) => s.checkpoints)
  const checkpointsLoading = useToursStore((s) => s.checkpointsLoading[tourId] ?? false)
  const toursLoading = useToursStore((s) => s.loading)

  useEffect(() => {
    useToursStore.getState().fetchTours()
    useToursStore
      .getState()
      .fetchCheckpoints(tourId)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Points de contrôle indisponibles')
      })
  }, [tourId])

  const trip = useMemo(
    () => getTourActivityById(tourId, { checkpoints: storeCheckpoints }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tourId, tours, storeCheckpoints],
  )

  if (!trip) {
    return (
      <PageShell>
        <PageHeader
          title={toursLoading || checkpointsLoading ? 'Chargement de la tournée' : 'Tournée introuvable'}
          description={
            toursLoading || checkpointsLoading
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
      <TourActiveHeader trip={trip} trips={[trip]} onSelectTrip={() => undefined} />
      <TourDetailView trip={trip} />
    </PageShell>
  )
}

export const Route = createFileRoute('/_authenticated/tour-tracking/$tourId')({
  component: TourTrackingDetailPage,
})
