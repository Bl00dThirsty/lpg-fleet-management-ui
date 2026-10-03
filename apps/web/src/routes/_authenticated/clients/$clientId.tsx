import { createFileRoute } from '@tanstack/react-router'
import { ClientDetailPage } from '@/features/clients/components/client-detail-page'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

export const Route = createFileRoute('/_authenticated/clients/$clientId')({
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
  component: ClientDetailRouteComponent,
})

function ClientDetailRouteComponent() {
  const { clientId } = Route.useParams()
  return <ClientDetailPage clientId={clientId} />
}
