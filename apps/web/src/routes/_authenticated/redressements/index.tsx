import { createFileRoute } from '@tanstack/react-router'


import { RedressementsPage } from '@/features/redressements'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/redressements/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: RedressementsPage,


})