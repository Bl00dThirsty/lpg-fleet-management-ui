import { LayoutDashboard, Route, Truck, Building2 } from 'lucide-react'
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
          title: 'Camions',
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
          items: [
            { title: 'TOTALENERGIES', url: '/marketers/totalenergies' },
            { title: 'CAMGAZ', url: '/marketers/camgaz' },
            { title: 'OLA ENERGY', url: '/marketers/ola-energy' },
            { title: 'CORLAY', url: '/marketers/corlay' },
            { title: 'NEPTUNE', url: '/marketers/neptune' },
            { title: 'TRADEX', url: '/marketers/tradex' },
            { title: 'SCTM', url: '/marketers/sctm' },
            { title: 'AZA AFRIGAZ', url: '/marketers/aza-afrigaz' },
            { title: 'SEDECAM', url: '/marketers/sedecam' },
            { title: 'STARGAS', url: '/marketers/stargas' },
            { title: 'INFOTECH', url: '/marketers/infotech' },
            { title: 'GREEN OIL', url: '/marketers/green-oil' },
            { title: 'BOCOM', url: '/marketers/bocom' },
            { title: 'AKENO', url: '/marketers/akeno' },
            { title: 'TANK OIL', url: '/marketers/tank-oil' },
            { title: 'PETROLEX', url: '/marketers/petrolex' },
            { title: 'BLESSING', url: '/marketers/blessing' },
            { title: 'CAMOCO', url: '/marketers/camoco' },
            { title: 'GAMA ENERGY', url: '/marketers/gama-energy' },
            { title: 'BG PETROLEUM', url: '/marketers/bg-petroleum' },
            { title: 'VISION ENERGY', url: '/marketers/vision-energy' },
            { title: 'REAL OIL', url: '/marketers/real-oil' },
            { title: 'GLOBAL PT.', url: '/marketers/global-pt' },
            { title: 'TABE PET.', url: '/marketers/tabe-pet' },
            { title: 'GDC', url: '/marketers/gdc' },
          ],
        },
      ],
    },
  ],
}
