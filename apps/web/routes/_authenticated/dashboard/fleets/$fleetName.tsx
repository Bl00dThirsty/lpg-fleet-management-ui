import { createFileRoute } from '@tanstack/react-router'
import { FleetDetailPage } from '@/features/dashboard/dashboard-details'

export const Route = createFileRoute('/_authenticated/dashboard/fleets/$fleetName')({
  component: FleetDetailPage,
})
