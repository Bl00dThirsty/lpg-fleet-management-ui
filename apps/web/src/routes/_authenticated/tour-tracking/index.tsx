import { createFileRoute, redirect } from '@tanstack/react-router'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'
import { ToursPage } from '@/features/tours'

export const Route = createFileRoute('/_authenticated/tour-tracking/')({
  beforeLoad: () => {
    throw redirect({ to: '/tours' })
  },
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
  component: ToursPage,
})


