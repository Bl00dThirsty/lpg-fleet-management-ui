import { createFileRoute } from '@tanstack/react-router'
import { RoutesPage } from '@/features/routes'

export const Route = createFileRoute('/_authenticated/routes/')({
  component: RoutesPage,
})
