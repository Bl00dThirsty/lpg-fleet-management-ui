import { createFileRoute } from '@tanstack/react-router'


import { AnomaliesPage } from '@/features/anomalies'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/anomalies/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: () => <AnomaliesPage track='ALL' />,


})