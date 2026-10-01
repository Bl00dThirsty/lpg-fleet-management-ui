import { createFileRoute } from '@tanstack/react-router'


import { PasswordsPage } from '@/features/passwords'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/passwords/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: PasswordsPage,


})