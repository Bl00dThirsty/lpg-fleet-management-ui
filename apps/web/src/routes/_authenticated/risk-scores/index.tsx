import { createFileRoute } from '@tanstack/react-router'


import { RiskScoresPage } from '@/features/risks'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/risk-scores/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: RiskScoresPage,


})