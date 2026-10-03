import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { NationalMapPage } from '@/features/map'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'

export const Route = createFileRoute('/_authenticated/map/')({
  validateSearch: z.object({ zone: z.string().optional(), site: z.string().optional() }),
  component: NationalMapPage,
  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})