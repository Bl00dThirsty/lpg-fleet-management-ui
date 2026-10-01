import { createFileRoute } from '@tanstack/react-router'


import { CustomRolesPage } from '@/features/custom-roles'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/custom-roles/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: CustomRolesPage,


})