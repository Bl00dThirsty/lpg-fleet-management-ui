import { createFileRoute } from '@tanstack/react-router'
import { TourCreatePage } from '@/features/tours/components/tour-create-page'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'
export const Route = createFileRoute('/_authenticated/tour-tracking/new')({
  component: TourCreatePage,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})
