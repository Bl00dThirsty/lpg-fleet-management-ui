import { createFileRoute } from '@tanstack/react-router'


import { AlertRulesPage } from '@/features/alert-rules'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/alert-rules/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: AlertRulesPage,


})