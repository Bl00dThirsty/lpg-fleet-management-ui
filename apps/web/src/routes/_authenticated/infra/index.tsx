import { createFileRoute } from '@tanstack/react-router'


import { InfraPage } from '@/features/infra'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/infra/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: InfraPage,


})