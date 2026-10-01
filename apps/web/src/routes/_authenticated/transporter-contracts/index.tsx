import { createFileRoute } from '@tanstack/react-router'


import { TransporterContractsPage } from '@/features/transporter-contracts'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/transporter-contracts/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: TransporterContractsPage,


})