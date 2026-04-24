import { LayoutDashboard, Route, Truck } from 'lucide-react'
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
        {
          title: 'Tournees GPL',
          url: '/routes',
          icon: Route,
        },
      ],
    },
    {
      title: 'Pilotage',
      items: [
        {
          title: 'Tableau de bord global',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
  ],
}
