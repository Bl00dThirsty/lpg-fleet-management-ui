import { createFileRoute } from '@tanstack/react-router'


import { SupplyRequestPage } from '@/features/supply'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/supply/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: SupplyRequestPage,


})