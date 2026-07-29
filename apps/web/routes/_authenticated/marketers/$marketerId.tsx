import { createFileRoute } from '@tanstack/react-router'
import { MarketerDetailsPage } from '@/features/marketers/marketer-details'

export const Route = createFileRoute('/_authenticated/marketers/$marketerId')({
  component: MarketerDetailsPage,
})
