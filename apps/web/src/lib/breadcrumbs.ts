const LABEL_MAP: Record<string, string> = {
  login: 'Connexion',
  dashboard: 'Tableau de bord',
  trucks: 'Camions',
  marketers: 'Marketeurs',
  tours: "Tournées",
  declarations: 'Déclarations',
  anomalies: 'Anomalies',
  reports: 'Rapports',
  'trip-tracking': 'Suivi camions',
  routes: 'Tournées en cours',
  settings: 'Paramètres',
  profile: 'Profil',
  'notification-groups': 'Groupes de notification',
  transporters: 'Transporteurs',
  drivers: 'Chauffeurs',
  pickups: 'Approvisionnements',
  pda: 'PDA',
  'rfid-tags': 'Tags RFID',
  reconciliations: 'Réconciliations',
  redressements: 'Redressements',
  risks: 'Risques',
  organizations: 'Organisations',
  sites: 'Sites',
  users: 'Utilisateurs',
}

function labelFor(segment: string): string {
  if (LABEL_MAP[segment]) return LABEL_MAP[segment]
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function generateBreadcrumbs(
  pathname: string
): { to: string; label: string }[] {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return []

  const crumbs: { to: string; label: string }[] = []
  let cumulative = ''

  for (const segment of segments) {
    cumulative += `/${segment}`
    crumbs.push({ to: cumulative, label: labelFor(segment) })
  }

  return crumbs
}