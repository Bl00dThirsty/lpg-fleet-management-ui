import { createFileRoute } from '@tanstack/react-router'


import { ContractsPage } from '@/features/contracts'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/contracts/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: ContractsPage,


})