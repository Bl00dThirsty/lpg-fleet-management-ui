import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ProfilePage } from '@/features/settings/profile'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

const profileSearchSchema = z.object({
  tab: z.enum(['informations', 'notifications', 'preferences', 'security', 'groups']).optional(),
})

function ProfilePageWrapper() {
  const search = Route.useSearch()
  return <ProfilePage tab={search.tab} />
}

export const Route = createFileRoute('/_authenticated/settings/profile')({
  validateSearch: profileSearchSchema,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
  component: ProfilePageWrapper,
})