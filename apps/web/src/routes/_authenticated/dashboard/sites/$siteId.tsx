import { createFileRoute } from '@tanstack/react-router'
import { ReserveSiteDetailPage } from '@/features/dashboard/dashboard-details'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

export const Route = createFileRoute('/_authenticated/dashboard/sites/$siteId')({
  component: ReserveSiteDetailPage,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})