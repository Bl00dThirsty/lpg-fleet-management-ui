import { createFileRoute } from '@tanstack/react-router'


import { ClientsPage } from '@/features/clients'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/clients/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: ClientsPage,


})