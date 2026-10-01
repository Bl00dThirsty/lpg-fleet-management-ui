import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/general/')({
  beforeLoad: () => {
    throw redirect({
      to: '/settings/general/about',
    })
  },
})
