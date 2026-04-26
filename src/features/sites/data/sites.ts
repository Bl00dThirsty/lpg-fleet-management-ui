export type SiteType =
  | 'depot'
  | 'scdp'
  | 'filling-center'
  | 'marketer'
  | 'delivery-point'

export type SiteStatus = 'active' | 'planned' | 'inactive'

export type Site = {
  id: string
  name: string
  type: SiteType
  city: string
  region: string
  operator: string
  latitude: number
  longitude: number
  description: string
  status: SiteStatus
  isKeySite?: boolean
}

export const siteTypeLabels: Record<SiteType, string> = {
  depot: 'Dépôts',
  scdp: 'Sites SCDP',
  'filling-center': 'Centres emplisseurs',
  marketer: 'Marketers',
  'delivery-point': 'Points de livraison',
}

export const siteStatusLabels: Record<SiteStatus, string> = {
  active: 'Actif',
  planned: 'Planifie',
  inactive: 'Inactif',
}

export const siteTypeOptions = [
  { label: 'Dépôts', value: 'depot' },
  { label: 'Sites SCDP', value: 'scdp' },
  { label: 'Centres emplisseurs', value: 'filling-center' },
  { label: 'Marketers', value: 'marketer' },
  { label: 'Points de livraison', value: 'delivery-point' },
] as const satisfies ReadonlyArray<{ label: string; value: SiteType }>

export const sites: Site[] = [
  {
    id: 'site-bipaga',
    name: 'Dépôt GPL de Bipaga',
    type: 'depot',
    city: 'Kribi',
    region: 'Sud',
    operator: 'SNH',
    latitude: 3.09783,
    longitude: 9.98989,
    description:
      'Point de chargement GPL dans la zone de Bipaga, alimente les tournées vers les marketers et centres emplisseurs.',
    status: 'active',
    isKeySite: true,
  },
  {
    id: 'site-scdp-douala',
    name: 'SCDP Douala',
    type: 'scdp',
    city: 'Douala',
    region: 'Littoral',
    operator: 'SCDP',
    latitude: 4.04902,
    longitude: 9.7198,
    description:
      'Complexe logistique de Douala, noeud majeur pour la distribution et le stockage des produits hydrocarbures.',
    status: 'active',
    isKeySite: true,
  },
  {
    id: 'site-scdp-yaounde',
    name: 'SCDP Yaounde - Nsam',
    type: 'scdp',
    city: 'Yaounde',
    region: 'Centre',
    operator: 'SCDP',
    latitude: 3.8398,
    longitude: 11.51372,
    description:
      'Site logistique de Nsam pour les operations de stockage et de redistribution sur Yaounde et le Centre.',
    status: 'active',
    isKeySite: true,
  },
  {
    id: 'site-bonaberi-center',
    name: 'Centre emplisseur Gaz de Bonaberi',
    type: 'filling-center',
    city: 'Douala',
    region: 'Littoral',
    operator: 'SCDP',
    latitude: 4.07142,
    longitude: 9.68177,
    description:
      "Centre d'enfutage et de redistribution GPL pour l'aire de Douala et une partie du reseau national.",
    status: 'active',
    isKeySite: true,
  },
  {
    id: 'site-bafoussam-center',
    name: 'Centre emplisseur Bafoussam',
    type: 'filling-center',
    city: 'Bafoussam',
    region: 'Ouest',
    operator: 'Hub Ouest',
    latitude: 5.4781,
    longitude: 10.4178,
    description:
      'Site de reception et de redistribution pour la zone Ouest, utile pour les releves de variation GPL.',
    status: 'active',
  },
  {
    id: 'site-tradex-akwa',
    name: 'Tradex Akwa',
    type: 'marketer',
    city: 'Douala',
    region: 'Littoral',
    operator: 'Tradex',
    latitude: 4.0498,
    longitude: 9.7679,
    description:
      'Point marketer de reference pour les livraisons urbaines sur Douala.',
    status: 'active',
  },
  {
    id: 'site-total-bonamoussadi',
    name: 'Total Bonamoussadi',
    type: 'marketer',
    city: 'Douala',
    region: 'Littoral',
    operator: 'Total Cameroun',
    latitude: 4.0912,
    longitude: 9.7411,
    description:
      'Point marketer de distribution pour le nord de Douala et les tournées de proximite.',
    status: 'active',
  },
  {
    id: 'site-total-ebolowa',
    name: 'Total Ebolowa',
    type: 'delivery-point',
    city: 'Ebolowa',
    region: 'Sud',
    operator: 'Total Cameroun',
    latitude: 2.9167,
    longitude: 11.15,
    description:
      'Point de livraison seed pour illustrer les tournées entre zone de chargement et destinations de distribution.',
    status: 'active',
  },
]

export function getKeySites() {
  return sites.filter((site) => site.isKeySite)
}
