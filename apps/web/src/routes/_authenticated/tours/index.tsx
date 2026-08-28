import { createFileRoute } from '@tanstack/react-router'
import { ToursPage } from '@/features/tours'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

export const Route = createFileRoute('/_authenticated/tours/')({
  component: ToursPage,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})
