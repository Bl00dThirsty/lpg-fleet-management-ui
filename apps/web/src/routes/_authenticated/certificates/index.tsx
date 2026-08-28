import { createFileRoute } from '@tanstack/react-router'


import { CertificatesPage } from '@/features/certificates'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/certificates/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: CertificatesPage,


})


