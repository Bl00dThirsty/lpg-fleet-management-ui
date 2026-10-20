import { createFileRoute } from '@tanstack/react-router'
import { IntegrateurDashboardPage } from '@/features/integrateur-dashboard'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

export const Route = createFileRoute('/_authenticated/dashboard-integrateur/')({
  component: IntegrateurDashboardPage,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})
