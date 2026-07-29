import { ROLE_LABELS } from '@/config/rbac/roles'
import { roleFromSlug } from '@/config/rbac/sidebar-by-role'

export type Breadcrumb = { label: string; to: string }

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  trucks: 'Camions',
  transporters: 'Transporteurs',
  marketers: 'Marketeurs',
  routes: 'Tournées',
  activity: 'Activité',
  'trip-tracking': 'Suivi camions',
  settings: 'Paramètres',
  profile: 'Profil',
  'notification-groups': 'Groupes de notification',
  vehicles: 'Véhicules',
  cylinders: 'Citernes',
  maintenance: 'Entretien',
  tracking: 'Suivi',
  drivers: 'Chauffeurs',
  reports: 'Rapports',

}

function resolveSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]

  const role = roleFromSlug(segment)
  if (role) return ROLE_LABELS[role] ?? segment

  return segment
}

export function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Breadcrumb[] = []
  let acc = ''
  for (const seg of segments) {
    acc += `/${seg}`
    crumbs.push({ label: resolveSegmentLabel(seg), to: acc })
  }
  return crumbs
}
