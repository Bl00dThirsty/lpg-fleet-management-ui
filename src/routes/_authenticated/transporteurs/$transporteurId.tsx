import { createFileRoute } from '@tanstack/react-router'
import { TransporteurDetailsPage } from '@/features/transporteurs/transporteur-details'

export const Route = createFileRoute('/_authenticated/transporteurs/$transporteurId')({
  component: TransporteurDetailsPage,
})
