import { createFileRoute } from '@tanstack/react-router'


import { FinancePage } from '@/features/finance'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/finance/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: FinancePage,


})