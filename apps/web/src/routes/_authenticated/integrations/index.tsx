import { createFileRoute } from '@tanstack/react-router'


import { IntegrationsPage } from '@/features/integrations'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/integrations/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: IntegrationsPage,


})