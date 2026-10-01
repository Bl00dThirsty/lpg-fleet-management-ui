import { createFileRoute } from '@tanstack/react-router'


import { AlertsPage } from '@/features/alerts'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/alerts/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: AlertsPage,


})