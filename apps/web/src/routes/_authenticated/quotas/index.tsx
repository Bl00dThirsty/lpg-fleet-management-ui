import { createFileRoute } from '@tanstack/react-router'


import { QuotasPage } from '@/features/quotas'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/quotas/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: QuotasPage,


})