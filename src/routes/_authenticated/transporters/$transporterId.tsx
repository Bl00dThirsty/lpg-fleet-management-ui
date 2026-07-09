import { createFileRoute } from '@tanstack/react-router'
import { TransporterDetailsPage } from '@/features/transporters/transporter-details'

export const Route = createFileRoute('/_authenticated/transporters/$transporterId')({
  component: TransporterDetailsPage,
})
