import { createFileRoute } from '@tanstack/react-router'


import { OrganizationsPage } from '@/features/organizations'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/organizations/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: OrganizationsPage,


})