import { createFileRoute } from '@tanstack/react-router'


import { ReconciliationsPage } from '@/features/reconciliations'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/reconciliations/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: ReconciliationsPage,


})