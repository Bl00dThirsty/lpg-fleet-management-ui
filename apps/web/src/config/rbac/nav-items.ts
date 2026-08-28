/**
 * Single-source-of-truth navigation manifest for the LPG platform.
 *
 * Every navigation link the UI can show is declared exactly once here,
 * tagged with the permission codes (from @lpg/permissions PERMISSION_CATALOG)
 * that an actor must hold in order to see it.
 *
 * `buildSidebarFor(role)` projects this master list onto a `Role` by checking
 * each item's `requires` against `ROLE_GRANTS[role]`. That means:
 *
 *   • adding a navigation item is a one-line change here,
 *   • removing a feature privilege from a role automatically hides the link,
 *   • screens and modules cannot accidentally expose routes a role cannot
 *     legitimately access, since the same matrix that gates the link also
 *     gates the screen (via AbilityContext).
 *
 * No role/feature/literal is hardcoded in sidebar-by-role.ts — that file
 * simply renders the projected tree for the active role.
 */

import {
  hasPermission,
  ROLES,
  ROLE_LABELS,
  type PermissionCode,
  type Role,
} from '@lpg/permissions'
import {
  Activity,
  AlertTriangle,
  Building2,
  ClipboardList,
  FileBarChart,
  FileText,
  FileWarning,
  Gauge,
  Globe,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  Map as MapIcon,
  MapPin,
  PackageCheck,
  Plug,
  RadioTower,
  Receipt,
  RefreshCw,
  Route,
  ScanLine,
  ScrollText,
  Search,
  ServerCog,
  Settings,
  ShieldCheck,
  Truck,
  Upload,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} from 'lucide-react'
import type { SidebarData } from '@/components/layout/types'

export type NavIcon = React.ComponentType<{ className?: string }>

export interface NavItemDecl {
  /** Stable identifier. Becomes a render key and a programmatic hook target. */
  id: string
  /** Permission codes the active role MUST hold to see this link. */
  requires: readonly PermissionCode[]
  /** i18n label (kept simple — French by default). */
  label: string
  /** Lucide icon component. */
  icon?: NavIcon
  /** Bare URL segment of the feature route (e.g. 'users' → '/users'). Static items use a literal path. */
  path?: string
  /** Set to true for items with a literal absolute path (e.g. '/grafana') that never takes a role prefix. */
  static?: boolean
  /** Visual badge (e.g. '!' for alerts). */
  badge?: string
  /** Optional secondary items only rendered when the parent is visible. */
  children?: readonly NavItemDecl[]
}

/** Section header — groups nav items under a titled bucket. */
export interface NavGroupDecl {
  id: string
  title: string
  items: readonly NavItemDecl[]
}

/** Top-level container — exactly one per role's sidebar. */
export interface NavRoleDecl {
  id: string
  title: string
  groups: readonly NavGroupDecl[]
}

/* --------------------------------------------------------------------------
 * MASTER CATALOG
 *
 * Every item the UI could ever render is declared exactly once below. Nothing
 * is hardcoded in consumers — `buildSidebarFor(role)` does the projection.
 *
 * The schema (TODO.md section 4 + CsphGplSchema v6.2) is the canonical authority
 * for which routes exist; permission codes come from @lpg/permissions.
 * --------------------------------------------------------------------------*/

export const NAV_CATALOG: readonly NavItemDecl[] = [
  /* ----------- Overview / piloting ----------- */
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: LayoutDashboard,
    path: 'overview',
    requires: ['overview.read'],
  },

  /* ----------- Dashboards ----------- */
  {
    id: 'dashboard',
    label: 'Tableau de bord national',
    icon: LayoutDashboard,
    path: 'dashboard',
    requires: ['dashboard.read'],
  },
  {
    id: 'dashboard-admin',
    label: 'Tableau de bord région',
    icon: LayoutDashboard,
    path: 'dashboard-admin',
    requires: ['dashboard.read'],
  },
  {
    id: 'dashboard-supervisor',
    label: 'Tableau de bord technique',
    icon: LayoutDashboard,
    path: 'dashboard-supervisor',
    requires: ['dashboard.read'],
  },
  {
    id: 'dashboard-marketeur',
    label: 'Tableau de bord marketeur',
    icon: LayoutDashboard,
    path: 'dashboard-marketeur',
    requires: ['dashboard.read'],
  },
  {
    id: 'dashboard-transporteur',
    label: 'Tableau de bord transporteur',
    icon: LayoutDashboard,
    path: 'dashboard-transporteur',
    requires: ['dashboard.read'],
  },
  {
    id: 'super-admin',
    label: 'Tours nationales (Super Admin)',
    icon: LayoutDashboard,
    path: 'super-admin/tours',
    requires: ['dashboard.read'],
  },

  /* ----------- Cartography ----------- */
  {
    id: 'map',
    label: 'Carte interactive',
    icon: MapIcon,
    path: 'map',
    requires: ['national-map.read'],
  },

  /* ----------- Entities: organizations, transporters, marketeurs, depots ----------- */
  {
    id: 'organizations',
    label: 'Toutes les organisations',
    icon: Building2,
    path: 'organizations',
    requires: ['orgs.read'],
  },
  {
    id: 'marketers',
    label: 'Marketeurs',
    icon: Building2,
    path: 'marketers',
    requires: ['markets.read'],
  },
  {
    id: 'transporters',
    label: 'Transporteurs',
    icon: Truck,
    path: 'transporters',
    requires: ['transporters.read'],
  },
  {
    id: 'depots',
    label: 'Dépôts (SCDP/SNH)',
    icon: Warehouse,
    path: 'depots',
    requires: ['orgs.read'],
  },

  /* ----------- Sites & client sites (schema splits these into two tables) ----------- */
  {
    id: 'sites',
    label: 'Sites opérationnels',
    icon: MapPin,
    path: 'sites',
    requires: ['sites.read'],
  },
  {
    id: 'client-sites',
    label: 'Sites clients',
    icon: MapPin,
    path: 'client-sites',
    requires: ['sites.read'],
  },
  {
    id: 'zones',
    label: 'Zones géographiques',
    icon: Globe,
    path: 'zones',
    requires: ['zones.read'],
  },
  {
    id: 'site-verifications',
    label: 'Vérification sites',
    icon: MapPin,
    path: 'site-verifications',
    requires: ['sites.verify'],
  },

  /* ----------- Users, roles, RBAC ----------- */
  {
    id: 'users',
    label: 'Utilisateurs & RBAC',
    icon: Users,
    path: 'users',
    requires: ['users.read'],
  },
  {
    id: 'permissions',
    label: 'Matrice de permissions',
    icon: ShieldCheck,
    path: 'permissions',
    requires: ['permissions.read'],
  },
  {
    id: 'custom-roles',
    label: 'Rôles personnalisés',
    icon: ShieldCheck,
    path: 'custom-roles',
    requires: ['custom-roles.manage', 'roles.read'],
  },

  /* ----------- Vehicles, certificates, devices (unified GPS/PDA/RFIDREADER) ----------- */
  {
    id: 'trucks',
    label: 'Véhicules (Parc national)',
    icon: Truck,
    path: 'trucks',
    requires: ['trucks.read'],
  },
  {
    id: 'vehicles',
    label: 'Ma flotte véhicules',
    icon: Truck,
    path: 'vehicles',
    requires: ['trucks.read'],
  },
  {
    id: 'certificates',
    label: 'Certificats de jaugeage',
    icon: ShieldCheck,
    path: 'certificates',
    requires: ['certificates.read'],
  },
  {
    id: 'devices',
    label: 'Appareils IoT',
    icon: RadioTower,
    path: 'devices',
    requires: ['devices.read'],
  },
  {
    id: 'rfid-tags',
    label: 'Tags RFID',
    icon: ScanLine,
    path: 'rfid-tags',
    requires: ['rfid.read'],
  },
  {
    id: 'gps-config',
    label: 'Config GPS',
    icon: MapPin,
    path: 'gps-config',
    requires: ['devices.write'],
  },
  {
    id: 'device-assignments',
    label: 'Affectations appareils',
    icon: Link2,
    path: 'device-assignments',
    requires: ['devices.read'],
  },
  {
    id: 'firmware',
    label: 'Mises à jour firmware',
    icon: Upload,
    path: 'firmware',
    requires: ['devices.manage'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance préventive',
    icon: Wrench,
    path: 'maintenance',
    requires: ['devices.manage'],
  },

  /* ----------- Operations: pickups + tours ----------- */
  {
    id: 'pickups',
    label: 'Approvisionnements (Flux 1)',
    icon: PackageCheck,
    path: 'pickups',
    requires: ['pickups.read'],
  },
  {
    id: 'pickup-tracking',
    label: 'Suivi enlèvements',
    icon: MapIcon,
    path: 'pickup-tracking',
    requires: ['pickups.read'],
  },
  {
    id: 'tours',
    label: 'Tournées de livraison',
    icon: Route,
    path: 'tours',
    requires: ['tours.read'],
  },
  {
    id: 'tour-tracking',
    label: 'Suivi des tournées',
    icon: MapIcon,
    path: 'tour-tracking',
    requires: ['tours.read'],
  },

  /* ----------- Compliance: declarations → reconciliations → redressements ----------- */
  {
    id: 'declarations',
    label: 'Déclarations',
    icon: ClipboardList,
    path: 'declarations',
    requires: ['declarations.read'],
  },
  {
    id: 'reconciliations',
    label: 'Réconciliations',
    icon: FileBarChart,
    path: 'reconciliations',
    requires: ['reconciliations.read'],
  },
  {
    id: 'redressements',
    label: 'Redressements',
    icon: Receipt,
    path: 'redressements',
    requires: ['redressements.read'],
  },

  /* ----------- Anomalies (dual-track INVESTIGATION vs TECHNICAL) ----------- */
  {
    id: 'anomalies',
    label: 'Anomalies',
    icon: AlertTriangle,
    path: 'anomalies',
    requires: ['anomalies.read'],
  },
  {
    id: 'anomalies-investigation',
    label: 'Piste Investigation',
    icon: Search,
    path: 'anomalies/investigation',
    requires: ['anomalies.investigate'],
  },
  {
    id: 'anomalies-technical',
    label: 'Piste Technique',
    icon: ServerCog,
    path: 'anomalies/technical',
    requires: ['devices.read', 'anomalies.read'],
  },

  /* ----------- Risk + anomalies management ----------- */
  {
    id: 'risk-scores',
    label: 'Scores de risque',
    icon: FileWarning,
    path: 'risk-scores',
    requires: ['risks.read'],
  },
  {
    id: 'recompute',
    label: 'Recompute manuel',
    icon: RefreshCw,
    path: 'recompute',
    requires: ['risks.manage'],
  },

  /* ----------- MARKEUR-specific ----------- */
  {
    id: 'drivers',
    label: 'Chauffeurs',
    icon: Users,
    path: 'drivers',
    requires: ['drivers.read'],
  },
  {
    id: 'livreurs',
    label: 'Livreurs PDA',
    icon: RadioTower,
    path: 'livreurs',
    requires: ['livreurs.read'],
  },
  {
    id: 'transporter-contracts',
    label: 'Contrats transporteurs',
    icon: FileText,
    path: 'transporter-contracts',
    requires: ['contracts.read'],
  },
  {
    id: 'clients',
    label: 'Clients & sites livraison',
    icon: Building2,
    path: 'clients',
    requires: ['sites.read'],
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Activity,
    path: 'performance',
    requires: ['reports.read'],
  },
  {
    id: 'quotas',
    label: 'Quotas & volumes',
    icon: Gauge,
    path: 'quotas',
    requires: ['quotas.read'],
  },
  {
    id: 'supply',
    label: 'Requête d\'enlèvement',
    icon: PackageCheck,
    path: 'supply',
    requires: ['pickups.create'],
  },

  /* ----------- TRANSPORTEUR-specific ----------- */
  {
    id: 'contracts',
    label: 'Contrats marketeurs',
    icon: ShieldCheck,
    path: 'contracts',
    requires: ['transporters.read'],
  },

  /* ----------- LIVREUR/PDA-specific -----------
   * Deferred: 9 PDA screens (missions, tour-start, checkpoints, scan-rfid,
   * scan-vrac, photos, sync, sync-status, offline-data) removed from nav.
   * Re-introduce when a dedicated LIVREUR milestone adds the routes.
   */

  /* ----------- AGENT-specific ----------- */
  {
    id: 'visits',
    label: 'Rapports de visite terrain',
    icon: ListChecks,
    path: 'visits',
    requires: ['tours.read'],
  },
  {
    id: 'passwords',
    label: 'Reset mots de passe',
    icon: KeyRound,
    path: 'passwords',
    requires: ['users.reset'],
  },

  /* ----------- ADMIN-specific ----------- */
  {
    id: 'alert-rules',
    label: 'Règles d\'alerte',
    icon: ShieldCheck,
    path: 'alert-rules',
    requires: ['alerts.write'],
  },

  /* ----------- FINANCE ----------- */
  {
    id: 'finance',
    label: 'Indicateurs financiers',
    icon: Wallet,
    path: 'finance',
    requires: ['subsidies.read'],
  },

  /* ----------- NOTIFICATIONS ----------- */
  {
    id: 'notification-rules',
    label: 'Règles de notification',
    icon: Settings,
    path: 'notification-rules',
    requires: ['notification-rules.write'],
  },
  {
    id: 'notification-groups',
    label: 'Groupes de notification',
    icon: UserCog,
    path: 'settings/notification-groups',
    requires: ['notification-groups.write'],
  },

  /* ----------- REPORTS / AUDIT ----------- */
  {
    id: 'reports',
    label: 'Rapports & exports',
    icon: FileBarChart,
    path: 'reports',
    requires: ['reports.read'],
  },
  {
    id: 'audit-logs',
    label: 'Journal d\'audit',
    icon: ScrollText,
    path: 'audit-logs',
    requires: ['audit-logs.read'],
  },

  /* ----------- CONFIG ----------- */
  {
    id: 'settings',
    label: 'Paramètres globaux',
    icon: Gauge,
    path: 'settings/system',
    requires: ['settings.read'],
  },

  /* ----------- OPS / MONITORING ----------- */
  {
    id: 'system-health',
    label: 'Santé système',
    icon: HeartPulse,
    path: 'system-health',
    requires: ['system-health.read'],
  },
  {
    id: 'system-metrics',
    label: 'Métriques système',
    icon: Gauge,
    path: 'system-metrics',
    requires: ['metrics.read'],
  },
  {
    id: 'infra',
    label: 'Dashboards Grafana',
    icon: ServerCog,
    path: 'infra',
    requires: ['metrics.read'],
  },
  {
    id: 'alerts',
    label: 'Alertes infrastructure',
    icon: AlertTriangle,
    path: 'alerts',
    badge: '!',
    requires: ['alerts.read'],
  },
  {
    id: 'gps-tracking',
    label: 'Tracking GPS',
    icon: MapIcon,
    path: 'gps-tracking',
    requires: ['metrics.read'],
  },
  {
    id: 'device-health',
    label: 'Santé appareils',
    icon: RadioTower,
    path: 'device-health',
    requires: ['devices.read'],
  },
  {
    id: 'integrations',
    label: 'État intégrations',
    icon: Plug,
    path: 'integrations',
    requires: ['integrations.read'],
  },
  {
    id: 'logs',
    label: 'Logs centralisés',
    icon: Activity,
    path: 'logs',
    requires: ['audit-logs.read'],
  },

  /* ----------- Static / external links ----------- */
  {
    id: 'grafana',
    label: 'Dashboards Grafana',
    icon: ServerCog,
    path: '/grafana',
    static: true,
    requires: ['metrics.read'],
  },
  {
    id: 'prometheus',
    label: 'Métriques Prometheus',
    icon: Activity,
    path: '/prometheus',
    static: true,
    requires: ['metrics.read'],
  },

  /* ----------- Visits / show screens ----------- */
] as const

/* --------------------------------------------------------------------------
 * ROLE → GROUP DECLARATIONS
 *
 * Roles are declared once here. Group titles use ROLE_LABELS from
 * @lpg/permissions so this remains the single source for human-readable
 * role names. Items within each group are referenced by id from the
 * NAV_CATALOG so adding/removing items requires zero changes in this file.
 * --------------------------------------------------------------------------*/

interface RoleGroupSpec {
  /** Nav item ids (from NAV_CATALOG) — order is the rendering order. */
  items: readonly string[]
  /** Group title shown in the sidebar. */
  title: string
}

interface RoleDecl {
  groups: readonly RoleGroupSpec[]
}

/**
 * Web-facing roles only. LIVREUR is PDA-only — no web UI is rendered for it;
 * any appearance here is purely defensive (e.g. role switcher integrity).
 */
export const WEB_ROLES = ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'INTEGRATEUR', 'AGENT', 'MARKETEUR', 'TRANSPORTEUR'] as const

const ROLE_NAV_DECL: Record<Role, RoleDecl> = {
  SUPERADMIN: {
    groups: [
      { title: 'Pilotage national', items: ['overview', 'map', 'finance', 'risk-scores', 'dashboard'] },
      {
        title: 'Entités',
          items: [
          'organizations',
          'marketers',
          'transporters',
          'depots',
          'sites',
          'client-sites',
          'zones',
           'users',
           'trucks',
           'certificates',
          'devices',
        ],
      },
      {
        title: 'Opérations & Contrôle',
        items: [
          'pickups',
          'tours',
          'tour-tracking',
          'declarations',
          'reconciliations',
          'redressements',
          'anomalies-investigation',
          'anomalies-technical',
        ],
      },
      {
        title: 'Configuration système',
        items: [
          'settings',
          'custom-roles',
          'notification-rules',
          'transporter-contracts',
          'reports',
          'audit-logs',
        ],
      },
      {
        title: 'Monitoring infrastructure',
        items: ['grafana', 'prometheus', 'system-health'],
      },
    ],
  },
  ADMIN: {
    groups: [
      { title: 'Gestion', items: ['overview', 'users', 'marketers', 'transporters', 'dashboard-admin'] },
      {
        title: 'Validation & Contrôle',
        items: ['site-verifications', 'pickups', 'declarations', 'reconciliations'],
      },
      {
        title: 'Anomalies & Risques',
        items: ['anomalies', 'risk-scores', 'alert-rules'],
      },
      { title: 'Rapports', items: ['reports', 'audit-logs'] },
    ],
  },
  SUPERVISOR: {
    groups: [
      { title: 'Monitoring technique', items: ['overview', 'infra', 'system-metrics', 'system-health', 'dashboard-supervisor'] },
      {
        title: 'Piste technique (Anomalies)',
        items: ['device-health', 'gps-tracking', 'alerts', 'anomalies-technical'],
      },
      { title: 'Risque & Recompute', items: ['risk-scores', 'recompute'] },
      { title: 'Logs & Intégration', items: ['logs', 'integrations'] },
    ],
  },
  INTEGRATEUR: {
    groups: [
      {
        title: 'Matériel IoT',
        items: ['overview', 'devices', 'rfid-tags', 'gps-config'],
      },
      {
        title: 'Authentification & Sécurité',
        items: ['users', 'device-assignments'],
      },
      { title: 'Maintenance', items: ['maintenance', 'firmware', 'logs'] },
    ],
  },
  AGENT: {
    groups: [
      { title: 'Suivi terrain', items: ['overview', 'marketers', 'client-sites'] },
      {
        title: 'Investigation (Piste métier)',
        items: ['declarations', 'anomalies-investigation', 'tours', 'tour-tracking', 'visits'],
      },
      { title: 'Actions', items: ['reconciliations', 'passwords'] },
    ],
  },
  MARKETEUR: {
    groups: [
       { title: 'Ma flotte', items: ['overview', 'vehicles', 'drivers', 'devices', 'dashboard-marketeur'] },
      {
        title: 'Flux 1 — Approvisionnement',
        items: ['pickups', 'pickup-tracking'],
      },
      {
        title: 'Flux 2 — Livraison',
         items: ['tours', 'tour-tracking', 'transporter-contracts', 'clients'],
      },
      {
        title: 'Déclarations & Performance',
        items: ['declarations', 'performance', 'reports'],
      },
    ],
  },
TRANSPORTEUR: {
    groups: [
      {
        title: 'Opérations',
         items: ['overview', 'tours', 'tour-tracking', 'dashboard-transporteur'],
      },
       { title: 'Ma flotte', items: ['vehicles', 'drivers', 'livreurs'] },
      { title: 'Contrats & Clients', items: ['contracts', 'performance'] },
    ],
  },
  LIVREUR: {
    groups: [
      // PDA group deferred: 9 screens (missions, tour-start, checkpoints,
      // scan-rfid, scan-vrac, photos, sync, sync-status, offline-data) had no
      // on-disk route. Re-introduce when a dedicated LIVREUR milestone lands.
    ],
  },
}

/* --------------------------------------------------------------------------
 * PROJECTION (the entire reason this file exists)
 *
 * Filter the master catalog against `ROLE_GRANTS[role]`, then assemble a
 * `SidebarData` per the role's group declarations. Empty groups drop out
 * automatically — so dropping a role's grants on a permission naturally
 * hides the link.
 * --------------------------------------------------------------------------*/

const ITEM_BY_ID = new Map(NAV_CATALOG.map((item) => [item.id, item]))

function isVisibleTo(role: Role, item: NavItemDecl): boolean {
  return item.requires.some((code) => hasPermission(role, code))
}

function visibleIdsFor(role: Role): Set<string> {
  const visible = new Set<string>()
  for (const item of NAV_CATALOG) if (isVisibleTo(role, item)) visible.add(item.id)
  return visible
}

/**
 * Resolve a nav item's absolute feature path (AGENTS.md §5 — bare paths only,
 * no role prefix). Static items keep their literal path (e.g. '/grafana');
 * others become `/<path>` (or `/<id>` when no path is declared).
 *
 * Single source of truth — the sidebar and the route guard both use this so
 * a link can never exist that the guard doesn't know how to authorize.
 */
export function resolveFeaturePath(decl: NavItemDecl): string {
  return decl.static ? decl.path ?? '/' : `/${decl.path ?? decl.id}`
}

function toSidebarItem(_role: Role, decl: NavItemDecl) {
  return {
    title: decl.label,
    url: resolveFeaturePath(decl),
    icon: decl.icon,
    badge: decl.badge,
  }
}

/**
 * Build the sidebar for a role. Pure — recompute on role change.
 */
export function buildSidebarFor(role: Role): SidebarData {
  const decl = ROLE_NAV_DECL[role]
  const visible = visibleIdsFor(role)
  if (!decl) return { navGroups: [] }

  const navGroups = decl.groups
    .map((group) => {
      const items = group.items
        .map((id) => ITEM_BY_ID.get(id))
        .filter((item): item is NavItemDecl => {
          if (!item) return false
          return visible.has(item.id)
        })
        .map((item) => toSidebarItem(role, item))
      return items.length ? { title: group.title, items } : null
    })
    .filter((group): group is { title: string; items: ReturnType<typeof toSidebarItem>[] } => group !== null)

  return { navGroups }
}

/**
 * Roles that get a web sidebar at all. LIVREUR is PDA-only.
 */
export function isWebRole(role: Role): boolean {
  return (WEB_ROLES as readonly Role[]).includes(role)
}

/* Re-export for consumers that want the canonical human label. */
export { ROLES, ROLE_LABELS }