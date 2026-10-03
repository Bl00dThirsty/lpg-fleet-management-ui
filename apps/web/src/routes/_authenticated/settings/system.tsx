import { createFileRoute } from '@tanstack/react-router'
import { SystemSettingsPage } from '@/features/settings/system'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

export const Route = createFileRoute('/_authenticated/settings/system')({
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
  component: SystemSettingsPage,
})