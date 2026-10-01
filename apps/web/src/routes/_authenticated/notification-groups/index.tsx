import { createFileRoute } from '@tanstack/react-router'


import { NotificationGroupsPage } from '@/features/notification-groups'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/notification-groups/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: NotificationGroupsPage,


})