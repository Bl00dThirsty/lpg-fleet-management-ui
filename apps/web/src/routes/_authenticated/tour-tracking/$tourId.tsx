import { createFileRoute, Link } from '@tanstack/react-router'


import { ArrowLeft } from 'lucide-react'


import { useMemo } from 'react'


import { Button } from '@/components/ui/button'


import { PageShell } from '@/components/layout/page'


import { PageHeader } from '@/components/layout/page-header'


import { SectionCard } from '@/components/layout/page'


import { getTourActivityById } from '@/features/tours/data/tour-activity'


import { TourActiveHeader } from '@/features/tours/components/tour-active-header'


import { TourDetailView } from '@/features/tours/components/tour-detail-view'


import { useAuthStore } from '@/store/auth-store'


import { useToursStore } from '@/store/tours-store'


import { getScope } from '@/features/scope/scope'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





function TourTrackingDetailPage() {


  const { tourId } = Route.useParams()


  const scope = useMemo(() => getScope(useAuthStore.getState().user), [])


  // Subscribe to the store so actions on this tour (start/close/ack) refresh


  // the detail immediately.


  const storeTours = useToursStore((s) => s.tours)


  const storeCheckpoints = useToursStore((s) => s.checkpoints)


  const trip = useMemo(


    () => getTourActivityById(tourId, scope),


    [tourId, scope, storeTours, storeCheckpoints],


  )





  if (!trip) {


    return (


      <PageShell>


        <PageHeader


          title='Tournée introuvable'


          description={`Aucune tournée ne correspond à l'identifiant ${tourId}.`}


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


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: TourTrackingDetailPage,


})


