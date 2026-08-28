import { createFileRoute } from '@tanstack/react-router'


import { SettingsPage } from '@/features/settings'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/settings/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: SettingsPage,


})