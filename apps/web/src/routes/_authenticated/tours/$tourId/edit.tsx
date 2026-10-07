import { createFileRoute } from '@tanstack/react-router'
import { TourEditPage } from '@/features/tours/components/tour-edit-page'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

export const Route = createFileRoute('/_authenticated/tours/$tourId/edit')({
  component: TourEditRoute,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})

function TourEditRoute() {
  const { tourId } = Route.useParams()
  return <TourEditPage tourId={tourId} />
}
