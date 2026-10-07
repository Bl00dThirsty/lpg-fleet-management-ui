import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { OrganizationFormPage } from '@/features/organizations/components/organization-form-page'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'
import type { OrganizationType } from '@lpg/types'

const searchSchema = z.object({
  type: z
    .enum(['REGULATEUR', 'DEPOT', 'MARKETEUR', 'TRANSPORTEUR', 'CLIENT'])
    .optional(),
})

export const Route = createFileRoute('/_authenticated/organizations/new')({
  validateSearch: (search) => searchSchema.parse(search),
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
  component: OrganizationNewRoute,
})

function OrganizationNewRoute() {
  const { type } = Route.useSearch()
  return (
    <OrganizationFormPage
      initialType={(type as OrganizationType) || 'MARKETEUR'}
      backTo='/organizations'
    />
  )
}
