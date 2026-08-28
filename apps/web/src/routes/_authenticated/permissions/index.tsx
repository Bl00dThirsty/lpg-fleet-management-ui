import { createFileRoute } from '@tanstack/react-router'


import { PermissionsPage } from '@/features/permissions'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/permissions/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: PermissionsPage,


})