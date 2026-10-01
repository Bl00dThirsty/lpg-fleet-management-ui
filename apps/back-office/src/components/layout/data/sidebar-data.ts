import { LayoutDashboard, Route, Truck, Building2, Handshake, MapIcon, Server } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
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
    {
      title: 'Opérations',
      items: [
        {
          title: 'Tournées GPL',
          url: '/routes',
          icon: Route,
        },
        {
          title: 'Flotte',
          url: '/trucks',
          icon: Truck,
        },
      ],
    },
    {
      title: 'Acteurs',
      items: [
        {
          title: 'Marketers',
          icon: Building2,
          url: '/marketers',
        },
        {
          title: 'Transporteurs',
          icon: Handshake,
          url: '/transporters',
        },
      ],
    },
    {
      title: 'Activité',
      items: [
        {
          title: 'Suivi de mes tournées',
          icon: MapIcon,
          url: '/activity/trip-tracking',
        },
      ],
    },
    {
      title: 'Administration & Système',
      items: [
        {
          title: 'Infrastructure',
          icon: Server,
          url: '/infrastructure',
        },
      ],
    },
  ],
}
