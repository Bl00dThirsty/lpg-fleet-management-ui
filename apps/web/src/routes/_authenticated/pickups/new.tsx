import { createFileRoute } from '@tanstack/react-router'
import { PickupCreatePage } from '@/features/pickups/components/pickup-create-page'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'
export const Route = createFileRoute('/_authenticated/pickups/new')({
  component: PickupCreatePage,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})
