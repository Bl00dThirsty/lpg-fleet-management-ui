import { Truck } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'Operations',
      items: [
        {
          title: 'Camions',
          url: '/trucks',
          icon: Truck,
        },
      ],
    },
  ],
}
