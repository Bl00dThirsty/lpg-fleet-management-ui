import { createFileRoute } from '@tanstack/react-router'


import { MarketerDetailsPage } from '@/features/marketers/marketer-details'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/marketers/$marketerId')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: MarketerDetailsPage,


})


