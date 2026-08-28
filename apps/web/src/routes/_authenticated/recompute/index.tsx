import { createFileRoute } from '@tanstack/react-router'


import { RecomputePage } from '@/features/recompute'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/recompute/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: RecomputePage,


})