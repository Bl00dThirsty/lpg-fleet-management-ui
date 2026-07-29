import { createFileRoute } from '@tanstack/react-router'
import { MarketersPage } from '@/features/marketers'

export const Route = createFileRoute('/_authenticated/marketers/')({
  component: MarketersPage,
})
