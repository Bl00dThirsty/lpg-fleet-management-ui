import { createFileRoute } from '@tanstack/react-router'


import { NotificationRulesPage } from '@/features/notification-rules'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/notification-rules/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: NotificationRulesPage,


})