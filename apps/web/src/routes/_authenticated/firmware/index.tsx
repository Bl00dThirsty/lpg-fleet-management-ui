import { createFileRoute } from '@tanstack/react-router'


import { FirmwarePage } from '@/features/firmware'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/firmware/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: FirmwarePage,


})