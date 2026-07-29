import { createFileRoute } from '@tanstack/react-router'
import { ReserveSiteDetailPage } from '@/features/dashboard/dashboard-details'

export const Route = createFileRoute('/_authenticated/dashboard/sites/$siteId')({
  component: ReserveSiteDetailPage,
})
