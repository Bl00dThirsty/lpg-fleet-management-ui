import { createFileRoute } from '@tanstack/react-router'


import { DeclarationsPage } from '@/features/declarations'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/declarations/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: DeclarationsPage,


})